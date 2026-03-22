import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6" style={{ background: "var(--navy-900)" }}>
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-3 h-8" style={{ background: "var(--crimson)" }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--crimson)" }}>
            Strategic Intelligence
          </span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
          Stakeholder Intelligence
          <br />
          <span style={{ color: "var(--crimson-light)" }}>Platform</span>
        </h1>
        <p className="text-lg mb-10" style={{ color: "#8892a4" }}>
          AI-powered stakeholder mapping for strategic consulting engagements.
          Identify key players, assess influence, and develop targeted engagement strategies.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold text-sm tracking-wider uppercase transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px]"
          style={{ background: "var(--crimson)", borderRadius: "2px" }}
        >
          Launch Stakeholder Mapping
          <span>→</span>
        </Link>
      </div>
    </main>
  );
}
