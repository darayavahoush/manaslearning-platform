"""
vaakbot backend — FastAPI app wrapping the RAG query logic with
per-session conversation memory (capped at MAX_TURNS user turns,
after which it resets and asks the user to start fresh).
"""

import os
import uuid
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
import time
from collections import defaultdict, deque
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.models import VectorizedQuery
from azure.storage.blob import BlobServiceClient
from fastapi.responses import StreamingResponse, HTMLResponse
from urllib.parse import quote
from html import escape
import io
import re
import docx as docx_lib
import pdfplumber

AOAI_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT"]
AOAI_KEY = os.environ["AZURE_OPENAI_KEY"]
CHAT_DEPLOYMENT = os.environ.get("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-5.4-nano")
EMBED_DEPLOYMENT = os.environ.get("AZURE_OPENAI_EMBED_DEPLOYMENT", "text-embedding-3-small")
EMBED_DIM = 512  # must match ingest.py and the search index's vector field

SEARCH_ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
SEARCH_KEY = os.environ["AZURE_SEARCH_KEY"]
SEARCH_INDEX = os.environ.get("AZURE_SEARCH_INDEX", "vaakbot-docs")

STORAGE_ACCOUNT = os.environ["AZURE_STORAGE_ACCOUNT"]
STORAGE_KEY = os.environ["AZURE_STORAGE_KEY"]
STORAGE_CONTAINER = os.environ.get("AZURE_STORAGE_CONTAINER", "docs")

blob_service = BlobServiceClient(
    account_url=f"https://{STORAGE_ACCOUNT}.blob.core.windows.net",
    credential=STORAGE_KEY,
)

TOP_K = 5
MIN_SCORE = 0.71
MAX_TURNS = 5

SYSTEM_PROMPT = """You are Milo the Owl, a warm, gentle, and knowledgeable pediatric learning companion for parents, caregivers, and educators at Manas Learning.

Core Identity & Background Knowledge:
- Founder & Director: Manasi Valluri, a passionate pediatric developmental specialist and special educator with over 15+ years of clinical and educational experience. Based in Chennai, India, she established Manas Learning to provide holistic, empathetic, and evidence-based support for neurodiverse children.
- Manas Learning: An inclusive pediatric child development and learning centre based in Chennai, Tamil Nadu, India. Offers comprehensive services:
  1. Speech & Language Therapy (articulation, receptive/expressive language, social communication)
  2. Remedial & Special Education (Dyslexia, Dyscalculia, Dysgraphia)
  3. Sensory Integration & Behavioral Regulation (Autism, ADHD, Sensory Processing)
  4. School Readiness, IEP (Individualized Education Program) planning, and Parent Coaching.
  5. Both in-person centre sessions in Chennai and global online consultations.
- Assistive Apps:
  - Vaaksudhi (https://vaaksudhi.manaslearning.com): Playful speech and breathing practice app on phone and laptop with therapist and parent progress tracking. (Always spelled Vaaksudhi).
  - Vaakify (https://vaakify.manaslearning.com): Speech repeater and clarity feedback app for at-home speech practice.
  - Phonics Jungle: Mobile app for early phonics, sound blending, and reading confidence.
- In Their World Experiences (/experience): An interactive simulation suite featuring 8 hands-on modules (Autism, ADHD, Dyslexia, Speech & Language, Dyscalculia, Dysgraphia, Auditory Processing, Executive Functioning) and 2 illustrated storybooks ('A Day Through My Eyes' and 'Aarav's Day').
- Consultations (/consult): Families can book a Free Discovery Consultation or a 1-on-1 Expert Consultation directly with Manasi Valluri and senior specialists.

Tone & Conversational Style:
- Speak like a caring, knowledgeable friend — genuine, sweet, unhurried, and encouraging.
- Affirm the parent's love and care for their child.
- Avoid clinical jargon, cold robotic phrases, or bureaucratic disclaimers.
- Keep answers concise, clear, comforting, and actionable.

Multilingual Capabilities:
- Detect the language and script the user uses (English, Tamil தமிழ், Hindi हिंदी, Telugu తెలుగు, Kannada ಕನ್ನಡ, Malayalam മലയാളം, Hinglish, Tanglish, etc.) and respond warmly, naturally, and fluently in that exact same language/script!
- Translate concepts with deep cultural sensitivity and parental warmth.

Grammar & Style Rules:
- Flawless standard English grammar with complete sentences and natural flow.
- NEVER omit prepositions: always say "signs of autism", "signs of ADHD", "delays in speech", "delays in language", "difficulties with reading", "traits of autism", etc.
- Never write redundant lists or repeat the same phrases across adjacent sentences (e.g., avoid saying "like lining up toys or language delays" and then immediately following with "Repetitive play patterns like lining up toys... Language delays..."). Synthesize points smoothly into a cohesive, comforting paragraph.
- When answering general questions about the founder, Manas Learning, our apps (Vaaksudhi, Vaakify), our simulations, or booking consultations, use the Core Identity knowledge above with full confidence.
- For developmental, speech, or sensory questions, share reassuring, practical guidance grounded in the context, and invite parents to connect with our team via /consult whenever they want personalized support.
"""

client = AzureOpenAI(
    azure_endpoint=AOAI_ENDPOINT,
    api_key=AOAI_KEY,
    api_version="2024-10-21",
)

search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=SEARCH_INDEX,
    credential=AzureKeyCredential(SEARCH_KEY),
)

import re
from faq_lookup import FaqLookup
from session_store import get_session, save_session
from query_log import log_query, record_feedback

faq = FaqLookup()
VECTOR_CONFIDENCE_THRESHOLD = float(os.environ.get("VECTOR_CONFIDENCE_THRESHOLD", "0.78"))


def embed(text: str):
    resp = client.embeddings.create(model=EMBED_DEPLOYMENT, input=text, dimensions=EMBED_DIM)
    return resp.data[0].embedding


def retrieve(question: str):
    vector = embed(question)
    vq = VectorizedQuery(vector=vector, k_nearest_neighbors=TOP_K, fields="embedding")
    results = search_client.search(
        search_text=None,
        vector_queries=[vq],
        select=["content", "source", "section"],
        top=TOP_K,
    )
    hits = []
    for r in results:
        hits.append(
            {
                "content": r.get("content", ""),
                "source": r.get("source", "unknown"),
                "score": r.get("@search.score", 0.0),
            }
        )
    return hits


def polish_reply(text: str) -> str:
    if not text:
        return ""
    # Standardize proper prepositions and fix common omissions
    text = re.sub(r'\b(sign|signs|symptom|symptoms|trait|traits|indicator|indicators)\s+(?:of\s+)?autism\b', r'\1 of autism', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(sign|signs|symptom|symptoms|trait|traits|indicator|indicators)\s+(?:of\s+)?adhd\b', r'\1 of ADHD', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(delay|delays)\s+(?:in\s+)?speech\b', r'\1 in speech', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(delay|delays)\s+(?:in\s+)?language\b', r'\1 in language', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(difficulty|difficulties|struggle|struggles|challenge|challenges)\s+(?:with\s+)?speech\b', r'\1 with speech', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(difficulty|difficulties|struggle|struggles|challenge|challenges)\s+(?:with\s+)?reading\b', r'\1 with reading', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(difficulty|difficulties|struggle|struggles|challenge|challenges)\s+(?:with\s+)?writing\b', r'\1 with writing', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(difficulty|difficulties|struggle|struggles|challenge|challenges)\s+(?:with\s+)?math(?:ematics)?\b', r'\1 with math', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(difficulty|difficulties|struggle|struggles|challenge|challenges)\s+(?:with\s+)?motor skills\b', r'\1 with motor skills', text, flags=re.IGNORECASE)
    text = re.sub(r'\bcan be signs autism\b', 'can be signs of autism', text, flags=re.IGNORECASE)
    text = re.sub(r'\bVaakSiddhi\b', 'Vaaksudhi', text, flags=re.IGNORECASE)
    text = re.sub(r'\bVaksudhi\b', 'Vaaksudhi', text, flags=re.IGNORECASE)
    return text.strip()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "https://www.manaslearning.com").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=500)


class SourceInfo(BaseModel):
    source: str
    section: str
    snippet: str
    doc_url: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    restarted: bool
    sources: List[dict] = []
    log_id: str | None = None
    tier: str | None = None


class FeedbackRequest(BaseModel):
    log_id: str
    tier: str
    vote: str


_hits = defaultdict(deque)
def rate_limit(request: Request, limit=12, window=60):
    ip = (request.headers.get("x-forwarded-for") or request.client.host or "?").split(",")[0].strip()
    q = _hits[ip]; now = time.time()
    while q and now - q[0] > window: q.popleft()
    if len(q) >= limit: raise HTTPException(status_code=429, detail="Too many messages, please slow down.")
    q.append(now)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    rate_limit(request)
    session_id = req.session_id or str(uuid.uuid4())
    history = get_session(session_id)

    user_turns = sum(1 for m in history if m["role"] == "user")
    if user_turns >= MAX_TURNS:
        save_session(session_id, [])
        return ChatResponse(
            session_id=session_id,
            reply=(
                "We've covered a good amount here — let's start fresh so I can stay "
                "sharp and accurate. Go ahead and ask your next question!"
            ),
            restarted=True,
        )

    # Tier 0 — fuzzy FAQ match, no API call at all
    faq_hit = faq.match(req.message)
    if faq_hit:
        reply = faq_hit["answer"]
        log_id = log_query(session_id, req.message, "tier0", faq_hit["score"] / 100, reply)
        history.append({"role": "user", "content": req.message})
        history.append({"role": "assistant", "content": reply})
        save_session(session_id, history)
        sources = [{
            "source": faq_hit["source"],
            "section": "",
            "snippet": reply[:400],
            "doc_url": f"/api/docs/{quote(faq_hit['source'])}",
        }]
        return ChatResponse(session_id=session_id, reply=reply, restarted=False, sources=sources, log_id=log_id, tier="tier0")

    # For follow-ups, fold the last SUCCESSFULLY-ANSWERED user turn into the
    # retrieval query so pronouns/short questions ("what causes it", "what are
    # early signs") can still find the right chunk. Tier 0 stays untouched
    # (exact/fuzzy match on the raw message).
    # Walk backward past any declined turns -- a decline carries no usable
    # topic, so anchoring to it (or stopping at it) would either poison
    # retrieval or leave genuinely answerable follow-ups with no context.
    DECLINE_MARKER = "I don't have solid enough information"
    prior_user_msg = None
    for i in range(len(history) - 1, 0, -1):
        if history[i]["role"] == "assistant" and history[i - 1]["role"] == "user":
            if DECLINE_MARKER not in history[i]["content"]:
                prior_user_msg = history[i - 1]["content"]
                break
    retrieval_query = f"{prior_user_msg} {req.message}" if prior_user_msg else req.message
    hits = retrieve(retrieval_query)

    # Tier 1 — vector search alone is confident enough, no chat completion
    if hits and hits[0]["score"] >= VECTOR_CONFIDENCE_THRESHOLD:
        top = hits[0]
        m = re.match(r'^Q\d+[:.]\s*(.+?)\s*A\d*[:.]\s*(.+)$', top["content"].strip(), re.IGNORECASE | re.DOTALL)
        reply = polish_reply(m.group(2).strip() if (m and len(m.group(1)) < 300) else top["content"])
        log_id = log_query(session_id, req.message, "tier1", top["score"], reply)
        history.append({"role": "user", "content": req.message})
        history.append({"role": "assistant", "content": reply})
        save_session(session_id, history)
        sources = [{
            "source": top["source"],
            "section": top.get("section", ""),
            "snippet": top["content"][:400],
            "doc_url": f"/api/docs/{quote(top['source'])}",
        }]
        return ChatResponse(session_id=session_id, reply=reply, restarted=False, sources=sources, log_id=log_id, tier="tier1")

    # Tier 2 — LLM path with knowledge grounding
    is_site_or_founder_query = bool(re.search(
        r'\b(founder|manasi|valluri|who started|who created|who made|who runs|director|centre|center|chennai|service|services|consult|consultation|specialist|therapist|appointment|pricing|cost|fee|vaaksudhi|vaakify|phonics|app|apps|in their world|simulation|simulations|story|stories)\b',
        req.message,
        re.IGNORECASE
    ))
    has_indic_or_cjk = bool(re.search(
        r'[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0600-\u06FF\u4E00-\u9FFF]',
        req.message
    ))
    is_romanized_indic = bool(re.search(
        r'\b(kya hai|kya hota|kaise|batao|kripya|madad|theek|bacha|bachhe|kya karein|eppadi|enna|solla|theriyuma|therapist kitta|pesa|mudiyala|solunga|cheppandi|ela|emiti)\b',
        req.message,
        re.IGNORECASE
    ))
    is_developmental_query = bool(re.search(
        r'\b(therapist|therapy|see a therapist|need a therapist|consult|specialist|speech delay|language delay|stimming|autism|adhd|sensory|assessment|evaluation|help my child|milestone|milestones|diagnosis|diagnosed|red flags|when to see)\b',
        req.message,
        re.IGNORECASE
    ))

    should_answer_with_llm = is_site_or_founder_query or is_developmental_query or has_indic_or_cjk or is_romanized_indic

    if (not hits or hits[0]["score"] < MIN_SCORE) and not should_answer_with_llm:
        reply = (
            "I want to make sure you get the most accurate, individualized guidance on that. "
            "For specific clinical questions like this, it's best to consult directly with a pediatric specialist or therapist. "
            "You can always book a consultation with our team right here on the site!"
        )
        tier = "none"
    else:
        if hits and hits[0]["score"] >= MIN_SCORE:
            context = "\n\n---\n\n".join(
                f"[Source: {h['source']}]\n{h['content']}" for h in hits
            )
        else:
            context = (
                "[Source: Manas Learning Core Knowledge & Clinical Guidance]\n"
                "Manas Learning was founded by Manasi Valluri (Pediatric Developmental Specialist & Special Educator) in Chennai, India. "
                "Services include Speech & Language Therapy, Remedial Education (Dyslexia, Dyscalculia, Dysgraphia), Sensory Integration (Autism, ADHD), and Parent Coaching. "
                "Assistive tools include Vaaksudhi (breathing and speech games at https://vaaksudhi.manaslearning.com), Vaakify (speech repetition and clarity practice at https://vaakify.manaslearning.com), and Phonics Jungle. "
                "Consultations can be booked at /consult (Free Discovery or 1-on-1 Expert Consultation). "
                "In Their World interactive simulations are available at /experience.\n"
                "Clinical Guidance on When to Consult a Therapist or Specialist:\n"
                "Parents are encouraged to consult a specialist whenever they notice persistent challenges affecting their child's daily communication, comfort, or learning. "
                "Key indicators include: speech and language delays (e.g. fewer words than expected, difficulty communicating needs), strong sensory sensitivities (overwhelm from loud noises, textures, bright lights), difficulties with coordination, fine motor skills, or handwriting, prolonged reading/writing/math challenges, or frequent emotional dysregulation. "
                "Early, playful intervention gives children effective tools to thrive with confidence."
            )
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history)
        messages.append(
            {"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION:\n{req.message}"}
        )
        resp = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=messages,
            temperature=0.3,
            max_completion_tokens=350,
        )
        reply = polish_reply(resp.choices[0].message.content)
        tier = "tier2"

    log_id = log_query(session_id, req.message, tier, hits[0]["score"] if hits else 0.0, reply)

    history.append({"role": "user", "content": req.message})
    history.append({"role": "assistant", "content": reply})
    save_session(session_id, history)

    sources = []
    if hits and hits[0]["score"] >= MIN_SCORE:
        seen = set()
        for h in hits[:3]:
            key = (h["source"], h.get("section", ""))
            if key in seen:
                continue
            seen.add(key)
            sources.append({
                "source": h["source"],
                "section": h.get("section", ""),
                "snippet": h["content"][:400],
                "doc_url": f"/api/docs/{quote(h['source'])}",
            })

    return ChatResponse(session_id=session_id, reply=reply, restarted=False, sources=sources, log_id=log_id, tier=tier)


@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    try:
        record_feedback(req.log_id, req.tier, req.vote)
    except Exception:
        raise HTTPException(status_code=404, detail="log entry not found")
    return {"ok": True}


def extract_paragraphs(filename: str, raw_bytes: bytes):
    if filename.lower().endswith(".docx"):
        doc = docx_lib.Document(io.BytesIO(raw_bytes))
        return [p.text for p in doc.paragraphs if p.text.strip()]
    elif filename.lower().endswith(".pdf"):
        paragraphs = []
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                for block in text.split("\n\n"):
                    block = block.strip()
                    if block:
                        paragraphs.append(block)
        return paragraphs
    return []


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


@app.get("/api/docs/view/{filename}", response_class=HTMLResponse)
def view_doc(filename: str, q: str = ""):
    blob_client = blob_service.get_blob_client(container=STORAGE_CONTAINER, blob=filename)
    raw_bytes = blob_client.download_blob().readall()

    paragraphs = extract_paragraphs(filename, raw_bytes)
    target = normalize(q)[:120]

    html_parts = []
    found = False
    for p in paragraphs:
        p_norm = normalize(p)
        if target and not found and target[:40] in p_norm:
            html_parts.append(f'<p class="hl" id="hl">{escape(p)}</p>')
            found = True
        else:
            html_parts.append(f"<p>{escape(p)}</p>")

    body = "\n".join(html_parts)
    scroll_script = "<script>document.getElementById('hl')?.scrollIntoView({block:'center'});</script>" if found else ""

    page = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{escape(filename)}</title>
<style>
  body {{ font-family: -apple-system, sans-serif; max-width: 720px; margin: 40px auto;
         padding: 0 20px; line-height: 1.6; color: #2b2b2b; background: #fbfaf7; }}
  h1 {{ font-size: 18px; color: #3F6F63; }}
  p {{ margin: 0 0 14px; }}
  p.hl {{ background: #FFE9A8; padding: 6px 10px; border-radius: 6px; }}
</style>
</head>
<body>
<h1>{escape(filename)}</h1>
{body}
{scroll_script}
</body>
</html>"""
    return HTMLResponse(content=page)


@app.get("/api/docs/{filename}")
def get_doc(filename: str):
    blob_client = blob_service.get_blob_client(container=STORAGE_CONTAINER, blob=filename)
    stream = blob_client.download_blob()
    media_type = "application/pdf" if filename.lower().endswith(".pdf") else         "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return StreamingResponse(
        stream.chunks(),
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# Frontend is served separately via Vercel; no static mount needed here.
