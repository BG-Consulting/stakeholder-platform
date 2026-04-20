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

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "stakeholder_engagement_log";

function loadEngagementLog(): Record<string, EngagementEntry[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEngagementLog(log: Record<string, EngagementEntry[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

// ─── Add Stakeholder Modal ────────────────────────────────────────────────────

function AddStakeholderModal({
  onAdd,
  onClose,
}: {
  onAdd: (s: Stakeholder) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    organization: "",
    current_officeholder: "",
    type: "government" as Stakeholder["type"],
    category: "Government & Regulatory" as Stakeholder["category"],
    influence_score: 5,
    stance: "neutral" as Stakeholder["stance"],
    key_position_1: "",
    key_position_2: "",
    key_position_3: "",
    engagement_recommendation: "",
    contact: "",
    longitude: "",
    latitude: "",
  });

  const handleChange = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.organization.trim()) return;
    const stakeholder: Stakeholder = {
      name: form.name.trim(),
      organization: form.organization.trim(),
      current_officeholder: form.current_officeholder.trim() || "To be verified",
      type: form.type,
      category: form.category,
      influence_score: form.influence_score,
      stance: form.stance,
      key_positions: [
        form.key_position_1.trim() || "To be defined",
        form.key_position_2.trim() || "To be defined",
        form.key_position_3.trim() || "To be defined",
      ],
      engagement_recommendation: form.engagement_recommendation.trim() || "To be defined",
      contact: form.contact.trim(),
      coordinates: [parseFloat(form.longitude) || 0, parseFloat(form.latitude) || 0],
      sources: [],
    };
    onAdd(stakeholder);
    onClose();
  };

  const inputStyle = {
    background: "var(--navy-700)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "2px",
    transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = {
    color: "var(--crimson)",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
    display: "block",
  };
  const TYPE_TO_CATEGORY: Record<Stakeholder["type"], Stakeholder["category"]> = {
    government: "Government & Regulatory",
    private: "Private Sector",
    ngo: "Civil Society & NGOs",
    media: "Media & Communications",
    academic: "Academic & Research",
    international: "International Organizations & Donors",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded p-6"
        style={{ background: "var(--navy-800)", border: "1px solid rgba(204, 41, 54, 0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Add Stakeholder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Name / Role *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Minister of Energy" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Organization *</label>
              <input type="text" value={form.organization} onChange={(e) => handleChange("organization", e.target.value)} placeholder="e.g. Ministry of Energy" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Current Officeholder</label>
              <input type="text" value={form.current_officeholder} onChange={(e) => handleChange("current_officeholder", e.target.value)} placeholder="Full name (or leave blank)" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact (email or URL)</label>
              <input type="text" value={form.contact} onChange={(e) => handleChange("contact", e.target.value)} placeholder="https://... or email@org.com" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={(e) => { const t = e.target.value as Stakeholder["type"]; handleChange("type", t); handleChange("category", TYPE_TO_CATEGORY[t]); }} className="w-full px-3 py-2 text-sm text-white outline-none" style={inputStyle}>
                <option value="government">Government</option>
                <option value="private">Private Sector</option>
                <option value="ngo">NGO</option>
                <option value="media">Media</option>
                <option value="academic">Academic</option>
                <option value="international">International</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stance</label>
              <select value={form.stance} onChange={(e) => handleChange("stance", e.target.value)} className="w-full px-3 py-2 text-sm text-white outline-none" style={inputStyle}>
                <option value="supportive">Supportive</option>
                <option value="neutral">Neutral</option>
                <option value="opposed">Opposed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Influence (1-10)</label>
              <input type="number" min={1} max={10} value={form.influence_score} onChange={(e) => handleChange("influence_score", parseInt(e.target.value) || 5)} className="w-full px-3 py-2 text-sm text-white outline-none" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Key Positions (3)</label>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((n) => (
                <input key={n} type="text" value={(form as Record<string, string | number>)[`key_position_${n}`] as string} onChange={(e) => handleChange(`key_position_${n}`, e.target.value)} placeholder={`Key position ${n}`} className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Engagement Recommendation</label>
            <textarea value={form.engagement_recommendation} onChange={(e) => handleChange("engagement_recommendation", e.target.value)} placeholder="How should the team engage this stakeholder?" rows={3} className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Longitude</label>
              <input type="text" value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} placeholder="e.g. 35.50" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input type="text" value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} placeholder="e.g. 33.89" className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold tracking-wider uppercase transition-all duration-200" style={{ color: "#8892a4", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "2px" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!form.name.trim() || !form.organization.trim()} className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--crimson)", borderRadius: "2px" }}>Add Stakeholder</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Log Modal (per-stakeholder) ───────────────────────────────────

function EngagementModal({
  stakeholder,
  entries,
  onSave,
  onClose,
}: {
  stakeholder: Stakeholder;
  entries: EngagementEntry[];
  onSave: (entries: EngagementEntry[]) => void;
  onClose: () => void;
}) {
  const [log, setLog] = useState<EngagementEntry[]>(entries);
  const [form, setForm] = useState<Omit<EngagementEntry, "id" | "stakeholderName">>({
    date: new Date().toISOString().slice(0, 10),
    type: "Meeting",
    notes: "",
    outcome: "Pending",
  });
  const [adding, setAdding] = useState(false);

  const inputStyle = {
    background: "var(--navy-700)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "2px",
  };

  const handleAdd = () => {
    if (!form.notes.trim()) return;
    const entry: EngagementEntry = {
      id: `${Date.now()}-${Math.random()}`,
      stakeholderName: stakeholder.name,
      ...form,
    };
    const updated = [entry, ...log];
    setLog(updated);
    onSave(updated);
    setForm({ date: new Date().toISOString().slice(0, 10), type: "Meeting", notes: "", outcome: "Pending" });
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    const updated = log.filter((e) => e.id !== id);
    setLog(updated);
    onSave(updated);
  };

  const OUTCOME_COLORS: Record<EngagementEntry["outcome"], { bg: string; text: string; border: string }> = {
    Positive: { bg: "rgba(22,163,74,0.15)", text: "#4ade80", border: "rgba(22,163,74,0.4)" },
    Neutral: { bg: "rgba(234,179,8,0.15)", text: "#facc15", border: "rgba(234,179,8,0.4)" },
    Negative: { bg: "rgba(204,41,54,0.15)", text: "#f87171", border: "rgba(204,41,54,0.4)" },
    Pending: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.4)" },
  };

  const TYPE_ICONS: Record<EngagementEntry["type"], string> = {
    Meeting: "🤝", Interview: "🎤", Email: "✉️", Call: "📞", Workshop: "🧩", Other: "📌",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded" style={{ background: "var(--navy-800)", border: "1px solid rgba(99,102,241,0.35)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>Engagement Log</span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">{stakeholder.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8892a4" }}>{stakeholder.organization}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white mt-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Add button or form */}
          {!adding ? (
            <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 hover:opacity-90" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "3px", color: "#a5b4fc" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Log New Interaction
            </button>
          ) : (
            <div className="rounded p-4 flex flex-col gap-3" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>New Interaction</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#6b7a8d" }}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-2 py-1.5 text-xs text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#6b7a8d" }}>Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EngagementEntry["type"] }))} className="w-full px-2 py-1.5 text-xs text-white outline-none" style={inputStyle}>
                    {["Meeting", "Interview", "Email", "Call", "Workshop", "Other"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#6b7a8d" }}>Outcome</label>
                  <select value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value as EngagementEntry["outcome"] }))} className="w-full px-2 py-1.5 text-xs text-white outline-none" style={inputStyle}>
                    {["Positive", "Neutral", "Negative", "Pending"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#6b7a8d" }}>Notes *</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Summarise the interaction, key takeaways, follow-ups…" rows={3} className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 outline-none resize-none" style={inputStyle} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAdding(false)} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8892a4", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "2px" }}>Cancel</button>
                <button onClick={handleAdd} disabled={!form.notes.trim()} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40" style={{ background: "rgba(99,102,241,0.7)", borderRadius: "2px" }}>Save Entry</button>
              </div>
            </div>
          )}

          {/* Log entries */}
          {log.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#4a5568" }}>
              <p className="text-sm">No interactions logged yet.</p>
              <p className="text-xs mt-1">Use the button above to record your first entry.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {log.map((entry) => {
                const oc = OUTCOME_COLORS[entry.outcome];
                return (
                  <div key={entry.id} className="rounded p-4" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICONS[entry.type]}</span>
                        <div>
                          <span className="text-sm font-semibold text-white">{entry.type}</span>
                          <span className="ml-2 text-xs" style={{ color: "#6b7a8d" }}>{entry.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#b0bac8" }}>{entry.notes}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Overview Modal ────────────────────────────────────────────────

function EngagementOverviewModal({
  log,
  onClose,
}: {
  log: Record<string, EngagementEntry[]>;
  onClose: () => void;
}) {
  const all = Object.values(log).flat().sort((a, b) => b.date.localeCompare(a.date));
  const total = all.length;
  const byOutcome = {
    Positive: all.filter((e) => e.outcome === "Positive").length,
    Neutral: all.filter((e) => e.outcome === "Neutral").length,
    Negative: all.filter((e) => e.outcome === "Negative").length,
    Pending: all.filter((e) => e.outcome === "Pending").length,
  };

  const OUTCOME_COLORS: Record<EngagementEntry["outcome"], { bg: string; text: string; border: string }> = {
    Positive: { bg: "rgba(22,163,74,0.15)", text: "#4ade80", border: "rgba(22,163,74,0.4)" },
    Neutral: { bg: "rgba(234,179,8,0.15)", text: "#facc15", border: "rgba(234,179,8,0.4)" },
    Negative: { bg: "rgba(204,41,54,0.15)", text: "#f87171", border: "rgba(204,41,54,0.4)" },
    Pending: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.4)" },
  };

  const TYPE_ICONS: Record<EngagementEntry["type"], string> = {
    Meeting: "🤝", Interview: "🎤", Email: "✉️", Call: "📞", Workshop: "🧩", Other: "📌",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded" style={{ background: "var(--navy-800)", border: "1px solid rgba(99,102,241,0.35)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>Engagement Overview</span>
            </div>
            <h2 className="text-lg font-bold text-white">All Tracked Interactions</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8892a4" }}>{total} total entries across {Object.keys(log).length} stakeholders</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white mt-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Summary tiles */}
          {total > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {(["Positive", "Neutral", "Negative", "Pending"] as EngagementEntry["outcome"][]).map((o) => {
                const c = OUTCOME_COLORS[o];
                return (
                  <div key={o} className="rounded p-3 text-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <p className="text-xl font-bold" style={{ color: c.text }}>{byOutcome[o]}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: c.text }}>{o}</p>
                  </div>
                );
              })}
            </div>
          )}

          {total === 0 ? (
            <div className="text-center py-12" style={{ color: "#4a5568" }}>
              <p className="text-sm">No interactions logged yet.</p>
              <p className="text-xs mt-1">Open a stakeholder card and navigate to the Engagement tab to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {all.map((entry) => {
                const oc = OUTCOME_COLORS[entry.outcome];
                return (
                  <div key={entry.id} className="rounded p-4" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICONS[entry.type]}</span>
                        <div>
                          <span className="text-sm font-semibold text-white">{entry.type}</span>
                          <span className="mx-1.5 text-xs" style={{ color: "#4a5568" }}>·</span>
                          <span className="text-xs font-medium" style={{ color: "#818cf8" }}>{entry.stakeholderName}</span>
                          <span className="ml-2 text-xs" style={{ color: "#6b7a8d" }}>{entry.date}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#b0bac8" }}>{entry.notes}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared config ────────────────────────────────────────────────────────────

type ViewMode = "list" | "map";

const CATEGORIES: StakeholderCategory[] = [
  "Government & Regulatory",
  "Private Sector",
  "Civil Society & NGOs",
  "Media & Communications",
  "Academic & Research",
  "International Organizations & Donors",
];

const CATEGORY_COLORS: Record<StakeholderCategory, string> = {
  "Government & Regulatory": "#1d4ed8",
  "Private Sector": "#0f766e",
  "Civil Society & NGOs": "#7e22ce",
  "Media & Communications": "#b45309",
  "Academic & Research": "#0369a1",
  "International Organizations & Donors": "#0d9488",
};

// XLSX category fill colours (ARGB hex, no #)
const CATEGORY_XLSX_FILLS: Record<StakeholderCategory, string> = {
  "Government & Regulatory": "FF1d4ed8",
  "Private Sector": "FF0f766e",
  "Civil Society & NGOs": "FF7e22ce",
  "Media & Communications": "FFb45309",
  "Academic & Research": "FF0369a1",
  "International Organizations & Donors": "FF0d9488",
};

const TYPE_LABELS: Record<Stakeholder["type"], string> = {
  government: "Government",
  private: "Private Sector",
  ngo: "NGO",
  media: "Media",
  academic: "Academic",
  international: "International",
};

const TYPE_COLORS: Record<Stakeholder["type"], string> = {
  government: "#1d4ed8",
  private: "#0f766e",
  ngo: "#7e22ce",
  media: "#b45309",
  academic: "#0369a1",
  international: "#0d9488",
};

const STANCE_CONFIG: Record<Stakeholder["stance"], { label: string; bg: string; text: string; border: string }> = {
  supportive: { label: "Supportive", bg: "rgba(22,163,74,0.15)", text: "#4ade80", border: "rgba(22,163,74,0.4)" },
  neutral: { label: "Neutral", bg: "rgba(234,179,8,0.15)", text: "#facc15", border: "rgba(234,179,8,0.4)" },
  opposed: { label: "Opposed", bg: "rgba(204,41,54,0.15)", text: "#f87171", border: "rgba(204,41,54,0.4)" },
};

type ResultMode = "demo" | "live";

// ─── Small shared components ──────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: ResultMode }) {
  if (mode === "demo") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(234,179,8,0.12)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.35)", borderRadius: "2px" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />Demo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(22,163,74,0.12)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.35)", borderRadius: "2px" }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />Live
    </span>
  );
}

function InfluenceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: i < score ? (i < 4 ? "var(--crimson)" : i < 7 ? "#f59e0b" : "#ef4444") : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <span className="text-xs font-bold" style={{ color: "#8892a4" }}>{score}/10</span>
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
      {isEmail ? (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#60a5fa" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      ) : (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#60a5fa" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs break-all hover:underline" style={{ color: "#60a5fa" }} title={contact}>{display}</a>
    </div>
  );
}

// ─── Stakeholder Card (with flip + tabs) ──────────────────────────────────────

function StakeholderCard({
  stakeholder,
  engagementEntries,
  onOpenEngagement,
}: {
  stakeholder: Stakeholder;
  engagementEntries: EngagementEntry[];
  onOpenEngagement: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [backTab, setBackTab] = useState<"sources" | "engagement">("sources");
  const stance = STANCE_CONFIG[stakeholder.stance];
  const typeColor = TYPE_COLORS[stakeholder.type];
  const hasEngagement = engagementEntries.length > 0;

  return (
    <>
      {/* Flip perspective wrapper */}
      <div
        style={{
          perspective: "1200px",
          minHeight: "380px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="flex flex-col gap-4 p-5 rounded absolute inset-0"
            style={{
              background: "var(--navy-800)",
              border: "1px solid rgba(255,255,255,0.06)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(204,41,54,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
          >
            <div>
              <h3 className="font-bold text-base text-white" title={stakeholder.name}>{stakeholder.name}</h3>
              <p className="text-sm mt-0.5" style={{ color: "#8892a4" }}>{stakeholder.organization}</p>
              <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}><span style={{ color: "#6b7a8d" }}>Current: </span>{stakeholder.current_officeholder ?? "To be verified"}</p>
              <ContactInfo contact={stakeholder.contact} />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide" style={{ background: `${typeColor}25`, color: typeColor }}>{TYPE_LABELS[stakeholder.type]}</span>
                {stakeholder.category && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide" style={{ background: `${CATEGORY_COLORS[stakeholder.category] ?? "#555"}20`, color: CATEGORY_COLORS[stakeholder.category] ?? "#999", border: `1px solid ${CATEGORY_COLORS[stakeholder.category] ?? "#555"}30` }}>{stakeholder.category}</span>
                )}
                {stakeholder.sources?.[0] === "Uploaded document" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>From document</span>
                )}
                {hasEngagement && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>{engagementEntries.length} logged</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="px-2.5 py-1 rounded text-xs font-semibold" style={{ background: stance.bg, color: stance.text, border: `1px solid ${stance.border}` }}>{stance.label}</span>
              <InfluenceBar score={stakeholder.influence_score} />
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--crimson)" }}>Key Positions</p>
              <ul className="flex flex-col gap-1.5">
                {stakeholder.key_positions.map((pos, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: "#b0bac8" }}><span style={{ color: "var(--crimson)", marginTop: "1px" }}>›</span>{pos}</li>
                ))}
              </ul>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8892a4" }}>Engagement Strategy</p>
              <p className="text-sm" style={{ color: "#b0bac8" }}>{stakeholder.engagement_recommendation}</p>
            </div>
            {/* Flip trigger */}
            <button
              onClick={() => setFlipped(true)}
              className="mt-auto self-end flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:opacity-80"
              style={{ color: "#6b7a8d" }}
            >
              Sources & Log
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {/* ── BACK ── */}
          <div
            className="flex flex-col absolute inset-0 rounded"
            style={{
              background: "var(--navy-800)",
              border: "1px solid rgba(99,102,241,0.25)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Back header */}
            <div className="px-4 pt-4 pb-0 flex items-center justify-between">
              <div className="flex gap-0 rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => setBackTab("sources")}
                  className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-200"
                  style={{ background: backTab === "sources" ? "rgba(204,41,54,0.2)" : "transparent", color: backTab === "sources" ? "#f87171" : "#6b7a8d" }}
                >
                  QA Sources
                </button>
                <button
                  onClick={() => setBackTab("engagement")}
                  className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-200"
                  style={{ background: backTab === "engagement" ? "rgba(99,102,241,0.2)" : "transparent", color: backTab === "engagement" ? "#a5b4fc" : "#6b7a8d" }}
                >
                  Engagement {hasEngagement ? `(${engagementEntries.length})` : ""}
                </button>
              </div>
              <button onClick={() => setFlipped(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
            </div>

            {/* Back content */}
            <div className="flex-1 overflow-y-auto p-4">
              {backTab === "sources" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 px-3 py-2 rounded text-xs" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", color: "#fde68a" }}>
                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    Verify each source independently before client use.
                  </div>
                  {(!stakeholder.sources || stakeholder.sources.length === 0) ? (
                    <p className="text-sm text-center py-6" style={{ color: "#4a5568" }}>No sources available for this stakeholder.</p>
                  ) : (
                    stakeholder.sources.map((src, i) => {
                      const isUrl = src.startsWith("http");
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: "var(--crimson)" }}>{i + 1}</span>
                          {isUrl ? (
                            <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs break-all hover:underline leading-relaxed" style={{ color: "#60a5fa" }}>{src}</a>
                          ) : (
                            <p className="text-xs leading-relaxed" style={{ color: "#b0bac8" }}>{src}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {backTab === "engagement" && (
                <div className="flex flex-col gap-3">
                  {engagementEntries.length === 0 ? (
                    <div className="text-center py-6" style={{ color: "#4a5568" }}>
                      <p className="text-sm">No interactions logged yet.</p>
                    </div>
                  ) : (
                    engagementEntries.slice(0, 3).map((entry) => {
                      const OUTCOME_COLORS: Record<EngagementEntry["outcome"], { bg: string; text: string; border: string }> = {
                        Positive: { bg: "rgba(22,163,74,0.15)", text: "#4ade80", border: "rgba(22,163,74,0.4)" },
                        Neutral: { bg: "rgba(234,179,8,0.15)", text: "#facc15", border: "rgba(234,179,8,0.4)" },
                        Negative: { bg: "rgba(204,41,54,0.15)", text: "#f87171", border: "rgba(204,41,54,0.4)" },
                        Pending: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.4)" },
                      };
                      const oc = OUTCOME_COLORS[entry.outcome];
                      return (
                        <div key={entry.id} className="rounded p-3" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-white">{entry.type} · {entry.date}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: oc.bg, color: oc.text, border: `1px solid ${oc.border}` }}>{entry.outcome}</span>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#b0bac8" }}>{entry.notes}</p>
                        </div>
                      );
                    })
                  )}
                  <button
                    onClick={onOpenEngagement}
                    className="w-full py-2 text-xs font-bold tracking-wider uppercase transition-all hover:opacity-90"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "3px", color: "#a5b4fc" }}
                  >
                    {engagementEntries.length === 0 ? "Log First Interaction" : "View & Edit Full Log"}
                  </button>
                </div>
              )}
            </div>

            {/* Back name footer */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs font-semibold text-white truncate">{stakeholder.name}</p>
              <p className="text-[10px]" style={{ color: "#6b7a8d" }}>{stakeholder.organization}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Excel Export ──────────────────────────────────────────────────────────────

async function exportToExcel(
  stakeholders: Stakeholder[],
  query: { sector: string; region: string },
  engagementLog: Record<string, EngagementEntry[]>
) {
  // Dynamically import xlsx so it's only loaded when needed
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // ── Summary sheet ──────────────────────────────────────────────────────────
  const summaryRows = [
    ["STAKEHOLDER INTELLIGENCE REPORT"],
    [`Sector: ${query.sector}`],
    [`Region: ${query.region}`],
    [`Generated: ${now}`],
    [`Total Stakeholders: ${stakeholders.length}`],
    [],
    ["STANCE BREAKDOWN"],
    ["Supportive", stakeholders.filter((s) => s.stance === "supportive").length],
    ["Neutral", stakeholders.filter((s) => s.stance === "neutral").length],
    ["Opposed", stakeholders.filter((s) => s.stance === "opposed").length],
    [],
    ["CATEGORY BREAKDOWN"],
  ];
  const catCounts: Record<string, number> = {};
  for (const s of stakeholders) {
    const c = s.category || "Uncategorized";
    catCounts[c] = (catCounts[c] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts)) {
    summaryRows.push([cat, count]);
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 44 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ── One sheet per category ────────────────────────────────────────────────
  const headers = [
    "Name / Role",
    "Organization",
    "Current Officeholder",
    "Type",
    "Stance",
    "Influence Score",
    "Key Position 1",
    "Key Position 2",
    "Key Position 3",
    "Engagement Recommendation",
    "Contact",
    "Engagement Entries",
    "Sources",
  ];

  const catGroups: Record<string, Stakeholder[]> = {};
  for (const s of stakeholders) {
    const c = s.category || "Uncategorized";
    (catGroups[c] = catGroups[c] || []).push(s);
  }

  for (const [cat, group] of Object.entries(catGroups)) {
    const rows = group
      .sort((a, b) => b.influence_score - a.influence_score)
      .map((s) => [
        s.name,
        s.organization,
        s.current_officeholder ?? "To be verified",
        TYPE_LABELS[s.type],
        s.stance.charAt(0).toUpperCase() + s.stance.slice(1),
        s.influence_score,
        s.key_positions[0] ?? "",
        s.key_positions[1] ?? "",
        s.key_positions[2] ?? "",
        s.engagement_recommendation ?? "",
        s.contact ?? "",
        (engagementLog[s.name] ?? []).length,
        (s.sources ?? []).join("; "),
      ]);

    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths
    ws["!cols"] = [
      { wch: 34 }, { wch: 28 }, { wch: 24 }, { wch: 16 }, { wch: 13 },
      { wch: 10 }, { wch: 36 }, { wch: 36 }, { wch: 36 }, { wch: 44 },
      { wch: 30 }, { wch: 12 }, { wch: 50 },
    ];

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = cat.length > 31 ? cat.slice(0, 28) + "…" : cat;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // ── Engagement log sheet ──────────────────────────────────────────────────
  const allEntries = Object.values(engagementLog).flat().sort((a, b) => b.date.localeCompare(a.date));
  if (allEntries.length > 0) {
    const engHeaders = ["Stakeholder", "Date", "Type", "Outcome", "Notes"];
    const engRows = allEntries.map((e) => [e.stakeholderName, e.date, e.type, e.outcome, e.notes]);
    const engSheet = XLSX.utils.aoa_to_sheet([engHeaders, ...engRows]);
    engSheet["!cols"] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, engSheet, "Engagement Log");
  }

  // ── Download ──────────────────────────────────────────────────────────────
  const safeRegion = query.region.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeSector = query.sector.replace(/[^a-zA-Z0-9_-]/g, "_");
  XLSX.writeFile(wb, `Stakeholder_Map_${safeSector}_${safeRegion}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[] | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<{ sector: string; region: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<StakeholderCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  // Engagement state
  const [engagementLog, setEngagementLog] = useState<Record<string, EngagementEntry[]>>({});
  const [engagementTarget, setEngagementTarget] = useState<Stakeholder | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setEngagementLog(loadEngagementLog());
  }, []);

  const handleSaveEngagement = (stakeholderName: string, entries: EngagementEntry[]) => {
    const updated = { ...engagementLog, [stakeholderName]: entries };
    setEngagementLog(updated);
    saveEngagementLog(updated);
  };

  const totalEngagementEntries = Object.values(engagementLog).flat().length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExtractFromDocument = async () => {
    if (!uploadedFile) return;
    setUploadLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const extracted: Stakeholder[] = data.stakeholders;
      setStakeholders((prev) => (prev ? [...prev, ...extracted] : extracted));
      if (!resultMode) setResultMode("live");
      if (!lastQuery) setLastQuery({ sector: "Document Extract", region: uploadedFile.name });
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = sector.trim();
    const r = region.trim();
    if (!s || !r) return;

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setStakeholders(null);
    setResultMode(null);
    setActiveCategory(null);
    setLastQuery({ sector: s, region: r });

    let docStakeholders: Stakeholder[] = [];
    if (uploadedFile) {
      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const res = await fetch("/api/extract", { method: "POST", body: formData });
        if (res.ok) { const data = await res.json(); docStakeholders = data.stakeholders; }
      } catch { /* non-fatal */ }
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const demo = getDemoData(s, r);
    if (demo) {
      await new Promise((res) => setTimeout(res, 600));
      setStakeholders([...demo.stakeholders, ...docStakeholders]);
      setResultMode("demo");
      setLoading(false);
      return;
    }

    let batch1: Stakeholder[] = [];
    try {
      const res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sector: s, region: r, batch: 1 }) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error((data as { error?: string }).error || `HTTP ${res.status}`); }
      const data = await res.json();
      batch1 = data.stakeholders;
      setStakeholders([...batch1, ...docStakeholders]);
      setResultMode("live");
    } catch (err) {
      const fallback = getDemoData(s, r);
      if (fallback) { setStakeholders([...fallback.stakeholders, ...docStakeholders]); setResultMode("demo"); }
      else if (docStakeholders.length > 0) { setStakeholders(docStakeholders); setResultMode("live"); }
      else { setError(err instanceof Error ? err.message : "Unknown error"); }
      setLoading(false);
      return;
    }

    setLoading(false);
    setLoadingMore(true);

    try {
      const existingNames = batch1.map((s) => s.name);
      const res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sector: s, region: r, batch: 2, existingNames }) });
      if (res.ok) { const data = await res.json(); const batch2: Stakeholder[] = data.stakeholders; setStakeholders((prev) => [...(prev ?? []), ...batch2]); }
    } catch { /* non-fatal */ } finally { setLoadingMore(false); }
  };

  const stanceSummary = stakeholders
    ? {
        supportive: stakeholders.filter((s) => s.stance === "supportive").length,
        neutral: stakeholders.filter((s) => s.stance === "neutral").length,
        opposed: stakeholders.filter((s) => s.stance === "opposed").length,
      }
    : null;

  const categoryCounts: Record<string, number> = {};
  if (stakeholders) { for (const s of stakeholders) { const cat = s.category || "Uncategorized"; categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; } }

  const filteredStakeholders = stakeholders
    ? (activeCategory ? stakeholders.filter((s) => s.category === activeCategory) : stakeholders)
    : null;

  const handleExport = async () => {
    if (!stakeholders || !lastQuery) return;
    setExporting(true);
    try {
      await exportToExcel(stakeholders, lastQuery, engagementLog);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--navy-900)" }}>
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-4" style={{ background: "var(--navy-950)", borderBottom: "1px solid rgba(204,41,54,0.3)" }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-1 h-6" style={{ background: "var(--crimson)" }} />
          <span className="text-white font-bold text-sm tracking-wider uppercase">Stakeholder Intelligence</span>
        </Link>
        <div className="flex items-center gap-3">
          {resultMode && <ModeBadge mode={resultMode} />}
          <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1" style={{ color: "var(--crimson)", border: "1px solid rgba(204,41,54,0.3)", borderRadius: "2px" }}>Discover</span>
        </div>
      </header>

      {/* ── Warning banner ── */}
      <div className="flex items-start gap-3 px-8 py-3 text-sm" style={{ background: "rgba(202,138,4,0.1)", borderBottom: "1px solid rgba(202,138,4,0.3)", color: "#fde68a" }}>
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        <span><strong>AI-assisted research</strong> — profiles are generated for discovery purposes only. Verify all information before use in client engagements.</span>
      </div>

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">
        {/* ── Search form ── */}
        <div className="rounded p-8 mb-10" style={{ background: "var(--navy-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 className="text-2xl font-bold text-white mb-1">Stakeholder Mapping</h1>
          <p className="text-sm mb-6" style={{ color: "#8892a4" }}>Enter a sector and region to generate an AI-powered stakeholder analysis</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--crimson)" }}>Sector</label>
                <input suppressHydrationWarning type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Renewable Energy, Healthcare, Finance" className="w-full px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:outline-none" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", transition: "border-color 0.2s" }} onFocus={(e) => (e.target.style.borderColor = "rgba(204,41,54,0.5)")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--crimson)" }}>Region</label>
                <input suppressHydrationWarning type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Sub-Saharan Africa, Southeast Asia, EU" className="w-full px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:outline-none" style={{ background: "var(--navy-700)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", transition: "border-color 0.2s" }} onFocus={(e) => (e.target.style.borderColor = "rgba(204,41,54,0.5)")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
              <button type="submit" disabled={loading || !sector.trim() || !region.trim()} className="px-8 py-3 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0" style={{ background: loading ? "var(--crimson-dark)" : "var(--crimson)", borderRadius: "2px", minWidth: "140px" }} onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = "var(--crimson-light)"; }} onMouseLeave={(e) => { if (!loading) (e.target as HTMLElement).style.background = "var(--crimson)"; }}>{loading ? "Analysing…" : "Analyse"}</button>
            </div>

            {/* Document upload */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileSelect} className="hidden" id="doc-upload" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200" style={{ color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "2px", background: "rgba(99,102,241,0.08)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" /></svg>
                Upload Document
              </button>
              {uploadedFile && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {uploadedFile.name}
                  </span>
                  <button type="button" onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {!sector.trim() || !region.trim() ? (
                    <button type="button" onClick={handleExtractFromDocument} disabled={uploadLoading} className="px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-white transition-all duration-200 disabled:opacity-40" style={{ background: "var(--crimson)", borderRadius: "2px" }}>{uploadLoading ? "Extracting…" : "Extract Stakeholders"}</button>
                  ) : (
                    <span className="text-xs" style={{ color: "#6b7a8d" }}>Will be included in analysis</span>
                  )}
                </div>
              )}
              <span className="text-xs" style={{ color: "#4a5568" }}>PDF, DOCX, PPTX supported</span>
            </div>

            <p className="text-xs" style={{ color: "#4a5568" }}>Demo data available for: <span style={{ color: "#6b7a8d" }}>{DEMO_HINTS}</span></p>
          </form>
        </div>

        {/* ── Loading states ── */}
        {uploadLoading && !stakeholders && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin mb-4" style={{ borderColor: "#818cf8", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "#8892a4" }}>Extracting stakeholders from document…</p>
          </div>
        )}
        {loading && !stakeholders && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin mb-4" style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "#8892a4" }}>Searching and analysing stakeholders for <strong className="text-white">{lastQuery?.sector}</strong> in <strong className="text-white">{lastQuery?.region}</strong>…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="px-5 py-4 rounded text-sm mb-8" style={{ background: "rgba(204,41,54,0.1)", border: "1px solid rgba(204,41,54,0.3)", color: "#f87171" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ── Results ── */}
        {stakeholders && (
          <>
            {/* Results header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h2 className="text-lg font-bold text-white">{stakeholders.length} Stakeholders Identified</h2>
                  {resultMode && <ModeBadge mode={resultMode} />}
                </div>
                <p className="text-sm" style={{ color: "#8892a4" }}>{lastQuery?.sector} · {lastQuery?.region}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {stanceSummary && (
                  <>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.25)" }}>{stanceSummary.supportive} Supportive</div>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: "rgba(234,179,8,0.1)", color: "#facc15", border: "1px solid rgba(234,179,8,0.25)" }}>{stanceSummary.neutral} Neutral</div>
                    <div className="px-3 py-1.5 rounded text-xs font-semibold" style={{ background: "rgba(204,41,54,0.1)", color: "#f87171", border: "1px solid rgba(204,41,54,0.25)" }}>{stanceSummary.opposed} Opposed</div>
                  </>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex gap-3 flex-wrap">
                {/* View toggles */}
                <button onClick={() => setViewMode("list")} className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-200" style={{ background: viewMode === "list" ? "var(--crimson)" : "transparent", color: viewMode === "list" ? "#fff" : "#8892a4", border: viewMode === "list" ? "1px solid var(--crimson)" : "1px solid rgba(255,255,255,0.12)", borderRadius: "3px" }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>List View
                </button>
                <button onClick={() => setViewMode("map")} className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-200" style={{ background: viewMode === "map" ? "var(--crimson)" : "transparent", color: viewMode === "map" ? "#fff" : "#8892a4", border: viewMode === "map" ? "1px solid var(--crimson)" : "1px solid rgba(255,255,255,0.12)", borderRadius: "3px" }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>Map View
                </button>
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* Engagement overview */}
                <button
                  onClick={() => setShowOverview(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-200 hover:opacity-90"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "3px", color: "#a5b4fc" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  Engagement {totalEngagementEntries > 0 ? `(${totalEngagementEntries})` : "Log"}
                </button>

                {/* Export button */}
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)", borderRadius: "3px" }}
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                      Export to Excel
                    </>
                  )}
                </button>

                {/* Add stakeholder */}
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 hover:opacity-90" style={{ background: "var(--crimson)", borderRadius: "3px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Add Stakeholder
                </button>
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button onClick={() => setActiveCategory(null)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150" style={{ background: activeCategory === null ? "rgba(204,41,54,0.2)" : "rgba(255,255,255,0.05)", color: activeCategory === null ? "var(--crimson-light)" : "#8892a4", border: `1px solid ${activeCategory === null ? "rgba(204,41,54,0.4)" : "rgba(255,255,255,0.08)"}` }}>All ({stakeholders.length})</button>
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                const isActive = activeCategory === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150" style={{ background: isActive ? `${color}30` : "rgba(255,255,255,0.05)", color: isActive ? color : "#8892a4", border: `1px solid ${isActive ? `${color}60` : "rgba(255,255,255,0.08)"}` }}>
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* List view */}
            {viewMode === "list" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{ animation: "fadeIn 0.25s ease-out" }}>
                {(filteredStakeholders ?? [])
                  .sort((a, b) => b.influence_score - a.influence_score)
                  .map((s, i) => (
                    <StakeholderCard
                      key={`${s.name}-${i}`}
                      stakeholder={s}
                      engagementEntries={engagementLog[s.name] ?? []}
                      onOpenEngagement={() => setEngagementTarget(s)}
                    />
                  ))}
              </div>
            )}
            {viewMode === "list" && loadingMore && (
              <div className="flex items-center justify-center gap-3 mt-6 px-5 py-4 rounded" style={{ background: "var(--navy-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }} />
                <p className="text-sm" style={{ color: "#8892a4" }}>Discovering additional regional and local stakeholders…</p>
              </div>
            )}

            {/* Map view */}
            {viewMode === "map" && (
              <Suspense fallback={<div className="flex items-center justify-center rounded" style={{ height: "600px", background: "var(--navy-800)", border: "1px solid rgba(255,255,255,0.06)" }}><div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }} /></div>}>
                <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                  <MapView stakeholders={filteredStakeholders ?? []} />
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-3 mt-4 px-5 py-3 rounded" style={{ background: "var(--navy-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }} />
                      <p className="text-sm" style={{ color: "#8892a4" }}>Discovering additional stakeholders…</p>
                    </div>
                  )}
                </div>
              </Suspense>
            )}
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !uploadLoading && !stakeholders && !error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-4" style={{ background: "rgba(204,41,54,0.08)", border: "1px solid rgba(204,41,54,0.2)" }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--crimson)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-base font-semibold text-white mb-1">No stakeholders mapped yet</p>
            <p className="text-sm" style={{ color: "#8892a4" }}>Enter a sector and region above to begin your analysis</p>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 text-xs text-center" style={{ color: "#4a5568", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        Powered by Claude AI · Stakeholder Intelligence Platform
      </footer>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddStakeholderModal
          onAdd={(newStakeholder) => {
            setStakeholders((prev) => (prev ? [...prev, newStakeholder] : [newStakeholder]));
            if (!resultMode) setResultMode("live");
            if (!lastQuery) setLastQuery({ sector: "Manual Entry", region: "Various" });
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {engagementTarget && (
        <EngagementModal
          stakeholder={engagementTarget}
          entries={engagementLog[engagementTarget.name] ?? []}
          onSave={(entries) => handleSaveEngagement(engagementTarget.name, entries)}
          onClose={() => setEngagementTarget(null)}
        />
      )}

      {showOverview && (
        <EngagementOverviewModal
          log={engagementLog}
          onClose={() => setShowOverview(false)}
        />
      )}
    </div>
  );
}
