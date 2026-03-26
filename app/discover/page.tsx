"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import type { Stakeholder, StakeholderCategory } from "../api/discover/route";
import { getDemoData, DEMO_HINTS } from "../lib/demoData";

const MapView = lazy(() => import("./MapView"));

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

const STANCE_CONFIG: Record<
  Stakeholder["stance"],
  { label: string; bg: string; text: string; border: string }
> = {
  supportive: {
    label: "Supportive",
    bg: "rgba(22, 163, 74, 0.15)",
    text: "#4ade80",
    border: "rgba(22, 163, 74, 0.4)",
  },
  neutral: {
    label: "Neutral",
    bg: "rgba(234, 179, 8, 0.15)",
    text: "#facc15",
    border: "rgba(234, 179, 8, 0.4)",
  },
  opposed: {
    label: "Opposed",
    bg: "rgba(204, 41, 54, 0.15)",
    text: "#f87171",
    border: "rgba(204, 41, 54, 0.4)",
  },
};

type ResultMode = "demo" | "live";

function ModeBadge({ mode }: { mode: ResultMode }) {
  if (mode === "demo") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase"
        style={{
          background: "rgba(234, 179, 8, 0.12)",
          color: "#fbbf24",
          border: "1px solid rgba(234, 179, 8, 0.35)",
          borderRadius: "2px",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#fbbf24" }}
        />
        Demo
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-widest uppercase"
      style={{
        background: "rgba(22, 163, 74, 0.12)",
        color: "#4ade80",
        border: "1px solid rgba(22, 163, 74, 0.35)",
        borderRadius: "2px",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "#4ade80" }}
      />
      Live
    </span>
  );
}

function InfluenceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              background:
                i < score
                  ? i < 4
                    ? "var(--crimson)"
                    : i < 7
                      ? "#f59e0b"
                      : "#ef4444"
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-bold" style={{ color: "#8892a4" }}>
        {score}/10
      </span>
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
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#60a5fa" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) : (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#60a5fa" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs break-all hover:underline"
        style={{ color: "#60a5fa" }}
        title={contact}
      >
        {display}
      </a>
    </div>
  );
}

function StakeholderCard({ stakeholder }: { stakeholder: Stakeholder }) {
  const stance = STANCE_CONFIG[stakeholder.stance];
  const typeColor = TYPE_COLORS[stakeholder.type];

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded"
      style={{
        background: "var(--navy-800)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(204, 41, 54, 0.3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")
      }
    >
      {/* Header */}
      <div>
        <h3
          className="font-bold text-base text-white"
          title={stakeholder.name}
        >
          {stakeholder.name}
        </h3>
        <p
          className="text-sm mt-0.5"
          style={{ color: "#8892a4" }}
        >
          {stakeholder.organization}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>
          <span style={{ color: "#6b7a8d" }}>Current: </span>
          {stakeholder.current_officeholder ?? "To be verified"}
        </p>
        <ContactInfo contact={stakeholder.contact} />
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
            style={{ background: `${typeColor}25`, color: typeColor }}
          >
            {TYPE_LABELS[stakeholder.type]}
          </span>
          {stakeholder.category && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide"
              style={{
                background: `${CATEGORY_COLORS[stakeholder.category] ?? "#555"}20`,
                color: CATEGORY_COLORS[stakeholder.category] ?? "#999",
                border: `1px solid ${CATEGORY_COLORS[stakeholder.category] ?? "#555"}30`,
              }}
            >
              {stakeholder.category}
            </span>
          )}
        </div>
      </div>

      {/* Stance + Influence */}
      <div className="flex items-center justify-between gap-4">
        <span
          className="px-2.5 py-1 rounded text-xs font-semibold"
          style={{
            background: stance.bg,
            color: stance.text,
            border: `1px solid ${stance.border}`,
          }}
        >
          {stance.label}
        </span>
        <InfluenceBar score={stakeholder.influence_score} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

      {/* Key Positions */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--crimson)" }}
        >
          Key Positions
        </p>
        <ul className="flex flex-col gap-1.5">
          {stakeholder.key_positions.map((pos, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: "#b0bac8" }}>
              <span style={{ color: "var(--crimson)", marginTop: "1px" }}>›</span>
              {pos}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

      {/* Engagement Recommendation */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "#8892a4" }}
        >
          Engagement Strategy
        </p>
        <p className="text-sm" style={{ color: "#b0bac8" }}>
          {stakeholder.engagement_recommendation}
        </p>
      </div>

    </div>
  );
}

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

    // Check for preset demo scenario first
    const demo = getDemoData(s, r);
    if (demo) {
      await new Promise((res) => setTimeout(res, 600));
      setStakeholders(demo.stakeholders);
      setResultMode("demo");
      setLoading(false);
      return;
    }

    // ── Batch 1: fetch the first 10-12 high-priority stakeholders ────────
    let batch1: Stakeholder[] = [];
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: s, region: r, batch: 1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      batch1 = data.stakeholders;
      setStakeholders(batch1);
      setResultMode("live");
    } catch (err) {
      const fallback = getDemoData(s, r);
      if (fallback) {
        setStakeholders(fallback.stakeholders);
        setResultMode("demo");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
      setLoading(false);
      return;
    }

    // Show batch 1 results, switch from full loading to "loading more"
    setLoading(false);
    setLoadingMore(true);

    // ── Batch 2: fetch additional 10-12 lesser-known stakeholders ─────────
    try {
      const existingNames = batch1.map((s) => s.name);
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: s, region: r, batch: 2, existingNames }),
      });
      if (res.ok) {
        const data = await res.json();
        const batch2: Stakeholder[] = data.stakeholders;
        setStakeholders((prev) => [...(prev ?? []), ...batch2]);
      }
      // If batch 2 fails, silently keep batch 1 results
    } catch {
      // Batch 2 failure is non-fatal
    } finally {
      setLoadingMore(false);
    }
  };

  const stanceSummary = stakeholders
    ? {
        supportive: stakeholders.filter((s) => s.stance === "supportive").length,
        neutral: stakeholders.filter((s) => s.stance === "neutral").length,
        opposed: stakeholders.filter((s) => s.stance === "opposed").length,
      }
    : null;

  const categoryCounts: Record<string, number> = {};
  if (stakeholders) {
    for (const s of stakeholders) {
      const cat = s.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const filteredStakeholders = stakeholders
    ? activeCategory
      ? stakeholders.filter((s) => s.category === activeCategory)
      : stakeholders
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--navy-900)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{
          background: "var(--navy-950)",
          borderBottom: "1px solid rgba(204, 41, 54, 0.3)",
        }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-1 h-6" style={{ background: "var(--crimson)" }} />
          <span className="text-white font-bold text-sm tracking-wider uppercase">
            Stakeholder Intelligence
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {resultMode && <ModeBadge mode={resultMode} />}
          <span
            className="text-xs font-semibold tracking-widest uppercase px-3 py-1"
            style={{
              color: "var(--crimson)",
              border: "1px solid rgba(204, 41, 54, 0.3)",
              borderRadius: "2px",
            }}
          >
            Discover
          </span>
        </div>
      </header>

      {/* Warning banner */}
      <div
        className="flex items-start gap-3 px-8 py-3 text-sm"
        style={{
          background: "rgba(202, 138, 4, 0.1)",
          borderBottom: "1px solid rgba(202, 138, 4, 0.3)",
          color: "#fde68a",
        }}
      >
        <svg
          className="w-4 h-4 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span>
          <strong>AI-assisted research</strong> — profiles are generated for discovery
          purposes only. Verify all information before use in client engagements.
        </span>
      </div>

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">
        {/* Search form */}
        <div
          className="rounded p-8 mb-10"
          style={{
            background: "var(--navy-800)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            Stakeholder Mapping
          </h1>
          <p className="text-sm mb-6" style={{ color: "#8892a4" }}>
            Enter a sector and region to generate an AI-powered stakeholder analysis
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--crimson)" }}
                >
                  Sector
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Renewable Energy, Healthcare, Finance"
                  className="w-full px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:outline-none"
                  style={{
                    background: "var(--navy-700)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "2px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(204, 41, 54, 0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--crimson)" }}
                >
                  Region
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Sub-Saharan Africa, Southeast Asia, EU"
                  className="w-full px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:outline-none"
                  style={{
                    background: "var(--navy-700)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "2px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(204, 41, 54, 0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loading || !sector.trim() || !region.trim()}
                className="px-8 py-3 text-sm font-bold tracking-wider uppercase text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{
                  background: loading ? "var(--crimson-dark)" : "var(--crimson)",
                  borderRadius: "2px",
                  minWidth: "140px",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    (e.target as HTMLElement).style.background = "var(--crimson-light)";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    (e.target as HTMLElement).style.background = "var(--crimson)";
                }}
              >
                {loading ? "Analysing…" : "Analyse"}
              </button>
            </div>
            <p className="text-xs" style={{ color: "#4a5568" }}>
              Demo data available for:{" "}
              <span style={{ color: "#6b7a8d" }}>{DEMO_HINTS}</span>
            </p>
          </form>
        </div>

        {/* Loading state — only show full spinner when no results yet */}
        {loading && !stakeholders && (
          <div className="text-center py-16">
            <div
              className="inline-block w-8 h-8 rounded-full border-2 animate-spin mb-4"
              style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#8892a4" }}>
              Searching and analysing stakeholders for{" "}
              <strong className="text-white">{lastQuery?.sector}</strong> in{" "}
              <strong className="text-white">{lastQuery?.region}</strong>…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-5 py-4 rounded text-sm mb-8"
            style={{
              background: "rgba(204, 41, 54, 0.1)",
              border: "1px solid rgba(204, 41, 54, 0.3)",
              color: "#f87171",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {stakeholders && (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h2 className="text-lg font-bold text-white">
                    {stakeholders.length} Stakeholders Identified
                  </h2>
                  {resultMode && <ModeBadge mode={resultMode} />}
                </div>
                <p className="text-sm" style={{ color: "#8892a4" }}>
                  {lastQuery?.sector} · {lastQuery?.region}
                </p>
              </div>
              <div className="flex gap-3">
                {stanceSummary && (
                  <>
                    <div
                      className="px-3 py-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "rgba(22, 163, 74, 0.1)",
                        color: "#4ade80",
                        border: "1px solid rgba(22, 163, 74, 0.25)",
                      }}
                    >
                      {stanceSummary.supportive} Supportive
                    </div>
                    <div
                      className="px-3 py-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "rgba(234, 179, 8, 0.1)",
                        color: "#facc15",
                        border: "1px solid rgba(234, 179, 8, 0.25)",
                      }}
                    >
                      {stanceSummary.neutral} Neutral
                    </div>
                    <div
                      className="px-3 py-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "rgba(204, 41, 54, 0.1)",
                        color: "#f87171",
                        border: "1px solid rgba(204, 41, 54, 0.25)",
                      }}
                    >
                      {stanceSummary.opposed} Opposed
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-200"
                style={{
                  background: viewMode === "list" ? "var(--crimson)" : "transparent",
                  color: viewMode === "list" ? "#fff" : "#8892a4",
                  border: viewMode === "list" ? "1px solid var(--crimson)" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "3px",
                }}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-200"
                style={{
                  background: viewMode === "map" ? "var(--crimson)" : "transparent",
                  color: viewMode === "map" ? "#fff" : "#8892a4",
                  border: viewMode === "map" ? "1px solid var(--crimson)" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "3px",
                }}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map View
              </button>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button
                onClick={() => setActiveCategory(null)}
                className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
                style={{
                  background: activeCategory === null ? "rgba(204, 41, 54, 0.2)" : "rgba(255,255,255,0.05)",
                  color: activeCategory === null ? "var(--crimson-light)" : "#8892a4",
                  border: `1px solid ${activeCategory === null ? "rgba(204, 41, 54, 0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                All ({stakeholders.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                const isActive = activeCategory === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
                    style={{
                      background: isActive ? `${color}30` : "rgba(255,255,255,0.05)",
                      color: isActive ? color : "#8892a4",
                      border: `1px solid ${isActive ? `${color}60` : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* List view */}
            {viewMode === "list" && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                style={{ animation: "fadeIn 0.25s ease-out" }}
              >
                  {(filteredStakeholders ?? [])
                    .sort((a, b) => b.influence_score - a.influence_score)
                    .map((s, i) => (
                      <StakeholderCard key={`${s.name}-${i}`} stakeholder={s} />
                    ))}
              </div>
            )}
            {viewMode === "list" && loadingMore && (
              <div
                className="flex items-center justify-center gap-3 mt-6 px-5 py-4 rounded"
                style={{
                  background: "var(--navy-800)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }}
                />
                <p className="text-sm" style={{ color: "#8892a4" }}>
                  Discovering additional regional and local stakeholders…
                </p>
              </div>
            )}

            {/* Map view */}
            {viewMode === "map" && (
              <Suspense
                fallback={
                  <div
                    className="flex items-center justify-center rounded"
                    style={{ height: "600px", background: "var(--navy-800)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }}
                    />
                  </div>
                }
              >
                <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                <MapView stakeholders={filteredStakeholders ?? []} />
                {loadingMore && (
                  <div
                    className="flex items-center justify-center gap-3 mt-4 px-5 py-3 rounded"
                    style={{
                      background: "var(--navy-800)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--crimson)", borderTopColor: "transparent" }}
                    />
                    <p className="text-sm" style={{ color: "#8892a4" }}>
                      Discovering additional stakeholders…
                    </p>
                  </div>
                )}
                </div>
              </Suspense>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !stakeholders && !error && (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded mb-4"
              style={{
                background: "rgba(204, 41, 54, 0.08)",
                border: "1px solid rgba(204, 41, 54, 0.2)",
              }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--crimson)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-white mb-1">
              No stakeholders mapped yet
            </p>
            <p className="text-sm" style={{ color: "#8892a4" }}>
              Enter a sector and region above to begin your analysis
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="px-8 py-4 text-xs text-center"
        style={{
          color: "#4a5568",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        Powered by Claude AI · Stakeholder Intelligence Platform
      </footer>
    </div>
  );
}
