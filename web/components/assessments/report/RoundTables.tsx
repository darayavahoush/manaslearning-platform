import type {FeelingsRound, GazeRound} from '../session-record'

const sec = (ms: number | null) => (ms !== null ? `${(Math.round(ms / 100) / 10).toFixed(1)} s` : 'Not recorded')
const head = 'border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500'

/** Encounter-by-encounter table for the gaze game. */
export function GazeTable({rounds}: {rounds: GazeRound[]}) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
        <thead><tr className={head}><th className="py-1 pr-3">Encounter</th><th className="py-1 pr-3">Aria</th><th className="py-1 pr-3">Looked at</th><th className="py-1 pr-3">Child chose</th><th className="py-1 pr-3">Matched</th><th className="py-1">Time</th></tr></thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.round} className="border-b border-slate-200">
              <td className="py-1 pr-3">{r.round}</td><td className="py-1 pr-3">{r.pointing ? 'Looked and pointed' : 'Looked only'}</td><td className="py-1 pr-3">{r.target}</td><td className="py-1 pr-3">{r.chosen}</td><td className="py-1 pr-3">{r.matched ? 'Yes' : 'No'}</td><td className="py-1">{sec(r.ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Round-by-round table for the feelings match. */
export function FeelingsTable({rounds}: {rounds: FeelingsRound[]}) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
        <thead><tr className={head}><th className="py-1 pr-3">Round</th><th className="py-1 pr-3">Feeling shown</th><th className="py-1 pr-3">Child chose</th><th className="py-1 pr-3">Matched</th><th className="py-1">Time</th></tr></thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.round} className="border-b border-slate-200">
              <td className="py-1 pr-3">{r.round}</td><td className="py-1 pr-3 capitalize">{r.shown}</td><td className="py-1 pr-3 capitalize">{r.chosen}</td><td className="py-1 pr-3">{r.matched ? 'Yes' : 'No'}</td><td className="py-1">{sec(r.ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
