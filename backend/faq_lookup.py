import json, os, re
from rapidfuzz import process, fuzz, utils

# Common contraction -> expanded form, applied to the incoming query only
# (not to indexed FAQ questions) so casual phrasing like "whats autism"
# fuzzy-matches as well as "what is autism".
_CONTRACTIONS = {
    r"\bwhat's\b": "what is", r"\bwhats\b": "what is",
    r"\bwhere's\b": "where is", r"\bwheres\b": "where is",
    r"\bhow's\b": "how is", r"\bhows\b": "how is",
    r"\bwho's\b": "who is", r"\bwhos\b": "who is",
    r"\bdon't\b": "do not", r"\bdont\b": "do not",
    r"\bcan't\b": "cannot", r"\bcant\b": "cannot",
    r"\bwon't\b": "will not", r"\bwont\b": "will not",
    r"\bisn't\b": "is not", r"\bisnt\b": "is not",
    r"\baren't\b": "are not", r"\barent\b": "are not",
    r"\bdoesn't\b": "does not", r"\bdoesnt\b": "does not",
}
_CONTRACTION_RE = {re.compile(p, re.IGNORECASE): r for p, r in _CONTRACTIONS.items()}


def _normalize(text: str) -> str:
    t = text
    for pattern, repl in _CONTRACTION_RE.items():
        t = pattern.sub(repl, t)
    return t


def _faq_scorer(s1: str, s2: str, **kwargs) -> float:
    r_sort = fuzz.token_sort_ratio(s1, s2, processor=utils.default_process)
    r_set = fuzz.token_set_ratio(s1, s2, processor=utils.default_process)
    # If the user query is very short, avoid matching a very long FAQ just on one common word
    len1 = len(s1.split())
    len2 = len(s2.split())
    if len1 <= 2 and len2 >= 6:
        return float(r_sort)
    return float(max(r_sort, r_set))


FAQ_JSON_PATH = os.environ.get("FAQ_LOOKUP_PATH", "faq_lookup.json")


class FaqLookup:
    def __init__(self, path=FAQ_JSON_PATH):
        if os.path.exists(path):
            with open(path) as f:
                pairs = json.load(f)
        else:
            pairs = []
        self.questions = [p["question"] for p in pairs]
        self.pairs = pairs

    def match(self, user_msg: str, threshold: int = 78):
        if not self.questions:
            return None
        norm_msg = _normalize(user_msg)
        result = process.extractOne(norm_msg, self.questions, scorer=_faq_scorer)
        if result is None:
            return None
        match, score, idx = result
        if score >= threshold:
            return {**self.pairs[idx], "score": score}
        return None
