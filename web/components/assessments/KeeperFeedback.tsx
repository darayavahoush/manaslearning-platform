"use client";
import ClinicianReportButton, { rowsFromSentences, type ReportExtra } from "./ClinicianReport";
import SessionRecord from "./SessionRecord";
import { useEffect, useState } from "react";

type Res = {
  legend: string;
  noticed: string[];
  clinicianQuestions: string[];
  homeGames: { title: string; how: string }[];
  source: "llm" | "template";
  rows?: { name: string; value: string; detail?: string; note?: string }[];
  extra?: ReportExtra;
};

// The play name is wrapped so the page translator leaves it alone and never sends it to a translation service.
function keepName(text: string, name: string) {
  const n = name.trim();
  if (!n || n === "Explorer") return text;
  const parts = text.split(n);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<span key={i} translate="no" className="notranslate">{n}</span>, part]));
}

export default function KeeperFeedback({ quest, nickname, age, observations, detail, mode = "story" }: { quest: "dyslexia" | "adhd" | "autism"; nickname: string; age?: number | null; observations: Record<string, any>; detail?: Record<string, any>; mode?: "story" | "focus" }) {
  const [res, setRes] = useState<Res | null>(null);
  const [tab, setTab] = useState<"child" | "parent">(mode === "focus" ? "parent" : "child");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/assessments/keeper", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quest, nickname, age, observations, detail }),
    })
      .then((r) => r.json())
      .then((d) => live && setRes(d))
      .catch(() => live && setRes({ legend: `${nickname}, the Keeper wrote your story. Thank you for playing!`, noticed: ["Not enough data from this session."], clinicianQuestions: [], homeGames: [], source: "template" }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!res) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(res.legend.length);
    const id = setInterval(() => setShown((n) => (n >= res.legend.length ? (clearInterval(id), n) : n + 2)), 28);
    return () => clearInterval(id);
  }, [res]);

  const btn = (on: boolean): React.CSSProperties => ({ minHeight: 44, padding: "8px 18px", borderRadius: 999, border: "2px solid #d9b45a", background: on ? "#d9b45a" : "transparent", color: on ? "#2b1d05" : "#f6e7bd", fontWeight: 600, cursor: "pointer" });
  if (!res) return <p style={{ color: "#f6e7bd", textAlign: "center" }} role="status">{mode === "focus" ? "Preparing your summary..." : "Pip is writing your story..."}</p>;

  return (
    <section aria-label="Story Keeper feedback" style={{ maxWidth: 640, margin: "0 auto", color: "#f6e7bd", lineHeight: 1.7, letterSpacing: "0.02em" }}>
      {mode !== "focus" && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <button style={btn(tab === "child")} onClick={() => setTab("child")}>Your legend</button>
          <button style={btn(tab === "parent")} onClick={() => setTab("parent")}>For parents</button>
        </div>
      )}
      {tab === "child" && mode !== "focus" ? (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, fontSize: 20 }} aria-live="polite">
          {keepName(res.legend.slice(0, shown), nickname)}
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, fontSize: 16 }}>
          {mode === "focus" && <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Session summary</h2>}
          <p style={{ fontWeight: 700 }}>This is not a diagnosis. One play session cannot show whether a child has a learning difference. If you have concerns, please talk to a pediatrician, teacher or qualified clinician.</p>
          {quest === "dyslexia" && <SessionRecord obs={observations} detail={detail ?? {}} />}
          <h3 style={{ marginTop: 16 }}>What we noticed while playing</h3>
          <ul>{res.noticed.map((n, i) => <li key={i}>{keepName(n, nickname)}</li>)}</ul>
          {res.clinicianQuestions.length > 0 && (<><h3 style={{ marginTop: 16 }}>Questions you could bring to a clinician</h3><ul>{res.clinicianQuestions.map((n, i) => <li key={i}>{n}</li>)}</ul></>)}
          {res.homeGames.length > 0 && (<><h3 style={{ marginTop: 16 }}>Ideas to try at home</h3><ul>{res.homeGames.map((g, i) => <li key={i}><strong>{g.title}.</strong> {g.how}</li>)}</ul></>)}
          <div style={{ marginTop: 16, textAlign: "center" }}><ClinicianReportButton quest={quest} nickname={nickname} age={age} rows={res.rows ?? rowsFromSentences(res.noticed)} clinicianQuestions={res.clinicianQuestions} extra={res.extra} wording={res.source === "llm" ? "ai" : "template"} /></div>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>Nothing from this session is saved. Wording written {res.source === "llm" ? "by an AI model from this session's observations, checked automatically" : "from a fixed template"}.</p>
        </div>
      )}
    </section>
  );
}
