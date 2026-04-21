"use client";

import { useState, useRef, lazy, Suspense, useEffect } from "react";
import Link from "next/link";
import type { Stakeholder, StakeholderCategory } from "../api/discover/route";
import { getDemoData, DEMO_HINTS } from "../lib/demoData";

const MapView = lazy(() => import("./MapView"));

// ─── Types ────────────────────────────────────────────────────────────────────

type EngagementEntry = {
  id: string;
  stakeholderName: string;
  date: string;
  type: "Meeting" | "Interview" | "Email" | "Call" | "Workshop" | "Other";
  notes: string;
  outcome: "Positive" | "Neutral" | "Negative" | "Pending";
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "stakeholder_engagement_log";

function loadEngagementLog(): Record<string, EngagementEntry[]> {
  if (typeof window === "undefined") return {};
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}

function saveEngagementLog(log: Record<string, EngagementEntry[]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch {}
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  pageBg: "#f4f5f7", cardBg: "#f0f2f5", inputBg: "#ffffff",
  headerBg: "#003057", navyDark: "#003057", navyMid: "#4a6080", navyLight: "#7a92a8",
  border: "rgba(0,48,87,0.12)", borderStrong: "rgba(0,48,87,0.25)",
  crimson: "#cb333b", crimsonLight: "#e04048",
  crimsonBg: "rgba(203,51,59,0.08)", crimsonBorder: "rgba(203,51,59,0.3)",
  white: "#ffffff",
  green: "#15803d", greenBg: "rgba(21,128,61,0.1)", greenBorder: "rgba(21,128,61,0.3)",
  yellow: "#92650a", yellowBg: "rgba(146,101,10,0.08)", yellowBorder: "rgba(146,101,10,0.25)",
  red: "#cb333b", redBg: "rgba(203,51,59,0.08)", redBorder: "rgba(203,51,59,0.25)",
  indigo: "#3730a3", indigoBg: "rgba(55,48,163,0.08)", indigoBorder: "rgba(55,48,163,0.25)",
};

const inputStyle = {
  background: T.inputBg, border: `1px solid ${T.border}`,
  borderRadius: "2px", color: T.navyDark, transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  color: T.crimson, fontSize: "10px", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block",
};

// ─── Config ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "map";
type ResultMode = "demo" | "live";

const CATEGORIES: StakeholderCategory[] = [
  "Government & Regulatory", "Private Sector", "Civil Society & NGOs",
  "Media & Communications", "Academic & Research", "International Organizations & Donors",
];

const CATEGORY_COLORS: Record<StakeholderCategory, string> = {
  "Government & Regulatory": "#1d4ed8", "Private Sector": "#0f766e",
  "Civil Society & NGOs": "#7e22ce", "Media & Communications": "#b45309",
  "Academic & Research": "#0369a1", "International Organizations & Donors": "#0d9488",
};

const TYPE_LABELS: Record<Stakeholder["type"], string> = {
  government: "Government", private: "Private Sector", ngo: "NGO",
  media: "Media", academic: "Academic", international: "International",
};

const TYPE_COLORS: Record<Stakeholder["type"], string> = {
  government: "#1d4ed8", private: "#0f766e", ngo: "#7e22ce",
  media: "#b45309", academic: "#0369a1", international: "#0d9488",
};

const STANCE_CONFIG: Record<Stakeholder["stance"], { label: string; bg: string; text: string; border: string }> = {
  supportive: { label: "Supportive", bg: T.greenBg, text: T.green, border: T.greenBorder },
  neutral:    { label: "Neutral",    bg: T.yellowBg, text: T.yellow, border: T.yellowBorder },
  opposed:    { label: "Opposed",    bg: T.redBg,    text: T.red,    border: T.redBorder },
};

const OUTCOME_COLORS: Record<EngagementEntry["outcome"], { bg: string; text: string; border: string }> = {
  Positive: { bg: T.greenBg,  text: T.green,  border: T.greenBorder },
  Neutral:  { bg: T.yellowBg, text: T.yellow, border: T.yellowBorder },
  Negative: { bg: T.redBg,    text: T.red,    border: T.redBorder },
  Pending:  { bg: T.indigoBg, text: T.indigo, border: T.indigoBorder },
};

const TYPE_ICONS: Record<EngagementEntry["type"], string> = {
  Meeting: "🤝", Interview: "🎤", Email: "✉️", Call: "📞", Workshop: "🧩", Other: "📌",
};

// ─── Small components ─────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: ResultMode }) {
  if (mode === "demo") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: T.yellowBg, color: T.yellow, border: `1px solid ${T.yellowBorder}`, borderRadius: "2px" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.yellow }} />Demo
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: "2px" }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />Live
    </span>
  );
}

function InfluenceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: i < score ? (i < 4 ? T.crimson : i < 7 ? "#f59e0b" : "#ef4444") : "rgba(0,48,87,0.1)" }} />
        ))}
      </div>
      <span className="text-xs font-bold" style={{ color: T.navyLight }}>{score}/10</span>
    </div>
  );
}

function ContactInfo({ contact }: { contact?: string }) {
  if (!contact) return null;
  const isEmail = contact.includes("@") && !contact.includes("/");
  const href = isEmail ? `mailto:${contact}` : contact;
  const display = contact.length > 40 ? contact.slice(0, 37) + "…" : contact;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {isEmail
        ? <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#0369a1" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#0369a1" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      }
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs break-all hover:underline" style={{ color: "#0369a1" }} title={contact}>{display}</a>
    </div>
  );
}

// ─── Add Stakeholder Modal ────────────────────────────────────────────────────

function AddStakeholderModal({ onAdd, onClose }: { onAdd: (s: Stakeholder) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", organization: "", current_officeholder: "",
    type: "government" as Stakeholder["type"],
    category: "Government & Regulatory" as Stakeholder["category"],
    influence_score: 5, stance: "neutral" as Stakeholder["stance"],
    key_position_1: "", key_position_2: "", key_position_3: "",
    engagement_recommendation: "", contact: "", longitude: "", latitude: "",
  });
  const h = (f: string, v: string | number) => setForm(p => ({ ...p, [f]: v }));
  const TYPE_TO_CAT: Record<Stakeholder["type"], Stakeholder["category"]> = {
    government: "Government & Regulatory", private: "Private Sector", ngo: "Civil Society & NGOs",
    media: "Media & Communications", academic: "Academic & Research", international: "International Organizations & Donors",
  };
  const submit = () => {
    if (!form.name.trim() || !form.organization.trim()) return;
    onAdd({
      name: form.name.trim(), organization: form.organization.trim(),
      current_officeholder: form.current_officeholder.trim() || "To be verified",
      type: form.type, category: form.category, influence_score: form.influence_score, stance: form.stance,
      key_positions: [form.key_position_1.trim() || "To be defined", form.key_position_2.trim() || "To be defined", form.key_position_3.trim() || "To be defined"],
      engagement_recommendation: form.engagement_recommendation.trim() || "To be defined",
      contact: form.contact.trim(), coordinates: [parseFloat(form.longitude) || 0, parseFloat(form.latitude) || 0],
      sources: [], source_years: [], generated_date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,48,87,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded p-6" style={{ background: T.white, border: `1px solid ${T.crimsonBorder}`, boxShadow: "0 20px 60px rgba(0,48,87,0.2)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: T.navyDark }}>Add Stakeholder</h2>
          <button onClick={onClose} style={{ color: T.navyLight }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label style={labelStyle}>Name / Role *</label><input type="text" value={form.name} onChange={e => h("name", e.target.value)} placeholder="e.g. Minister of Energy" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
            <div><label style={labelStyle}>Organization *</label><input type="text" value={form.organization} onChange={e => h("organization", e.target.value)} placeholder="e.g. Ministry of Energy" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label style={labelStyle}>Current Officeholder</label><input type="text" value={form.current_officeholder} onChange={e => h("current_officeholder", e.target.value)} placeholder="Full name" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
            <div><label style={labelStyle}>Contact</label><input type="text" value={form.contact} onChange={e => h("contact", e.target.value)} placeholder="https://... or email" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => { const t = e.target.value as Stakeholder["type"]; h("type", t); h("category", TYPE_TO_CAT[t]); }} className="w-full px-3 py-2 text-sm outline-none" style={inputStyle}>
                {(["government","private","ngo","media","academic","international"] as Stakeholder["type"][]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Stance</label>
              <select value={form.stance} onChange={e => h("stance", e.target.value)} className="w-full px-3 py-2 text-sm outline-none" style={inputStyle}>
                <option value="supportive">Supportive</option><option value="neutral">Neutral</option><option value="opposed">Opposed</option>
              </select>
            </div>
            <div><label style={labelStyle}>Influence (1-10)</label><input type="number" min={1} max={10} value={form.influence_score} onChange={e => h("influence_score", parseInt(e.target.value) || 5)} className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Key Positions</label>
            <div className="flex flex-col gap-2">
              {[1,2,3].map(n => <input key={n} type="text" value={(form as Record<string,string|number>)[`key_position_${n}`] as string} onChange={e => h(`key_position_${n}`, e.target.value)} placeholder={`Key position ${n}`} className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} />)}
            </div>
          </div>
          <div><label style={labelStyle}>Engagement Recommendation</label>
            <textarea value={form.engagement_recommendation} onChange={e => h("engagement_recommendation", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={labelStyle}>Longitude</label><input type="text" value={form.longitude} onChange={e => h("longitude", e.target.value)} placeholder="e.g. 35.50" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
            <div><label style={labelStyle}>Latitude</label><input type="text" value={form.latitude} onChange={e => h("latitude", e.target.value)} placeholder="e.g. 33.89" className="w-full px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold tracking-wider uppercase" style={{ color: T.navyMid, border: `1px solid ${T.border}`, borderRadius: "2px" }}>Cancel</button>
            <button onClick={submit} disabled={!form.name.trim() || !form.organization.trim()} className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-white disabled:opacity-40" style={{ background: T.crimson, borderRadius: "2px" }}>Add Stakeholder</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Modal ─────────────────────────────────────────────────────────

function EngagementModal({ stakeholder, entries, onSave, onClose }: { stakeholder: Stakeholder; entries: EngagementEntry[]; onSave: (e: EngagementEntry[]) => void; onClose: () => void }) {
  const [log, setLog] = useState<EngagementEntry[]>(entries);
  const [form, setForm] = useState<Omit<EngagementEntry, "id"|"stakeholderName">>({ date: new Date().toISOString().slice(0,10), type: "Meeting", notes: "", outcome: "Pending" });
  const [adding, setAdding] = useState(false);
  const add = () => {
    if (!form.notes.trim()) return;
    const updated = [{ id: `${Date.now()}-${Math.random()}`, stakeholderName: stakeholder.name, ...form }, ...log];
    setLog(updated); onSave(updated);
    setForm({ date: new Date().toISOString().slice(0,10), type: "Meeting", notes: "", outcome: "Pending" }); setAdding(false);
  };
  const del = (id: string) => { const updated = log.filter(e => e.id !== id); setLog(updated); onSave(updated); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,48,87,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded" style={{ background: T.white, border: `1px solid ${T.indigoBorder}`, boxShadow: "0 20px 60px rgba(0,48,87,0.2)" }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: T.indigo }}>Engagement Log</span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: T.navyDark }}>{stakeholder.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: T.navyMid }}>{stakeholder.organization}</p>
          </div>
          <button onClick={onClose} style={{ color: T.navyLight }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {!adding
            ? <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold tracking-wider uppercase hover:opacity-80" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, borderRadius: "3px", color: T.indigo }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Log New Interaction
              </button>
            : <div className="rounded p-4 flex flex-col gap-3" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}` }}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: T.indigo }}>New Interaction</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs mb-1" style={{ color: T.navyMid }}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-2 py-1.5 text-xs outline-none" style={inputStyle} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: T.navyMid }}>Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EngagementEntry["type"] }))} className="w-full px-2 py-1.5 text-xs outline-none" style={inputStyle}>
                      {["Meeting","Interview","Email","Call","Workshop","Other"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs mb-1" style={{ color: T.navyMid }}>Outcome</label>
                    <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as EngagementEntry["outcome"] }))} className="w-full px-2 py-1.5 text-xs outline-none" style={inputStyle}>
                      {["Positive","Neutral","Negative","Pending"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs mb-1" style={{ color: T.navyMid }}>Notes *</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm outline-none resize-none" style={inputStyle} placeholder="Summarise the interaction…" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAdding(false)} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: T.navyMid, border: `1px solid ${T.border}`, borderRadius: "2px" }}>Cancel</button>
                  <button onClick={add} disabled={!form.notes.trim()} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40" style={{ background: T.indigo, borderRadius: "2px" }}>Save Entry</button>
                </div>
              </div>
          }
          {log.length === 0
            ? <div className="text-center py-8" style={{ color: T.navyLight }}><p className="text-sm">No interactions logged yet.</p></div>
            : <div className="flex flex-col gap-3">{log.map(entry => {
                const oc = OUTCOME_COLORS[entry.outcome];
                return (
                  <div key={entry.id} className="rounded p-4" style={{ background: T.cardBg, border: `1px solid ${T.border}` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICONS[entry.type]}</span>
                        <div><span className="text-sm font-semibold" style={{ color: T.navyDark }}>{entry.type}</span><span className="ml-2 text-xs" style={{ color: T.navyLight }}>{entry.date}</span></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                        <button onClick={() => del(entry.id)} style={{ color: T.navyLight }} className="hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: T.navyMid }}>{entry.notes}</p>
                  </div>
                );
              })}</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Overview Modal ────────────────────────────────────────────────

function EngagementOverviewModal({ log, onClose }: { log: Record<string, EngagementEntry[]>; onClose: () => void }) {
  const all = Object.values(log).flat().sort((a, b) => b.date.localeCompare(a.date));
  const total = all.length;
  const byOutcome = { Positive: all.filter(e => e.outcome === "Positive").length, Neutral: all.filter(e => e.outcome === "Neutral").length, Negative: all.filter(e => e.outcome === "Negative").length, Pending: all.filter(e => e.outcome === "Pending").length };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,48,87,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded" style={{ background: T.white, border: `1px solid ${T.indigoBorder}`, boxShadow: "0 20px 60px rgba(0,48,87,0.2)" }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: T.indigo }}>Engagement Overview</span>
            <h2 className="text-lg font-bold mt-0.5" style={{ color: T.navyDark }}>All Tracked Interactions</h2>
            <p className="text-xs mt-0.5" style={{ color: T.navyMid }}>{total} entries across {Object.keys(log).length} stakeholders</p>
          </div>
          <button onClick={onClose} style={{ color: T.navyLight }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {total > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {(["Positive","Neutral","Negative","Pending"] as EngagementEntry["outcome"][]).map(o => {
                const c = OUTCOME_COLORS[o];
                return <div key={o} className="rounded p-3 text-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}><p className="text-xl font-bold" style={{ color: c.text }}>{byOutcome[o]}</p><p className="text-xs font-semibold mt-0.5" style={{ color: c.text }}>{o}</p></div>;
              })}
            </div>
          )}
          {total === 0
            ? <div className="text-center py-12" style={{ color: T.navyLight }}><p className="text-sm">No interactions logged yet.</p></div>
            : <div className="flex flex-col gap-3">{all.map(entry => {
                const oc = OUTCOME_COLORS[entry.outcome];
                return (
                  <div key={entry.id} className="rounded p-4" style={{ background: T.cardBg, border: `1px solid ${T.border}` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICONS[entry.type]}</span>
                        <div><span className="text-sm font-semibold" style={{ color: T.navyDark }}>{entry.type}</span><span className="mx-1.5 text-xs" style={{ color: T.navyLight }}>·</span><span className="text-xs font-medium" style={{ color: T.indigo }}>{entry.stakeholderName}</span><span className="ml-2 text-xs" style={{ color: T.navyLight }}>{entry.date}</span></div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: T.navyMid }}>{entry.notes}</p>
                  </div>
                );
              })}</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Stakeholder Card ─────────────────────────────────────────────────────────

function StakeholderCard({ stakeholder, engagementEntries, onOpenEngagement, onDismiss }: {
  stakeholder: Stakeholder; engagementEntries: EngagementEntry[];
  onOpenEngagement: () => void; onDismiss: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [backTab, setBackTab] = useState<"sources"|"engagement">("sources");
  const stance = STANCE_CONFIG[stakeholder.stance];
  const typeColor = TYPE_COLORS[stakeholder.type];
  const hasEngagement = engagementEntries.length > 0;

  return (
    <div style={{ perspective: "1200px", height: "540px" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>

        {/* FRONT */}
        <div style={{ position: "absolute", inset: 0, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: "6px", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.2s, box-shadow 0.2s", overflow: "hidden" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.crimsonBorder; e.currentTarget.style.boxShadow = "0 4px 20px rgba(203,51,59,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            title="Dismiss stakeholder"
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full transition-all hover:opacity-100 opacity-40"
            style={{ background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ paddingRight: "20px" }}>
              <h3 className="font-bold text-base" style={{ color: T.navyDark }}>{stakeholder.name}</h3>
              <p className="text-sm mt-0.5" style={{ color: T.navyMid }}>{stakeholder.organization}</p>
              <p className="text-xs mt-0.5"><span style={{ color: T.navyLight }}>Current: </span><span style={{ color: T.navyMid }}>{stakeholder.current_officeholder ?? "To be verified"}</span></p>
              <ContactInfo contact={stakeholder.contact} />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide" style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30` }}>{TYPE_LABELS[stakeholder.type]}</span>
                {stakeholder.category && <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide" style={{ background: `${CATEGORY_COLORS[stakeholder.category]}15`, color: CATEGORY_COLORS[stakeholder.category], border: `1px solid ${CATEGORY_COLORS[stakeholder.category]}30` }}>{stakeholder.category}</span>}
                {hasEngagement && <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: T.indigoBg, color: T.indigo, border: `1px solid ${T.indigoBorder}` }}>{engagementEntries.length} logged</span>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="px-2.5 py-1 rounded text-xs font-semibold" style={{ background: stance.bg, color: stance.text, border: `1px solid ${stance.border}` }}>{stance.label}</span>
              <InfluenceBar score={stakeholder.influence_score} />
            </div>
            <div style={{ borderTop: `1px solid ${T.border}` }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.crimson }}>Key Positions</p>
              <ul className="flex flex-col gap-1.5">
                {stakeholder.key_positions.map((pos, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: T.navyMid }}>
                    <span style={{ color: T.crimson, marginTop: "1px" }}>{"\u2022"}</span><span>{pos}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}` }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.navyLight }}>Engagement Strategy</p>
              <p className="text-sm" style={{ color: T.navyMid }}>{stakeholder.engagement_recommendation}</p>
            </div>
          </div>
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            {stakeholder.generated_date && (() => {
              const genDate = new Date(stakeholder.generated_date);
              const isStale = (Date.now() - genDate.getTime()) > 1000 * 60 * 60 * 24 * 365;
              return (
                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: isStale ? T.red : T.navyLight }}>
                  {isStale && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
                  Generated {genDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {isStale && " · Verify currency"}
                </span>
              );
            })()}
            <button onClick={() => setFlipped(true)} className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase hover:opacity-70" style={{ color: T.navyLight }}>
              Sources &amp; Log <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* BACK */}
        <div style={{ position: "absolute", inset: 0, background: T.white, border: `1px solid ${T.indigoBorder}`, borderRadius: "6px", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div className="flex gap-0 rounded overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <button onClick={() => setBackTab("sources")} className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all" style={{ background: backTab === "sources" ? T.crimsonBg : "transparent", color: backTab === "sources" ? T.crimson : T.navyLight }}>QA Sources</button>
              <button onClick={() => setBackTab("engagement")} className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all" style={{ background: backTab === "engagement" ? T.indigoBg : "transparent", color: backTab === "engagement" ? T.indigo : T.navyLight }}>Engagement {hasEngagement ? `(${engagementEntries.length})` : ""}</button>
            </div>
            <button onClick={() => setFlipped(false)} style={{ color: T.navyLight }}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {backTab === "sources" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 px-3 py-2 rounded text-xs" style={{ background: T.yellowBg, border: `1px solid ${T.yellowBorder}`, color: T.yellow }}>
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  Verify each source independently before client use.
                </div>
                {(!stakeholder.sources || stakeholder.sources.length === 0) ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-center py-2" style={{ color: T.navyLight }}>No sources returned — search manually:</p>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(stakeholder.name + " " + stakeholder.organization)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded hover:opacity-80" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, color: T.indigo, textDecoration: "none" }}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <span className="text-xs font-semibold">Search: {stakeholder.name}</span>
                    </a>
                    {stakeholder.contact?.startsWith("http") && (
                      <a href={stakeholder.contact} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded hover:opacity-80" style={{ background: T.cardBg, border: `1px solid ${T.border}`, color: "#0369a1", textDecoration: "none" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                        <span className="text-xs font-semibold break-all">{stakeholder.contact}</span>
                      </a>
                    )}
                  </div>
                ) : stakeholder.sources.map((src, i) => {
                  const year = stakeholder.source_years?.[i] ?? null;
                  const isOld = year !== null && new Date().getFullYear() - year > 1;
                  return (
                    <div key={i} className="flex flex-col gap-1.5 p-3 rounded" style={{ background: T.cardBg, border: `1px solid ${isOld ? T.yellowBorder : T.border}` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold shrink-0" style={{ color: T.crimson }}>Source {i + 1}</span>
                        {year !== null
                          ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: isOld ? T.yellowBg : T.greenBg, color: isOld ? T.yellow : T.green, border: `1px solid ${isOld ? T.yellowBorder : T.greenBorder}` }}>{year}{isOld && " · May be outdated"}</span>
                          : <span className="text-[10px]" style={{ color: T.navyLight }}>Year unknown</span>
                        }
                      </div>
                      <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs break-all hover:underline" style={{ color: "#0369a1" }}>{src}</a>
                    </div>
                  );
                })}
              </div>
            )}
            {backTab === "engagement" && (
              <div className="flex flex-col gap-3">
                {engagementEntries.length === 0
                  ? <div className="text-center py-4" style={{ color: T.navyLight }}><p className="text-sm mb-3">No interactions logged yet.</p>
                      <button onClick={onOpenEngagement} className="px-4 py-2 text-xs font-bold tracking-wider uppercase hover:opacity-80" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, borderRadius: "3px", color: T.indigo }}>Log First Interaction</button>
                    </div>
                  : <>
                      {engagementEntries.slice(0, 3).map(entry => {
                        const oc = OUTCOME_COLORS[entry.outcome];
                        return (
                          <div key={entry.id} className="rounded p-3" style={{ background: T.cardBg, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-semibold" style={{ color: T.navyDark }}>{entry.type} · {entry.date}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: T.navyMid, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{entry.notes}</p>
                          </div>
                        );
                      })}
                      {engagementEntries.length > 3 && <p className="text-xs text-center" style={{ color: T.navyLight }}>+{engagementEntries.length - 3} more entries</p>}
                      <button onClick={onOpenEngagement} className="w-full py-2 text-xs font-bold tracking-wider uppercase hover:opacity-80" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, borderRadius: "3px", color: T.indigo }}>
                        {"\u270F\uFE0F"} Edit &amp; Add Interactions
                      </button>
                    </>
                }
              </div>
            )}
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
            <p className="text-xs font-semibold truncate" style={{ color: T.navyDark }}>{stakeholder.name}</p>
            <p className="text-[10px]" style={{ color: T.navyLight }}>{stakeholder.organization}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCSV(
  stakeholders: Stakeholder[],
  query: { sector: string; region: string; objectives?: string },
  engagementLog: Record<string, EngagementEntry[]>
) {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows: string[][] = [];

  // Stakeholders sheet (all in one CSV)
  rows.push(["STAKEHOLDER INTELLIGENCE REPORT"]);
  rows.push([`Sector: ${query.sector}`, `Region: ${query.region}`, query.objectives ? `Objectives: ${query.objectives}` : ""]);
  rows.push([`Generated: ${new Date().toLocaleDateString("en-GB")}`]);
  rows.push([]);
  rows.push(["#","Name / Role","Organization","Current Officeholder","Category","Type","Stance","Influence Score","Key Position 1","Key Position 2","Key Position 3","Engagement Recommendation","Contact","Interactions Logged","Sources","Generated Date"]);

  const sorted = [...stakeholders].sort((a, b) => b.influence_score - a.influence_score);
  sorted.forEach((s, i) => {
    rows.push([
      String(i + 1), s.name, s.organization, s.current_officeholder ?? "To be verified",
      s.category ?? "", TYPE_LABELS[s.type],
      s.stance.charAt(0).toUpperCase() + s.stance.slice(1),
      String(s.influence_score),
      s.key_positions[0] ?? "", s.key_positions[1] ?? "", s.key_positions[2] ?? "",
      s.engagement_recommendation ?? "", s.contact ?? "",
      String((engagementLog[s.name] ?? []).length),
      (s.sources ?? []).join(" | "),
      s.generated_date ?? "",
    ]);
  });

  if (Object.values(engagementLog).flat().length > 0) {
    rows.push([]);
    rows.push(["ENGAGEMENT LOG"]);
    rows.push(["Stakeholder","Date","Type","Outcome","Notes"]);
    Object.values(engagementLog).flat().sort((a,b) => b.date.localeCompare(a.date)).forEach(e => {
      rows.push([e.stakeholderName, e.date, e.type, e.outcome, e.notes]);
    });
  }

  const csv = rows.map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url; a.download = `BeyondGroup_Stakeholder_Map_${safe(query.sector)}_${safe(query.region)}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── HTML Report Export ───────────────────────────────────────────────────────

function exportToHTML(
  stakeholders: Stakeholder[],
  query: { sector: string; region: string; objectives?: string },
  engagementLog: Record<string, EngagementEntry[]>
) {
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const sorted = [...stakeholders].sort((a, b) => b.influence_score - a.influence_score);
  const allEntries = Object.values(engagementLog).flat().sort((a, b) => b.date.localeCompare(a.date));
  const CAT_HEX: Record<string, string> = {
    "Government & Regulatory": "#1d4ed8", "Private Sector": "#0f766e",
    "Civil Society & NGOs": "#7e22ce", "Media & Communications": "#b45309",
    "Academic & Research": "#0369a1", "International Organizations & Donors": "#0d9488",
  };
  const catGroups: Record<string, Stakeholder[]> = {};
  for (const s of sorted) { const c = s.category || "Uncategorized"; (catGroups[c] = catGroups[c] || []).push(s); }
  const sc = { sup: stakeholders.filter(s => s.stance === "supportive").length, neu: stakeholders.filter(s => s.stance === "neutral").length, opp: stakeholders.filter(s => s.stance === "opposed").length };
  const bands = [
    { label: "Very High (9–10)", min: 9, max: 10 }, { label: "High (7–8)", min: 7, max: 8 },
    { label: "Medium (5–6)", min: 5, max: 6 }, { label: "Low (3–4)", min: 3, max: 4 }, { label: "Minimal (1–2)", min: 1, max: 2 },
  ];
  const ss = (s: string) => s === "supportive" ? "background:#e6f4ea;color:#166534;font-weight:700" : s === "opposed" ? "background:#fdecea;color:#991b1b;font-weight:700" : "background:#fff8e1;color:#854d0e;font-weight:700";
  const dots = (score: number) => Array.from({ length: 10 }).map((_, i) => `<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${i < score ? (i < 4 ? "#cb333b" : i < 7 ? "#f59e0b" : "#ef4444") : "#d0d3d4"};margin-right:1px"></span>`).join("") + `<span style="font-size:10px;color:#7a92a8;margin-left:4px">${score}/10</span>`;

  const catTabIds = Object.keys(catGroups).map((c, i) => `cat${i}`);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Stakeholder Report — ${query.sector}, ${query.region}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Calibri,Arial,sans-serif;font-size:13px;color:#003057;background:#f4f5f7}
.tab-bar{position:sticky;top:0;z-index:100;background:#003057;display:flex;gap:0;overflow-x:auto;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.tab-btn{padding:12px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.6);cursor:pointer;border:none;background:transparent;white-space:nowrap;border-bottom:3px solid transparent;transition:all .2s}
.tab-btn:hover{color:white;background:rgba(255,255,255,.1)}
.tab-btn.active{color:white;border-bottom:3px solid #cb333b;background:rgba(255,255,255,.08)}
.tab-content{display:none}.tab-content.active{display:block}
.page{max-width:1200px;margin:0 auto;padding:40px 32px}
.cover-header{background:#003057;color:white;padding:48px 48px 32px;border-radius:8px 8px 0 0}
.cover-header h1{font-size:32px;font-weight:700;margin-bottom:8px}
.cover-sub{background:#cb333b;color:white;padding:12px 48px;font-size:14px;font-weight:600;border-radius:0 0 8px 8px;margin-bottom:32px}
.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:28px}
.meta-box{background:white;border:1px solid rgba(0,48,87,0.12);border-radius:6px;padding:16px 20px}
.meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#cb333b;margin-bottom:4px}
.meta-value{font-size:16px;font-weight:700;color:#003057}
.stance-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
.stance-box{padding:20px;border-radius:6px;text-align:center}
.stance-box .count{font-size:40px;font-weight:700;line-height:1}
.stance-box .lbl{font-size:12px;font-weight:700;text-transform:uppercase;margin-top:6px}
.section-title{background:#003057;color:white;padding:10px 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-radius:4px;margin:28px 0 12px}
table{width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden;box-shadow:0 1px 6px rgba(0,48,87,.1);margin-bottom:12px}
th{background:#cb333b;color:white;padding:9px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:left}
td{padding:10px 12px;border-bottom:1px solid rgba(0,48,87,.07);font-size:12px;vertical-align:top;line-height:1.5}
tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#f4f5f7}
.matrix-band{background:#003057!important;color:white;font-weight:700;font-size:11px}
.matrix-sup{background:#e6f4ea!important;color:#166534}
.matrix-neu{background:#fff8e1!important;color:#854d0e}
.matrix-opp{background:#fdecea!important;color:#991b1b}
.warn{background:#fff8e1;border:1px solid rgba(180,83,9,.3);color:#854d0e;padding:12px 16px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:24px}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid rgba(0,48,87,.12);color:#7a92a8;font-size:11px;display:flex;justify-content:space-between}
.cat-header{padding:10px 16px;color:white;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-radius:4px;margin:0 0 12px}
@media print{.tab-bar{display:none}.tab-content{display:block!important}}
</style></head><body>

<div class="tab-bar">
  <button class="tab-btn active" onclick="showTab('cover')">Cover</button>
  <button class="tab-btn" onclick="showTab('overview')">Overview</button>
  ${Object.keys(catGroups).map((cat, i) => `<button class="tab-btn" onclick="showTab('cat${i}')">${cat.split(" & ")[0].split(" ")[0]}</button>`).join("")}
  <button class="tab-btn" onclick="showTab('matrix')">Influence Matrix</button>
  ${allEntries.length > 0 ? `<button class="tab-btn" onclick="showTab('engagement')">Engagement</button>` : ""}
</div>

<script>
function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}
</script>

<!-- COVER -->
<div id="cover" class="tab-content active">
<div class="page">
  <div class="cover-header">
    <div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px">Beyond Group Consulting</div>
    <h1>Stakeholder Intelligence Report</h1>
    <div style="font-size:16px;color:rgba(255,255,255,.8);margin-top:4px">${query.sector} &nbsp;·&nbsp; ${query.region}</div>
    ${query.objectives ? `<div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:8px;font-style:italic">Objectives: ${query.objectives}</div>` : ""}
  </div>
  <div class="cover-sub">Confidential — Prepared for client use &nbsp;·&nbsp; Generated ${now}</div>
  <div class="meta-grid">
    <div class="meta-box"><div class="meta-label">Sector</div><div class="meta-value">${query.sector}</div></div>
    <div class="meta-box"><div class="meta-label">Region</div><div class="meta-value">${query.region}</div></div>
    ${query.objectives ? `<div class="meta-box" style="grid-column:1/-1"><div class="meta-label">Project Objectives</div><div class="meta-value" style="font-size:14px">${query.objectives}</div></div>` : ""}
    <div class="meta-box"><div class="meta-label">Total Stakeholders</div><div class="meta-value">${stakeholders.length}</div></div>
    <div class="meta-box"><div class="meta-label">Date Generated</div><div class="meta-value">${now}</div></div>
  </div>
  <div class="stance-grid">
    <div class="stance-box" style="background:#e6f4ea;color:#166534"><div class="count">${sc.sup}</div><div class="lbl">Supportive</div></div>
    <div class="stance-box" style="background:#fff8e1;color:#854d0e"><div class="count">${sc.neu}</div><div class="lbl">Neutral</div></div>
    <div class="stance-box" style="background:#fdecea;color:#991b1b"><div class="count">${sc.opp}</div><div class="lbl">Opposed</div></div>
  </div>
  <div class="section-title">Category Breakdown</div>
  <table><thead><tr><th>Category</th><th>Count</th><th>% of Total</th></tr></thead><tbody>
  ${Object.entries(catGroups).map(([cat, group]) => `<tr><td><span style="background:${CAT_HEX[cat] ?? "#555"}20;color:${CAT_HEX[cat] ?? "#555"};padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600">${cat}</span></td><td style="font-weight:700">${group.length}</td><td style="color:#7a92a8">${Math.round(group.length / stakeholders.length * 100)}%</td></tr>`).join("")}
  </tbody></table>
  <div class="warn" style="margin-top:24px">&#9888;&#65039; AI-assisted research — verify all information before use in client engagements.</div>
  <div class="footer"><span>Beyond Group Consulting &nbsp;·&nbsp; Stakeholder Intelligence Platform</span><span>Powered by Claude AI &nbsp;·&nbsp; ${now}</span></div>
</div></div>

<!-- OVERVIEW -->
<div id="overview" class="tab-content">
<div class="page">
  <div class="section-title">Master Overview — All Stakeholders (${stakeholders.length})</div>
  <table><thead><tr><th>#</th><th>Name / Role</th><th>Organization</th><th>Officeholder</th><th>Category</th><th>Stance</th><th>Influence</th><th>Contact</th><th>Interactions</th></tr></thead><tbody>
  ${sorted.map((s, i) => `<tr>
    <td style="color:#7a92a8;font-size:11px">${i+1}</td>
    <td style="font-weight:700">${s.name}</td>
    <td>${s.organization}</td>
    <td style="color:#4a6080">${s.current_officeholder ?? "To be verified"}</td>
    <td><span style="background:${CAT_HEX[s.category]??"#555"}20;color:${CAT_HEX[s.category]??"#555"};padding:2px 7px;border-radius:3px;font-size:11px;font-weight:600">${s.category??""}</span></td>
    <td><span style="${ss(s.stance)};padding:2px 8px;border-radius:3px;font-size:11px">${s.stance.charAt(0).toUpperCase()+s.stance.slice(1)}</span></td>
    <td>${dots(s.influence_score)}</td>
    <td style="font-size:11px">${s.contact?`<a href="${s.contact}" style="color:#0369a1">${s.contact.length>35?s.contact.slice(0,32)+"…":s.contact}</a>`:"—"}</td>
    <td style="text-align:center">${(engagementLog[s.name]??[]).length||"—"}</td>
  </tr>`).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- PER CATEGORY TABS -->
${Object.entries(catGroups).map(([cat, group], i) => {
  const color = CAT_HEX[cat] ?? "#003057";
  return `<div id="cat${i}" class="tab-content">
<div class="page">
  <div class="cat-header" style="background:${color}">${cat} — ${group.length} stakeholder${group.length !== 1 ? "s" : ""}</div>
  <table><thead><tr>
    <th style="background:${color}">Name / Role</th><th style="background:${color}">Organization</th>
    <th style="background:${color}">Officeholder</th><th style="background:${color}">Stance</th>
    <th style="background:${color}">Influence</th><th style="background:${color}">Key Position 1</th>
    <th style="background:${color}">Key Position 2</th><th style="background:${color}">Key Position 3</th>
    <th style="background:${color}">Engagement Recommendation</th><th style="background:${color}">Sources</th>
  </tr></thead><tbody>
  ${group.map(s => `<tr>
    <td style="font-weight:700">${s.name}</td><td>${s.organization}</td>
    <td style="color:#4a6080">${s.current_officeholder??"To be verified"}</td>
    <td><span style="${ss(s.stance)};padding:2px 8px;border-radius:3px;font-size:11px">${s.stance.charAt(0).toUpperCase()+s.stance.slice(1)}</span></td>
    <td>${dots(s.influence_score)}</td>
    <td>${s.key_positions[0]??""}</td><td>${s.key_positions[1]??""}</td><td>${s.key_positions[2]??""}</td>
    <td style="color:#4a6080">${s.engagement_recommendation??""}</td>
    <td style="font-size:11px">${(s.sources??[]).map(src=>`<a href="${src}" style="color:#0369a1;display:block">${src.length>50?src.slice(0,47)+"…":src}</a>`).join("")||"—"}</td>
  </tr>`).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting &nbsp;·&nbsp; ${cat}</span><span>${now}</span></div>
</div></div>`;
}).join("")}

<!-- MATRIX -->
<div id="matrix" class="tab-content">
<div class="page">
  <div class="section-title">Influence Matrix</div>
  <table><thead><tr>
    <th style="background:#003057;width:140px">Influence Band</th>
    <th style="background:#166534">Supportive</th>
    <th style="background:#854d0e">Neutral</th>
    <th style="background:#991b1b">Opposed</th>
  </tr></thead><tbody>
  ${bands.map(band => {
    const inBand = stakeholders.filter(s => s.influence_score >= band.min && s.influence_score <= band.max);
    const cell = (stance: string, cls: string) => `<td class="${cls}">${inBand.filter(s=>s.stance===stance).map(s=>`<div style="margin-bottom:4px">&#8226; <strong>${s.name}</strong> <span style="color:#888;font-size:10px">(${s.organization})</span></div>`).join("")||"<span style='color:#aaa'>—</span>"}</td>`;
    return `<tr><td class="matrix-band">${band.label}</td>${cell("supportive","matrix-sup")}${cell("neutral","matrix-neu")}${cell("opposed","matrix-opp")}</tr>`;
  }).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- ENGAGEMENT -->
${allEntries.length > 0 ? `<div id="engagement" class="tab-content">
<div class="page">
  <div class="section-title">Engagement Log — ${allEntries.length} Interactions</div>
  <table><thead><tr><th>Stakeholder</th><th>Date</th><th>Type</th><th>Outcome</th><th>Notes</th></tr></thead><tbody>
  ${allEntries.map(e => {
    const oc = e.outcome==="Positive"?"background:#e6f4ea;color:#166534":e.outcome==="Negative"?"background:#fdecea;color:#991b1b":e.outcome==="Pending"?"background:#ede9fe;color:#3730a3":"background:#fff8e1;color:#854d0e";
    return `<tr><td style="font-weight:600">${e.stakeholderName}</td><td style="color:#7a92a8">${e.date}</td><td>${e.type}</td><td><span style="${oc};padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600">${e.outcome}</span></td><td>${e.notes}</td></tr>`;
  }).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>` : ""}

</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url; a.download = `BeyondGroup_Stakeholder_Report_${safe(query.sector)}_${safe(query.region)}_${new Date().toISOString().slice(0,10)}.html`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[] | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<{ sector: string; region: string; objectives?: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<StakeholderCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [engagementLog, setEngagementLog] = useState<Record<string, EngagementEntry[]>>({});
  const [engagementTarget, setEngagementTarget] = useState<Stakeholder | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => { setEngagementLog(loadEngagementLog()); }, []);

  const handleSaveEngagement = (name: string, entries: EngagementEntry[]) => {
    const updated = { ...engagementLog, [name]: entries }; setEngagementLog(updated); saveEngagementLog(updated);
  };
  const totalEngagementEntries = Object.values(engagementLog).flat().length;
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setUploadedFile(f); };
  const handleRemoveFile = () => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleDismiss = (name: string) => {
    setStakeholders(prev => prev ? prev.filter(s => s.name !== name) : prev);
  };

  const handleExtractFromDocument = async () => {
    if (!uploadedFile) return;
    setUploadLoading(true); setError(null);
    try {
      const formData = new FormData(); formData.append("file", uploadedFile);
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error((data as { error?: string }).error || `HTTP ${res.status}`); }
      const data = await res.json();
      setStakeholders(prev => prev ? [...prev, ...data.stakeholders] : data.stakeholders);
      if (!resultMode) setResultMode("live");
      if (!lastQuery) setLastQuery({ sector: "Document Extract", region: uploadedFile.name });
      setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to process document"); }
    finally { setUploadLoading(false); }
  };

  const BATCH_LABELS = [
    "National government & international organisations",
    "Private sector, academia & media",
    "Local & regional actors",
    "Community voices & informal influencers",
    "Local economic actors & labour",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = sector.trim(); const r = region.trim(); const o = objectives.trim();
    if (!s || !r) return;
    setLoading(true); setBatchProgress(null); setError(null);
    setStakeholders(null); setResultMode(null); setActiveCategory(null);
    setLastQuery({ sector: s, region: r, objectives: o || undefined });

    let docStakeholders: Stakeholder[] = [];
    if (uploadedFile) {
      try { const fd = new FormData(); fd.append("file", uploadedFile); const res = await fetch("/api/extract", { method: "POST", body: fd }); if (res.ok) { const d = await res.json(); docStakeholders = d.stakeholders; } } catch { /* non-fatal */ }
      setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const demo = getDemoData(s, r);
    if (demo) { await new Promise(res => setTimeout(res, 600)); setStakeholders([...demo.stakeholders, ...docStakeholders]); setResultMode("demo"); setLoading(false); return; }

    let allStakeholders: Stakeholder[] = [...docStakeholders];

    for (let batchNum = 1; batchNum <= 5; batchNum++) {
      setBatchProgress({ current: batchNum, total: 5, label: BATCH_LABELS[batchNum - 1] });
      try {
        const existingNames = allStakeholders.map(s => s.name);
        const res = await fetch("/api/discover", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector: s, region: r, objectives: o || undefined, batch: batchNum, existingNames }),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as { error?: string }).error || `HTTP ${res.status}`); }
        const data = await res.json();
        allStakeholders = [...allStakeholders, ...data.stakeholders];
        if (batchNum === 1) { setStakeholders([...allStakeholders]); setResultMode("live"); setLoading(false); }
        else { setStakeholders([...allStakeholders]); }
      } catch (err) {
        if (batchNum === 1) {
          const fallback = getDemoData(s, r);
          if (fallback) { setStakeholders([...fallback.stakeholders, ...docStakeholders]); setResultMode("demo"); }
          else if (docStakeholders.length > 0) { setStakeholders(docStakeholders); setResultMode("live"); }
          else { setError(err instanceof Error ? err.message : "Unknown error"); }
          setLoading(false); setBatchProgress(null); return;
        }
        console.warn(`Batch ${batchNum} failed (non-fatal):`, err);
      }
    }
    setLoading(false); setBatchProgress(null);
  };

  const stanceSummary = stakeholders ? { supportive: stakeholders.filter(s => s.stance === "supportive").length, neutral: stakeholders.filter(s => s.stance === "neutral").length, opposed: stakeholders.filter(s => s.stance === "opposed").length } : null;
  const categoryCounts: Record<string, number> = {};
  if (stakeholders) for (const s of stakeholders) { const c = s.category || "Uncategorized"; categoryCounts[c] = (categoryCounts[c] || 0) + 1; }
  const filteredStakeholders = stakeholders ? (activeCategory ? stakeholders.filter(s => s.category === activeCategory) : stakeholders) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.pageBg }}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4" style={{ background: T.headerBg, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-1 h-6" style={{ background: T.crimson }} />
          <span className="font-bold text-sm tracking-wider uppercase" style={{ color: T.white }}>Stakeholder Intelligence</span>
        </Link>
        <div className="flex items-center gap-3">
          {resultMode && <ModeBadge mode={resultMode} />}
          <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1" style={{ color: T.crimson, border: "1px solid rgba(203,51,59,0.5)", borderRadius: "2px" }}>Discover</span>
        </div>
      </header>

      {/* Warning */}
      <div className="flex items-start gap-3 px-8 py-3 text-sm" style={{ background: T.yellowBg, borderBottom: `1px solid ${T.yellowBorder}`, color: T.yellow }}>
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        <span><strong>AI-assisted research</strong> — profiles are generated for discovery purposes only. Verify all information before use in client engagements.</span>
      </div>

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">

        {/* Search form */}
        <div className="rounded p-8 mb-10" style={{ background: T.white, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,48,87,0.07)" }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: T.navyDark }}>Stakeholder Mapping</h1>
          <p className="text-sm mb-6" style={{ color: T.navyMid }}>Enter sector, region and objectives to generate a targeted stakeholder analysis</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.crimson }}>Sector</label>
                <input suppressHydrationWarning type="text" value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g. Renewable Energy, Healthcare, Finance" className="w-full px-4 py-3 text-sm outline-none" style={inputStyle} onFocus={e => (e.target.style.borderColor = T.crimsonBorder)} onBlur={e => (e.target.style.borderColor = T.border)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.crimson }}>Region</label>
                <input suppressHydrationWarning type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Sub-Saharan Africa, Southeast Asia, EU" className="w-full px-4 py-3 text-sm outline-none" style={inputStyle} onFocus={e => (e.target.style.borderColor = T.crimsonBorder)} onBlur={e => (e.target.style.borderColor = T.border)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.crimson }}>
                Objectives <span style={{ color: T.navyLight, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — refines the scope of the analysis)</span>
              </label>
              <input suppressHydrationWarning type="text" value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="e.g. Improve rural access to clean energy, Build public-private partnerships for digital transformation" className="w-full px-4 py-3 text-sm outline-none" style={inputStyle} onFocus={e => (e.target.style.borderColor = T.crimsonBorder)} onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider uppercase hover:opacity-80" style={{ color: T.indigo, border: `1px solid ${T.indigoBorder}`, borderRadius: "2px", background: T.indigoBg }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" /></svg>Upload Document
                </button>
                {uploadedFile && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium" style={{ background: T.indigoBg, color: T.indigo, border: `1px solid ${T.indigoBorder}` }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {uploadedFile.name}
                    </span>
                    <button type="button" onClick={handleRemoveFile} style={{ color: T.navyLight }}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    {!sector.trim() || !region.trim()
                      ? <button type="button" onClick={handleExtractFromDocument} disabled={uploadLoading} className="px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-white disabled:opacity-40" style={{ background: T.crimson, borderRadius: "2px" }}>{uploadLoading ? "Extracting…" : "Extract Stakeholders"}</button>
                      : <span className="text-xs" style={{ color: T.navyLight }}>Will be included in analysis</span>
                    }
                  </div>
                )}
                <span className="text-xs" style={{ color: T.navyLight }}>PDF, DOCX, PPTX supported</span>
              </div>
              <button type="submit" disabled={loading || !sector.trim() || !region.trim()} className="px-8 py-3 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0" style={{ background: T.crimson, borderRadius: "2px", minWidth: "140px" }} onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = T.crimsonLight; }} onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = T.crimson; }}>
                {loading ? "Analysing…" : "Analyse"}
              </button>
            </div>
            <p className="text-xs" style={{ color: T.navyLight }}>Demo data available for: <span style={{ color: T.navyMid }}>{DEMO_HINTS}</span></p>
          </form>
        </div>

        {/* Loading */}
        {uploadLoading && !stakeholders && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin mb-4" style={{ borderColor: T.indigo, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: T.navyMid }}>Extracting stakeholders from document…</p>
          </div>
        )}
        {loading && !stakeholders && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin mb-4" style={{ borderColor: T.crimson, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: T.navyMid }}>Starting analysis for <strong style={{ color: T.navyDark }}>{lastQuery?.sector}</strong> in <strong style={{ color: T.navyDark }}>{lastQuery?.region}</strong>…</p>
          </div>
        )}

        {/* Progress bar */}
        {batchProgress && (
          <div className="mb-6 rounded p-5" style={{ background: T.white, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,48,87,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: T.navyDark }}>Discovering stakeholders — Batch {batchProgress.current} of {batchProgress.total}</p>
                <p className="text-xs mt-0.5" style={{ color: T.navyMid }}>{batchProgress.label}…</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: T.crimsonBg, color: T.crimson, border: `1px solid ${T.crimsonBorder}` }}>{stakeholders?.length ?? 0} found so far</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: T.border }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, background: `linear-gradient(90deg, ${T.navyDark}, ${T.crimson})` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              {Array.from({ length: batchProgress.total }).map((_, i) => (
                <span key={i} className="text-[10px] font-semibold" style={{ color: i < batchProgress.current ? T.crimson : T.navyLight }}>{i + 1}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="px-5 py-4 rounded text-sm mb-8" style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, color: T.red }}><strong>Error:</strong> {error}</div>}

        {/* Results */}
        {stakeholders && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h2 className="text-lg font-bold" style={{ color: T.navyDark }}>{stakeholders.length} Stakeholders Identified</h2>
                  {resultMode && <ModeBadge mode={resultMode} />}
                </div>
                <p className="text-sm" style={{ color: T.navyMid }}>{lastQuery?.sector} · {lastQuery?.region}{lastQuery?.objectives ? ` · ${lastQuery.objectives}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {stanceSummary && (
                  <>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}` }}>{stanceSummary.supportive} Supportive</div>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: T.yellowBg, color: T.yellow, border: `1px solid ${T.yellowBorder}` }}>{stanceSummary.neutral} Neutral</div>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>{stanceSummary.opposed} Opposed</div>
                  </>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setViewMode("list")} className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all" style={{ background: viewMode === "list" ? T.crimson : "transparent", color: viewMode === "list" ? T.white : T.navyMid, border: viewMode === "list" ? `1px solid ${T.crimson}` : `1px solid ${T.border}`, borderRadius: "3px" }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>List View
                </button>
                <button onClick={() => setViewMode("map")} className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all" style={{ background: viewMode === "map" ? T.crimson : "transparent", color: viewMode === "map" ? T.white : T.navyMid, border: viewMode === "map" ? `1px solid ${T.crimson}` : `1px solid ${T.border}`, borderRadius: "3px" }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>Map View
                </button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setShowOverview(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase hover:opacity-80" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, borderRadius: "3px", color: T.indigo }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  Engagement {totalEngagementEntries > 0 ? `(${totalEngagementEntries})` : "Log"}
                </button>
                <button onClick={() => lastQuery && exportToCSV(stakeholders, lastQuery, engagementLog)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase text-white hover:opacity-90" style={{ background: "#0f766e", borderRadius: "3px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export CSV
                </button>
                <button onClick={() => lastQuery && exportToHTML(stakeholders, lastQuery, engagementLog)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase text-white hover:opacity-90" style={{ background: T.navyDark, borderRadius: "3px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  Export Report
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase text-white hover:opacity-90" style={{ background: T.crimson, borderRadius: "3px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Add Stakeholder
                </button>
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button onClick={() => setActiveCategory(null)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all" style={{ background: activeCategory === null ? T.crimsonBg : T.white, color: activeCategory === null ? T.crimson : T.navyMid, border: `1px solid ${activeCategory === null ? T.crimsonBorder : T.border}` }}>All ({stakeholders.length})</button>
              {CATEGORIES.map(cat => {
                const count = categoryCounts[cat] || 0; if (count === 0) return null;
                const isActive = activeCategory === cat; const color = CATEGORY_COLORS[cat];
                return <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all" style={{ background: isActive ? `${color}15` : T.white, color: isActive ? color : T.navyMid, border: `1px solid ${isActive ? `${color}40` : T.border}` }}>{cat} ({count})</button>;
              })}
            </div>

            {/* List */}
            {viewMode === "list" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(filteredStakeholders ?? []).sort((a, b) => b.influence_score - a.influence_score).map((s, i) => (
                  <StakeholderCard
                    key={`${s.name}-${i}`}
                    stakeholder={s}
                    engagementEntries={engagementLog[s.name] ?? []}
                    onOpenEngagement={() => setEngagementTarget(s)}
                    onDismiss={() => handleDismiss(s.name)}
                  />
                ))}
              </div>
            )}

            {/* Map */}
            {viewMode === "map" && (
              <Suspense fallback={<div className="flex items-center justify-center rounded" style={{ height: "600px", background: T.white, border: `1px solid ${T.border}` }}><div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: T.crimson, borderTopColor: "transparent" }} /></div>}>
                <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                  <MapView stakeholders={filteredStakeholders ?? []} />
                </div>
              </Suspense>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !uploadLoading && !batchProgress && !stakeholders && !error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-4" style={{ background: T.crimsonBg, border: `1px solid ${T.crimsonBorder}` }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: T.crimson }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: T.navyDark }}>No stakeholders mapped yet</p>
            <p className="text-sm" style={{ color: T.navyMid }}>Enter a sector, region and objectives above to begin your analysis</p>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 text-xs text-center" style={{ color: T.navyLight, borderTop: `1px solid ${T.border}` }}>
        Powered by Claude AI · Stakeholder Intelligence Platform
      </footer>

      {/* Modals */}
      {showAddModal && <AddStakeholderModal onAdd={s => { setStakeholders(prev => prev ? [...prev, s] : [s]); if (!resultMode) setResultMode("live"); if (!lastQuery) setLastQuery({ sector: "Manual Entry", region: "Various" }); }} onClose={() => setShowAddModal(false)} />}
      {engagementTarget && <EngagementModal stakeholder={engagementTarget} entries={engagementLog[engagementTarget.name] ?? []} onSave={entries => handleSaveEngagement(engagementTarget.name, entries)} onClose={() => setEngagementTarget(null)} />}
      {showOverview && <EngagementOverviewModal log={engagementLog} onClose={() => setShowOverview(false)} />}
    </div>
  );
}
