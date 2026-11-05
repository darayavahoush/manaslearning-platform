"use client";
import React from "react";

// Visual record of one session: accuracy with 95% intervals, response-time strips,
// the b/d/p/q look-alike grid and the sound-order attempts. Everything is drawn from
// this browser session's own data; nothing is sent anywhere by this component.

type It = { s?: string; w?: string; real?: number; ok: number; ms?: number; len?: number };
const GOLD = "#d8b86a";
const num = (v: any): v is number => typeof v === "number" && isFinite(v);
const wilson = (k: number, n: number): [number, number] => {
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};
const panel: React.CSSProperties = { border: "1px solid rgba(216,184,106,.35)", borderRadius: 10, padding: "12px 14px", margin: "14px 0" };
const cap: React.CSSProperties = { fontSize: 12, opacity: 0.8, margin: "6px 0 0" };
const head: React.CSSProperties = { margin: "0 0 8px", fontSize: 15 };
const cell: React.CSSProperties = { border: "1px solid rgba(216,184,106,.3)", padding: "4px 10px", textAlign: "center", minWidth: 36 };

export default function SessionRecord({ obs, detail }: { obs: Record<string, any>; detail: Record<string, any> }) {
  const arr = (k: string): It[] => (Array.isArray(detail?.[k]) ? (detail[k] as It[]) : []);
  const bars: { label: string; k: number; n: number }[] = [];
  const add = (label: string, k: any, n: any) => { if (num(k) && num(n) && n > 0) bars.push({ label, k, n }); };
  add("Rhyme", obs.rhyme?.correct, obs.rhyme?.trials);
  add("First sound", obs.firstSound?.correct, obs.firstSound?.trials);
  add("Real words", obs.wordCheck?.realCorrect, obs.wordCheck?.realTotal);
  add("Made-up words", obs.wordCheck?.madeUpCorrect, obs.wordCheck?.madeUpTotal);
  add("Spelling", obs.spelling?.correct, obs.spelling?.trials);

  const rtRows = [
    { label: "Rhyme", it: arr("rhyme"), med: obs.rhyme?.medianMs },
    { label: "First sound", it: arr("firstSound"), med: obs.firstSound?.medianMs },
    { label: "Word check", it: arr("wordCheck"), med: obs.wordCheck?.medianMs },
    { label: "Spelling", it: arr("spelling"), med: obs.spelling?.medianMs },
  ].filter((r) => r.it.some((x) => num(x.ms)));

  const l = obs.letters, LT = ["b", "d", "p", "q"];
  const conf = (l?.confusions || {}) as Record<string, number>;
  const bl = (l?.byLetter || {}) as Record<string, any>;
  const hasLetters = !!l && num(l.rounds) && l.rounds > 0;
  const sp = arr("soundSpan");
  if (!bars.length && !rtRows.length && !hasLetters && !sp.length) return null;

  const W = 560, L = 118, R = 56, RH = 32;
  const H1 = bars.length * RH + 34;
  const x1 = (p: number) => L + p * (W - L - R);
  const AX = 8000, H2 = rtRows.length * RH + 34;
  const x2 = (ms: number) => L + (Math.min(ms, AX) / AX) * (W - L - R);
  const maxConf = Math.max(1, ...LT.flatMap((a) => LT.map((b) => (a === b ? 0 : conf[`${a}>${b}`] || 0))));

  return (
    <section aria-label="Session record" style={{ margin: "16px 0" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Session record</h3>
      <p style={{ ...cap, marginTop: 0 }}>Drawn from this session only. With this few items every figure is rough, so read the intervals, not just the bars.</p>

      {bars.length > 0 && (
        <div style={panel}>
          <h4 style={head}>Share of items matched</h4>
          <svg viewBox={`0 0 ${W} ${H1}`} role="img" aria-label={"Accuracy by activity: " + bars.map((b) => `${b.label} ${b.k} of ${b.n}`).join(", ")} style={{ width: "100%", height: "auto" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={x1(t)} x2={x1(t)} y1={6} y2={H1 - 24} stroke="currentColor" strokeOpacity={t === 0.5 ? 0.55 : 0.15} strokeDasharray={t === 0.5 ? "4 3" : undefined} />
                <text x={x1(t)} y={H1 - 8} fontSize="10" textAnchor="middle" fill="currentColor" opacity=".7">{t * 100}%</text>
              </g>
            ))}
            {bars.map((b, i) => {
              const y = 12 + i * RH, p = b.k / b.n, [lo, hi] = wilson(b.k, b.n);
              return (
                <g key={b.label}>
                  <text x={L - 10} y={y + 15} fontSize="12" textAnchor="end" fill="currentColor">{b.label}</text>
                  <rect x={L} y={y + 4} width={Math.max(1, x1(p) - L)} height={14} rx="2" fill={GOLD} fillOpacity=".55" />
                  <line x1={x1(lo)} x2={x1(hi)} y1={y + 11} y2={y + 11} stroke="currentColor" strokeWidth="1.5" />
                  <line x1={x1(lo)} x2={x1(lo)} y1={y + 6} y2={y + 16} stroke="currentColor" strokeWidth="1.5" />
                  <line x1={x1(hi)} x2={x1(hi)} y1={y + 6} y2={y + 16} stroke="currentColor" strokeWidth="1.5" />
                  <text x={W - R + 8} y={y + 15} fontSize="12" fill="currentColor">{b.k}/{b.n}</text>
                </g>
              );
            })}
          </svg>
          <p style={cap}>Bar = share matched. Line = 95% interval for that share. Dashed line = 50%, the level random guessing gives on two-choice items.</p>
        </div>
      )}

      {rtRows.length > 0 && (
        <div style={panel}>
          <h4 style={head}>Response time per item</h4>
          <svg viewBox={`0 0 ${W} ${H2}`} role="img" aria-label={"Response times by item. " + rtRows.map((r) => `${r.label}: median ${num(r.med) ? (Math.round(r.med / 100) / 10).toFixed(1) : "unknown"} seconds`).join("; ")} style={{ width: "100%", height: "auto" }}>
            {[0, 2000, 4000, 6000, 8000].map((t) => (
              <g key={t}>
                <line x1={x2(t)} x2={x2(t)} y1={6} y2={H2 - 24} stroke="currentColor" strokeOpacity=".15" />
                <text x={x2(t)} y={H2 - 8} fontSize="10" textAnchor="middle" fill="currentColor" opacity=".7">{t / 1000}s</text>
              </g>
            ))}
            {rtRows.map((r, i) => {
              const y = 12 + i * RH;
              return (
                <g key={r.label}>
                  <text x={L - 10} y={y + 18} fontSize="12" textAnchor="end" fill="currentColor">{r.label}</text>
                  {r.it.filter((x) => num(x.ms)).map((x, k) => (
                    x.ok
                      ? <circle key={k} cx={x2(x.ms as number)} cy={y + 14 + ((k % 3) - 1) * 6} r="4" fill={GOLD} />
                      : <circle key={k} cx={x2(x.ms as number)} cy={y + 14 + ((k % 3) - 1) * 6} r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  ))}
                  {num(r.med) && <line x1={x2(r.med)} x2={x2(r.med)} y1={y + 2} y2={y + 28} stroke="currentColor" strokeWidth="2" />}
                </g>
              );
            })}
          </svg>
          <p style={cap}>Filled dot = matching answer. Hollow dot = other answer. Vertical bar = median. Times run from when the choices or word were available to the touch; anything over 8 s is drawn at the edge.</p>
        </div>
      )}

      {hasLetters && (
        <div style={panel}>
          <h4 style={head}>Letter game: look-alike taps</h4>
          <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr><th style={cell} scope="col">Target</th><th style={cell} scope="col">Found</th>{LT.map((c) => <th key={c} style={cell} scope="col">tapped {c}</th>)}</tr>
            </thead>
            <tbody>
              {LT.map((a) => (
                <tr key={a}>
                  <th style={cell} scope="row">{a}</th>
                  <td style={cell}>{num(bl[a]?.hit) ? `${bl[a].hit} of 4` : "-"}</td>
                  {LT.map((b) => {
                    const n = a === b ? 0 : conf[`${a}>${b}`] || 0;
                    return <td key={b} style={{ ...cell, background: a === b ? "transparent" : `rgba(216,184,106,${0.08 + (0.5 * n) / maxConf})` }}>{a === b ? "-" : n}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={cap}>Each row is a board where the child looked for that letter. Shaded cells count how often a different letter was tapped instead. Mirror pairs are b/d and p/q.</p>
        </div>
      )}

      {sp.length > 0 && (
        <div style={panel}>
          <h4 style={head}>Sound-order game</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sp.map((x, i) => (
              <span key={i} style={{ border: `1px solid ${GOLD}`, borderRadius: 6, padding: "2px 10px", fontSize: 13, background: x.ok ? "rgba(216,184,106,.25)" : "transparent" }}>
                {num(x.len) ? `${x.len} sounds` : "attempt"}: {x.ok ? "repeated" : "missed"}
              </span>
            ))}
          </div>
          <p style={cap}>Two sequences were tried at each length from 2 to 5. The game stops after two misses at one length.</p>
        </div>
      )}
    </section>
  );
}
