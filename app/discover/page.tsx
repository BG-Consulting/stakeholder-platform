"use client";

import { useState } from "react";
import Link from "next/link";
import type { Stakeholder } from "../api/discover/route";
import { getDemoData, DEMO_HINTS } from "../lib/demoData";

const TYPE_LABELS: Record<Stakeholder["type"], string> = {
  government: "Government",
  private: "Private Sector",
  ngo: "NGO",
  media: "Media",
  academic: "Academic",
};

const TYPE_COLORS: Record<Stakeholder["type"], string> = {
  government: "#1d4ed8",
  private: "#0f766e",
  ngo: "#7e22ce",
  media: "#b45309",
  academic: "#0369a1",
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

function StakeholderCard({ stakeholder }: { stakeholder: Stakeholder }) {
  const stance = STANCE_CONFIG[stakeholder.stance];
  const typeColor = TYPE_COLORS[stakeholder.type];
  const sources = stakeholder.sources ?? [];

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-base text-white truncate"
            title={stakeholder.name}
          >
            {stakeholder.name}
          </h3>
          <p
            className="text-sm mt-0.5 truncate"
            style={{ color: "#8892a4" }}
            title={stakeholder.organization}
          >
            {stakeholder.organization}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#4a5568" }}>
            <span style={{ color: "#6b7a8d" }}>Current: </span>
            {stakeholder.current_officeholder ?? "To be verified"}
          </p>
        </div>
        <span
          className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
          style={{ background: `${typeColor}25`, color: typeColor }}
        >
          {TYPE_LABELS[stakeholder.type]}
        </span>
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

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

      {/* Sources */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "#8892a4" }}
        >
          Sources
        </p>
        {sources.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {sources.map((url, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span
                  className="text-xs mt-0.5 shrink-0"
                  style={{ color: "#4a5568" }}
                >
                  {i + 1}.
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs break-all leading-relaxed hover:underline"
                  style={{ color: "#60a5fa" }}
                  title={url}
                >
                  {url.length > 60 ? url.slice(0, 57) + "…" : url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs italic" style={{ color: "#4a5568" }}>
            No sources retrieved — verify independently.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[] | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<{ sector: string; region: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = sector.trim();
    const r = region.trim();
    if (!s || !r) return;

    setLoading(true);
    setError(null);
    setStakeholders(null);
    setResultMode(null);
    setLastQuery({ sector: s, region: r });

    // Check for preset demo scenario first
    const demo = getDemoData(s, r);
    if (demo) {
      // Small artificial delay so it doesn't feel instantaneous
      await new Promise((res) => setTimeout(res, 600));
      setStakeholders(demo.stakeholders);
      setResultMode("demo");
      setLoading(false);
      return;
    }

    // Otherwise hit the live API
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: s, region: r }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStakeholders(data.stakeholders);
      setResultMode("live");
    } catch (err) {
      // On API failure, fall back to demo data if any scenario matches loosely,
      // otherwise surface the error
      const fallback = getDemoData(s, r);
      if (fallback) {
        setStakeholders(fallback.stakeholders);
        setResultMode("demo");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const stanceSummary = stakeholders
    ? {
        supportive: stakeholders.filter((s) => s.stance === "supportive").length,
        neutral: stakeholders.filter((s) => s.stance === "neutral").length,
        opposed: stakeholders.filter((s) => s.stance === "opposed").length,
      }
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

        {/* Loading state */}
        {loading && (
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
        {stakeholders && !loading && (
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

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stakeholders
                .sort((a, b) => b.influence_score - a.influence_score)
                .map((s, i) => (
                  <StakeholderCard key={i} stakeholder={s} />
                ))}
            </div>
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
