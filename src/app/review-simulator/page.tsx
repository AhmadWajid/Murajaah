'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DateTime } from 'luxon';
import { ALGORITHMS, PRESETS, mockPassage, presetEvents, reviewBurden, simulate, type SimulationEvent } from '@/lib/reviewSimulator';
import { SCHEDULERS, schedulingPhase, type AlgorithmType } from '@/lib/reviewAlgorithms';
import type { ReviewRating } from '@/lib/spacedRepetition';

const number = (value: number | undefined) => value === undefined ? '—' : Number(value.toFixed(3)).toString();
const transition = (a: number | undefined, b: number | undefined) => `${number(a)} → ${number(b)}`;

export default function ReviewSimulator() {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('adaptive');
  const [beginner, setBeginner] = useState(false);
  const [start, setStart] = useState('2026-01-01');
  const [date, setDate] = useState('2026-01-01');
  const [zone, setZone] = useState('America/Los_Angeles');
  const [compare, setCompare] = useState(true);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [preset, setPreset] = useState('Mixed performance');
  const [error, setError] = useState('');
  const [replayCount, setReplayCount] = useState(0);
  const results = useMemo(() => Object.fromEntries(ALGORITHMS.map(key => [key, simulate(key, start, beginner, events, zone)])) as Record<AlgorithmType, ReturnType<typeof simulate>>, [start, beginner, events, zone]);
  const current = results[algorithm].at(-1)?.after ?? mockPassage(start, beginner);
  const visible = compare ? ALGORITHMS : [algorithm];
  function reset() { setEvents([]); setDate(start); setError(''); }
  function review(rating: ReviewRating) {
    if (!DateTime.fromISO(date, { zone }).isValid || date < (events.at(-1)?.date ?? start)) { setError('Choose a valid date on or after the last review.'); return; }
    setEvents([...events, { date, rating }]); setError('');
  }
  function loadPreset() {
    const enabled = PRESETS[preset].beginner ?? beginner;
    setBeginner(enabled);
    const next = presetEvents(preset, algorithm, start, enabled, zone);
    setEvents(next); setDate(next.at(-1)?.date ?? start); setError('');
  }
  const control = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';
  return <main className="mx-auto max-w-[1600px] space-y-7 p-6 text-foreground">
    <Link href="/" className="text-sm underline">Back to memorization</Link>
    <header><p className="text-sm text-muted-foreground">Development & research · in-memory sandbox</p><h1 className="text-3xl font-semibold">Revision simulator</h1><p className="mt-2 max-w-3xl text-muted-foreground">Run the real production scheduler on a fake passage. No passage, setting, review history, or simulator state is saved. Reloading clears this experiment.</p></header>
    <section className="flex flex-wrap items-end gap-4" aria-label="Simulation configuration">
      <label className="grid gap-1">Reference algorithm<select className={control} value={algorithm} onChange={e => setAlgorithm(e.target.value as AlgorithmType)}>{ALGORITHMS.map(key => <option key={key} value={key}>{SCHEDULERS[key].name}</option>)}</select></label>
      <label className="grid gap-1">Starting date<input type="date" className={control} value={start} onChange={e => { if (DateTime.fromISO(e.target.value).isValid) { setStart(e.target.value); setDate(e.target.value); setEvents([]); } }} /></label>
      <label className="grid gap-1">Timezone<select className={control} value={zone} onChange={e => setZone(e.target.value)}>{['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Riyadh', 'Pacific/Auckland'].map(z => <option key={z}>{z}</option>)}</select></label>
      <label className={control}><input type="checkbox" checked={beginner} onChange={e => setBeginner(e.target.checked)} /> Beginner at start</label>
      <label className={control}><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Compare all</label>
    </section>
    <p className="text-sm text-muted-foreground">Changing beginner mode or timezone replays existing events; changing the starting date resets them. Comparison always uses identical dates and ratings; the reference algorithm controls “jump to due” and preset dates.</p>
    <section className="flex flex-wrap items-end gap-3" aria-label="Review actions">
      <label className="grid gap-1">Review date<input aria-label="Review date" type="date" min={events.at(-1)?.date ?? start} className={control} value={date} onChange={e => setDate(e.target.value)} /></label>
      <button className={control} onClick={() => setDate(DateTime.fromISO(date, { zone }).plus({ days: 1 }).toISODate() ?? start)}>Advance one day</button>
      <button className={control} onClick={() => setDate(current.nextReview > date ? current.nextReview : date)}>Jump to next scheduled review</button>
      {(['easy', 'medium', 'hard'] as ReviewRating[]).map(r => <button key={r} className={`${control} font-semibold`} onClick={() => review(r)}>{r[0].toUpperCase() + r.slice(1)}</button>)}
      <button className={control} onClick={reset}>Reset</button>
      <button className={control} onClick={() => { setEvents(events.map(e => ({ ...e }))); setReplayCount(replayCount + 1); }}>Replay</button>
    </section>
    <p className="text-sm">Easy: fluent unaided recall · Medium: effortful unaided recall · Hard: needed help or forgot. One day means the next calendar date. Same-day successes keep memory and schedule; Hard still updates them. Beginner exits after five successful reviews on distinct days; Hard restarts progress. Adaptive then uses a temporary, gradually relaxing interval limit; Transition ends when the FSRS interval fits that limit. Hard during Transition restarts Beginner reinforcement.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <p aria-live="polite" className="text-sm text-muted-foreground">{events.length} reviews · {replayCount} replays · next reference review: {current.nextReview}</p>
    <section className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="preset">Preset scenario</label><select id="preset" className={control} value={preset} onChange={e => setPreset(e.target.value)}>{Object.keys(PRESETS).map(name => <option key={name}>{name}</option>)}</select><button className={control} onClick={loadPreset}>Load preset</button><button className={control} onClick={() => { const blob = new Blob([JSON.stringify({ start, beginner, zone, events, results }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'revision-simulation.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button></section>
    <div className={`grid gap-6 ${compare ? 'xl:grid-cols-3' : ''}`}>
      {visible.map(key => {
        const rows = results[key]; const state = rows.at(-1)?.after ?? mockPassage(start, beginner);
        const max = Math.max(1, ...rows.map(row => row.after.interval));
        return <section key={key} className="min-w-0 space-y-4 border-t border-border pt-4">
          <h2 className="text-xl font-semibold">{SCHEDULERS[key].name}</h2><p>Interval {state.interval} days · due {state.nextReview}<br />Phase {schedulingPhase(state, key)} · {state.reviewCount} reviews</p>
          {rows.length > 0 && <figure><svg viewBox="0 0 360 125" className="w-full" role="img" aria-label={`${SCHEDULERS[key].name}: interval in days by review number`}><text x="4" y="12" fontSize="10" fill="currentColor">Interval (days), max {max}</text><polyline points={rows.map((row, i) => `${20 + i * 320 / Math.max(1, rows.length - 1)},${100 - row.after.interval / max * 75}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" /><text x="120" y="121" fontSize="10" fill="currentColor">Review number: 1–{rows.length}</text></svg><figcaption className="text-xs text-muted-foreground">Production scheduler · {start} through {events.at(-1)?.date}</figcaption></figure>}
          <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><caption className="mb-2 text-left">Review transitions (days; memory metrics when applicable)</caption><thead><tr>{['# / date / rating', 'Interval / next due / days away', ...SCHEDULERS[key].metrics, 'Count / phase'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-border"><td className="p-2">{i + 1} · {row.event.date}<br />{row.event.rating}</td><td className="p-2">{transition(row.before.interval, row.after.interval)}<br />{row.after.nextReview}<br />{DateTime.fromISO(row.after.nextReview, { zone }).diff(DateTime.fromISO(row.event.date, { zone }), 'days').days} days away</td>{SCHEDULERS[key].metrics.map(metric => <td className="p-2" key={metric}>{transition(row.before[metric], row.after[metric])}</td>)}<td className="p-2">{row.before.reviewCount} → {row.after.reviewCount}<br />{schedulingPhase(row.before, key)} → {schedulingPhase(row.after, key)}</td></tr>)}</tbody></table></div>
          <div className="text-sm"><h3 className="font-semibold">Hypothetical due-date review burden</h3><p className="text-xs text-muted-foreground">Repeats the entered ratings (Medium if empty), each algorithm on its own due dates. Counts include day zero and exclude the horizon endpoint. These counts do not estimate or establish retention.</p><p className="mt-2">{[30, 90, 180, 365].map(days => `${days} days: ${reviewBurden(key, start, beginner, events.map(e => e.rating), days, zone)} reviews`).join(' · ')}</p></div>
        </section>;
      })}
    </div>
    <p className="text-sm text-muted-foreground">Adaptive uses FSRS-6 defaults with a 90% modeled retention target and a 365-day maximum. No model here is calibrated to Quran recitation or passage length. This tool compares policy behavior, not learning outcomes.</p>
  </main>;
}
