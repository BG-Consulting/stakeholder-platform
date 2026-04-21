"use client";

import { useState } from "react";
import type { SocialAnalysisResult, StakeholderMediaProfile } from "../api/social-analysis/route";

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const T = {
  navy: "#003057", navyMid: "#4a6080", navyLight: "#7a92a8",
  crimson: "#cb333b", crimsonBg: "rgba(203,51,59,0.08)", crimsonBorder: "rgba(203,51,59,0.3)",
  white: "#ffffff", pageBg: "#f4f5f7", cardBg: "#f0f2f5",
  border: "rgba(0,48,87,0.12)",
  green: "#15803d", greenBg: "rgba(21,128,61,0.1)", greenBorder: "rgba(21,128,61,0.3)",
  yellow: "#92650a", yellowBg: "rgba(146,101,10,0.08)", yellowBorder: "rgba(146,101,10,0.25)",
  red: "#cb333b", redBg: "rgba(203,51,59,0.08)", redBorder: "rgba(203,51,59,0.25)",
  indigo: "#3730a3", indigoBg: "rgba(55,48,163,0.08)", indigoBorder: "rgba(55,48,163,0.25)",
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function sentimentColor(s: string) {
  if (s === "Positive") return { bg: T.greenBg, text: T.green, border: T.greenBorder };
  if (s === "Negative") return { bg: T.redBg, text: T.red, border: T.redBorder };
  if (s === "Mixed")    return { bg: T.indigoBg, text: T.indigo, border: T.indigoBorder };
  return { bg: T.yellowBg, text: T.yellow, border: T.yellowBorder };
}

function volumeColor(v: string) {
  if (v === "High")   return T.crimson;
  if (v === "Medium") return "#f59e0b";
  if (v === "Low")    return T.navyLight;
  return "#d0d3d4";
}

function framingColor(f: string) {
  if (f === "Crisis")   return { bg: T.redBg, text: T.red };
  if (f === "Political") return { bg: T.indigoBg, text: T.indigo };
  if (f === "Positive") return { bg: T.greenBg, text: T.green };
  if (f === "Administrative") return { bg: T.yellowBg, text: T.yellow };
  return { bg: T.cardBg, text: T.navyMid };
}

function strengthColor(s: string) {
  if (s === "Strong")   return T.crimson;
  if (s === "Moderate") return "#f59e0b";
  return T.navyLight;
}

// â”€â”€â”€ HTML Report Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function exportReport(analysis: SocialAnalysisResult) {
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const sc = analysis.sentiment_breakdown;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Social Media Analysis â€” ${analysis.sector}, ${analysis.region}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Calibri,Arial,sans-serif;font-size:13px;color:#003057;background:#f4f5f7}
.tab-bar{position:sticky;top:0;z-index:100;background:#003057;display:flex;gap:0;overflow-x:auto;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.tab-btn{padding:12px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.6);cursor:pointer;border:none;background:transparent;white-space:nowrap;border-bottom:3px solid transparent;transition:all .2s}
.tab-btn:hover{color:white;background:rgba(255,255,255,.1)}
.tab-btn.active{color:white;border-bottom:3px solid #cb333b;background:rgba(255,255,255,.08)}
.tab-content{display:none}.tab-content.active{display:block}
.page{max-width:1100px;margin:0 auto;padding:36px 28px}
.cover-header{background:#003057;color:white;padding:44px 44px 28px;border-radius:8px 8px 0 0}
.cover-header h1{font-size:28px;font-weight:700;margin-bottom:6px}
.cover-sub{background:#cb333b;color:white;padding:10px 44px;font-size:13px;font-weight:600;border-radius:0 0 8px 8px;margin-bottom:28px}
.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:24px}
.meta-box{background:white;border:1px solid rgba(0,48,87,.12);border-radius:6px;padding:14px 18px}
.meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#cb333b;margin-bottom:3px}
.meta-value{font-size:15px;font-weight:700;color:#003057}
.sentiment-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
.sentiment-box{padding:18px;border-radius:6px;text-align:center}
.sentiment-box .pct{font-size:36px;font-weight:700;line-height:1}
.sentiment-box .lbl{font-size:11px;font-weight:700;text-transform:uppercase;margin-top:4px}
.section-title{background:#003057;color:white;padding:9px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-radius:4px;margin:24px 0 10px}
table{width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden;box-shadow:0 1px 6px rgba(0,48,87,.08);margin-bottom:10px}
th{background:#cb333b;color:white;padding:8px 11px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:left}
td{padding:9px 11px;border-bottom:1px solid rgba(0,48,87,.07);font-size:12px;vertical-align:top;line-height:1.5}
tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#f4f5f7}
.badge{padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;display:inline-block}
.info-box{background:white;border:1px solid rgba(0,48,87,.12);border-radius:6px;padding:16px 20px;margin-bottom:12px}
.footer{margin-top:40px;padding-top:14px;border-top:1px solid rgba(0,48,87,.12);color:#7a92a8;font-size:11px;display:flex;justify-content:space-between}
.data-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
@media print{.tab-bar{display:none}.tab-content{display:block!important}}
</style></head><body>
<div class="tab-bar">
  <button class="tab-btn active" onclick="showTab('cover')">Cover</button>
  <button class="tab-btn" onclick="showTab('sentiment')">Sentiment</button>
  <button class="tab-btn" onclick="showTab('narratives')">Narratives</button>
  <button class="tab-btn" onclick="showTab('actors')">Actors</button>
  <button class="tab-btn" onclick="showTab('topics')">Topic Links</button>
  <button class="tab-btn" onclick="showTab('stakeholders')">Stakeholders</button>
</div>
<script>
function showTab(id){document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'));document.getElementById(id).classList.add('active');event.target.classList.add('active');}
</script>

<!-- COVER -->
<div id="cover" class="tab-content active"><div class="page">
  <div class="cover-header">
    <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:8px">Beyond Group Consulting â€” Social Media &amp; Media Intelligence</div>
    <h1>Social Media &amp; Public Discourse Analysis</h1>
    <div style="font-size:15px;color:rgba(255,255,255,.8);margin-top:4px">${analysis.sector} &nbsp;Â·&nbsp; ${analysis.region}</div>
    ${analysis.objectives ? `<div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:6px;font-style:italic">Objectives: ${analysis.objectives}</div>` : ""}
  </div>
  <div class="cover-sub">Confidential â€” ${analysis.time_window} &nbsp;Â·&nbsp; Generated ${now} &nbsp;Â·&nbsp; Data: ${analysis.data_source === "live" ? "Live web search + AI synthesis" : "AI knowledge simulation"}</div>
  <div class="meta-grid">
    <div class="meta-box"><div class="meta-label">Sector</div><div class="meta-value">${analysis.sector}</div></div>
    <div class="meta-box"><div class="meta-label">Region</div><div class="meta-value">${analysis.region}</div></div>
    <div class="meta-box"><div class="meta-label">Est. Total Mentions</div><div class="meta-value">${analysis.total_estimated_mentions.toLocaleString()}</div></div>
    <div class="meta-box"><div class="meta-label">Time Window</div><div class="meta-value">${analysis.time_window}</div></div>
  </div>
  <div class="section-title">Executive Summary</div>
  <div class="info-box"><p style="line-height:1.7;color:#4a6080">${analysis.overall_summary.replace(/\n/g,"</p><p style='margin-top:12px;line-height:1.7;color:#4a6080'>")}</p></div>
  ${analysis.risk_signals.length > 0 ? `<div class="section-title" style="background:#991b1b">Risk Signals</div><div class="info-box" style="border-color:rgba(203,51,59,.3)"><ul style="padding-left:16px">${analysis.risk_signals.map(r=>`<li style="margin-bottom:6px;color:#4a6080">${r}</li>`).join("")}</ul></div>` : ""}
  ${analysis.opportunities.length > 0 ? `<div class="section-title" style="background:#166534">Opportunities</div><div class="info-box" style="border-color:rgba(21,128,61,.3)"><ul style="padding-left:16px">${analysis.opportunities.map(o=>`<li style="margin-bottom:6px;color:#4a6080">${o}</li>`).join("")}</ul></div>` : ""}
  <div class="footer"><span>Beyond Group Consulting &nbsp;Â·&nbsp; Social Intelligence</span><span>${now}</span></div>
</div></div>

<!-- SENTIMENT -->
<div id="sentiment" class="tab-content"><div class="page">
  <div class="section-title">Sentiment Breakdown</div>
  <div class="sentiment-grid">
    <div class="sentiment-box" style="background:#e6f4ea;color:#166534"><div class="pct">${sc.positive}%</div><div class="lbl">Positive</div></div>
    <div class="sentiment-box" style="background:#fff8e1;color:#854d0e"><div class="pct">${sc.neutral}%</div><div class="lbl">Neutral</div></div>
    <div class="sentiment-box" style="background:#fdecea;color:#991b1b"><div class="pct">${sc.negative}%</div><div class="lbl">Negative</div></div>
  </div>
  <div class="section-title">Platform Breakdown</div>
  <table><thead><tr><th>Platform</th><th>Share</th><th>Sentiment</th><th>Notes</th></tr></thead><tbody>
  ${analysis.platform_breakdown.map(p=>`<tr><td style="font-weight:700">${p.platform}</td><td>${p.share_pct}%</td><td><span class="badge" style="background:${p.sentiment==="Positive"?"#e6f4ea":p.sentiment==="Negative"?"#fdecea":"#fff8e1"};color:${p.sentiment==="Positive"?"#166534":p.sentiment==="Negative"?"#991b1b":"#854d0e"}">${p.sentiment}</span></td><td style="color:#4a6080">${p.notes}</td></tr>`).join("")}
  </tbody></table>
  <div class="section-title">Volume Trend (6 Months)</div>
  <table><thead><tr><th>Period</th><th>Volume</th><th>Key Development</th></tr></thead><tbody>
  ${analysis.volume_trend.map(v=>`<tr><td style="font-weight:700">${v.period}</td><td><span class="badge" style="background:${v.volume==="High"?"rgba(203,51,59,.1)":v.volume==="Medium"?"rgba(245,158,11,.1)":"rgba(122,146,168,.1)"};color:${v.volume==="High"?"#cb333b":v.volume==="Medium"?"#b45309":"#7a92a8"}">${v.volume}</span></td><td style="color:#4a6080">${v.note}</td></tr>`).join("")}
  </tbody></table>
  <div class="section-title">Public Engagement Summary</div>
  <div class="info-box"><p style="line-height:1.7;color:#4a6080">${analysis.public_engagement_summary.replace(/\n/g,"</p><p style='margin-top:10px;line-height:1.7;color:#4a6080'>")}</p></div>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- NARRATIVES -->
<div id="narratives" class="tab-content"><div class="page">
  <div class="section-title">Key Narratives &amp; Themes</div>
  <table><thead><tr><th>Theme</th><th>Framing</th><th>Frequency</th><th>Description</th></tr></thead><tbody>
  ${analysis.key_narratives.map(n=>`<tr><td style="font-weight:700">${n.theme}</td><td><span class="badge" style="background:${n.framing==="Crisis"?"#fdecea":n.framing==="Political"?"#ede9fe":n.framing==="Positive"?"#e6f4ea":"#fff8e1"};color:${n.framing==="Crisis"?"#991b1b":n.framing==="Political"?"#3730a3":n.framing==="Positive"?"#166534":"#854d0e"}">${n.framing}</span></td><td><span class="badge" style="background:${n.frequency==="High"?"rgba(203,51,59,.1)":n.frequency==="Medium"?"rgba(245,158,11,.1)":"rgba(122,146,168,.1)"};color:${n.frequency==="High"?"#cb333b":n.frequency==="Medium"?"#b45309":"#7a92a8"}">${n.frequency}</span></td><td style="color:#4a6080">${n.description}</td></tr>`).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- ACTORS -->
<div id="actors" class="tab-content"><div class="page">
  <div class="section-title">Influential Actors &amp; Media Sources</div>
  <table><thead><tr><th>Name</th><th>Type</th><th>Reach</th><th>Stance</th></tr></thead><tbody>
  ${analysis.influential_actors.map(a=>`<tr><td style="font-weight:700">${a.name}</td><td><span class="badge" style="background:rgba(0,48,87,.08);color:#003057">${a.type}</span></td><td><span class="badge" style="background:${a.reach==="High"?"rgba(203,51,59,.1)":a.reach==="Medium"?"rgba(245,158,11,.1)":"rgba(122,146,168,.1)"};color:${a.reach==="High"?"#cb333b":a.reach==="Medium"?"#b45309":"#7a92a8"}">${a.reach}</span></td><td><span class="badge" style="background:${a.stance==="Supportive"?"#e6f4ea":a.stance==="Critical"?"#fdecea":"#fff8e1"};color:${a.stance==="Supportive"?"#166534":a.stance==="Critical"?"#991b1b":"#854d0e"}">${a.stance}</span></td></tr>`).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- TOPIC LINKS -->
<div id="topics" class="tab-content"><div class="page">
  <div class="section-title">Topic Linkage Map</div>
  <table><thead><tr><th>Related Topic</th><th>Strength</th><th>Connection</th></tr></thead><tbody>
  ${analysis.topic_links.map(t=>`<tr><td style="font-weight:700">${t.topic}</td><td><span class="badge" style="background:${t.strength==="Strong"?"rgba(203,51,59,.1)":t.strength==="Moderate"?"rgba(245,158,11,.1)":"rgba(122,146,168,.1)"};color:${t.strength==="Strong"?"#cb333b":t.strength==="Moderate"?"#b45309":"#7a92a8"}">${t.strength}</span></td><td style="color:#4a6080">${t.description}</td></tr>`).join("")}
  </tbody></table>
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

<!-- STAKEHOLDERS -->
<div id="stakeholders" class="tab-content"><div class="page">
  <div class="section-title">Stakeholder Media Profiles</div>
  ${analysis.stakeholder_profiles.map(sp=>`
  <div class="info-box" style="margin-bottom:14px">
    <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:10px">
      <div><p style="font-weight:700;font-size:14px;color:#003057">${sp.name}</p><p style="font-size:12px;color:#7a92a8">${sp.organization}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="badge" style="background:${sp.mention_volume==="High"?"rgba(203,51,59,.1)":sp.mention_volume==="Medium"?"rgba(245,158,11,.1)":sp.mention_volume==="Low"?"rgba(122,146,168,.1)":"rgba(0,48,87,.05)"};color:${sp.mention_volume==="High"?"#cb333b":sp.mention_volume==="Medium"?"#b45309":"#7a92a8"}">${sp.mention_volume} mentions</span>
        <span class="badge" style="background:${sp.sentiment==="Positive"?"#e6f4ea":sp.sentiment==="Negative"?"#fdecea":"#fff8e1"};color:${sp.sentiment==="Positive"?"#166534":sp.sentiment==="Negative"?"#991b1b":"#854d0e"}">${sp.sentiment}</span>
      </div>
    </div>
    <p style="font-size:12px;color:#4a6080;margin-bottom:8px"><strong>Platforms:</strong> ${sp.platforms.join(", ")}</p>
    <p style="font-size:12px;color:#4a6080;margin-bottom:8px"><strong>Notable coverage:</strong> ${sp.notable_coverage}</p>
    <p style="font-size:12px;color:#4a6080"><strong>Key narratives:</strong> ${sp.key_narratives.join(" Â· ")}</p>
  </div>`).join("")}
  <div class="footer"><span>Beyond Group Consulting</span><span>${now}</span></div>
</div></div>

</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `BeyondGroup_SocialAnalysis_${safe(analysis.sector)}_${safe(analysis.region)}_${analysis.generated_date}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div className="flex flex-col gap-2">
      {[
        { label: "Positive", value: positive, color: T.green, bg: T.greenBg },
        { label: "Neutral",  value: neutral,  color: T.yellow, bg: T.yellowBg },
        { label: "Negative", value: negative, color: T.red,    bg: T.redBg },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs font-semibold w-16 shrink-0" style={{ color }}>{label}</span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: "8px", background: T.border }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
          </div>
          <span className="text-xs font-bold w-10 text-right" style={{ color }}>{value}%</span>
        </div>
      ))}
    </div>
  );
}

function VolumeDots({ trend }: { trend: SocialAnalysisResult["volume_trend"] }) {
  const maxH = 60;
  const heights: Record<string, number> = { High: maxH, Medium: maxH * 0.6, Low: maxH * 0.3 };
  return (
    <div className="flex items-end gap-2 h-16">
      {trend.map((t, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t transition-all duration-500" style={{ height: `${heights[t.volume] ?? 20}px`, background: volumeColor(t.volume), opacity: 0.85 }} title={t.note} />
          <span className="text-[9px] text-center leading-tight" style={{ color: T.navyLight }}>{t.period.replace(" ago", "").replace("Month ", "M")}</span>
        </div>
      ))}
    </div>
  );
}

function StakeholderCard({ profile, onBack }: { profile: StakeholderMediaProfile; onBack: () => void }) {
  const sc = sentimentColor(profile.sentiment);
  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase hover:opacity-70 self-start" style={{ color: T.navyLight }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to all stakeholders
      </button>
      <div className="rounded p-5" style={{ background: T.cardBg, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base" style={{ color: T.navy }}>{profile.name}</h3>
            <p className="text-sm mt-0.5" style={{ color: T.navyMid }}>{profile.organization}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span className="px-2.5 py-1 rounded text-xs font-bold" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{profile.sentiment}</span>
            <span className="px-2.5 py-1 rounded text-xs font-bold" style={{ background: T.crimsonBg, color: T.crimson, border: `1px solid ${T.crimsonBorder}` }}>{profile.mention_volume} Volume</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: T.crimson }}>Active Platforms</p>
            <div className="flex flex-wrap gap-1.5">{profile.platforms.map(p => <span key={p} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: T.indigoBg, color: T.indigo, border: `1px solid ${T.indigoBorder}` }}>{p}</span>)}</div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}` }} />
          <div><p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: T.crimson }}>Key Narratives</p>
            <ul className="flex flex-col gap-1">{profile.key_narratives.map((n, i) => <li key={i} className="flex gap-2 text-sm" style={{ color: T.navyMid }}><span style={{ color: T.crimson }}>{"\u2022"}</span>{n}</li>)}</ul>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}` }} />
          <div><p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: T.navyLight }}>Notable Coverage</p>
            <p className="text-sm" style={{ color: T.navyMid }}>{profile.notable_coverage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  analysis: SocialAnalysisResult;
  onClose: () => void;
}

export default function SocialAnalysisModal({ analysis, onClose }: Props) {
  const [view, setView] = useState<"topic" | "stakeholders">("topic");
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderMediaProfile | null>(null);
  const [topicTab, setTopicTab] = useState<"overview" | "narratives" | "actors" | "topics">("overview");

  const sc = analysis.sentiment_breakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,48,87,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded overflow-hidden" style={{ background: T.pageBg, boxShadow: "0 24px 80px rgba(0,48,87,0.3)" }} onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ background: T.navy }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Social Media &amp; Media Intelligence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: analysis.data_source === "live" ? T.greenBg : T.yellowBg, color: analysis.data_source === "live" ? T.green : T.yellow }}>
                {analysis.data_source === "live" ? "Live Data" : "AI Simulation"}
              </span>
            </div>
            <h2 className="text-lg font-bold" style={{ color: T.white }}>{analysis.sector} Â· {analysis.region}</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{analysis.time_window} Â· Generated {analysis.generated_date}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportReport(analysis)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase hover:opacity-80" style={{ background: T.crimson, color: T.white, borderRadius: "3px" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              Export
            </button>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.6)" }} className="hover:text-white ml-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex shrink-0" style={{ background: T.navy, borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0" }}>
          {[{ id: "topic", label: "Topic Analysis" }, { id: "stakeholders", label: `Stakeholder Profiles (${analysis.stakeholder_profiles.length})` }].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id as "topic" | "stakeholders"); setSelectedStakeholder(null); }} className="px-6 py-3 text-xs font-bold tracking-wider uppercase transition-all" style={{ color: view === tab.id ? T.white : "rgba(255,255,255,0.5)", borderBottom: view === tab.id ? `2px solid ${T.crimson}` : "2px solid transparent", background: "transparent" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* â”€â”€ TOPIC VIEW â”€â”€ */}
          {view === "topic" && (
            <div className="flex flex-col gap-6">

              {/* Topic sub-tabs */}
              <div className="flex gap-1 flex-wrap">
                {[{ id: "overview", label: "Overview" }, { id: "narratives", label: "Narratives" }, { id: "actors", label: "Actors" }, { id: "topics", label: "Topic Links" }].map(tab => (
                  <button key={tab.id} onClick={() => setTopicTab(tab.id as typeof topicTab)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase rounded transition-all" style={{ background: topicTab === tab.id ? T.crimson : T.white, color: topicTab === tab.id ? T.white : T.navyMid, border: `1px solid ${topicTab === tab.id ? T.crimson : T.border}` }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW */}
              {topicTab === "overview" && (
                <div className="flex flex-col gap-5">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded p-4 text-center" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                      <p className="text-2xl font-bold" style={{ color: T.navy }}>{analysis.total_estimated_mentions.toLocaleString()}</p>
                      <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: T.navyLight }}>Est. Mentions</p>
                    </div>
                    <div className="rounded p-4 text-center" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
                      <p className="text-2xl font-bold" style={{ color: T.green }}>{sc.positive}%</p>
                      <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: T.green }}>Positive</p>
                    </div>
                    <div className="rounded p-4 text-center" style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}>
                      <p className="text-2xl font-bold" style={{ color: T.red }}>{sc.negative}%</p>
                      <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: T.red }}>Negative</p>
                    </div>
                  </div>

                  {/* Sentiment bars + volume trend */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded p-4" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.crimson }}>Sentiment</p>
                      <SentimentBar positive={sc.positive} neutral={sc.neutral} negative={sc.negative} />
                    </div>
                    <div className="rounded p-4" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.crimson }}>Volume Trend</p>
                      <VolumeDots trend={analysis.volume_trend} />
                    </div>
                  </div>

                  {/* Platform breakdown */}
                  <div className="rounded p-4" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.crimson }}>Platform Breakdown</p>
                    <div className="flex flex-col gap-2">
                      {analysis.platform_breakdown.map(p => {
                        const sc2 = sentimentColor(p.sentiment);
                        return (
                          <div key={p.platform} className="flex items-center gap-3">
                            <span className="text-xs font-semibold w-28 shrink-0" style={{ color: T.navy }}>{p.platform}</span>
                            <div className="flex-1 rounded-full overflow-hidden" style={{ height: "8px", background: T.border }}>
                              <div className="h-full rounded-full" style={{ width: `${p.share_pct}%`, background: T.navy }} />
                            </div>
                            <span className="text-xs font-bold w-10 text-right" style={{ color: T.navy }}>{p.share_pct}%</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold w-16 text-center" style={{ background: sc2.bg, color: sc2.text, border: `1px solid ${sc2.border}` }}>{p.sentiment}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded p-4" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.crimson }}>Executive Summary</p>
                    <p className="text-sm leading-relaxed" style={{ color: T.navyMid }}>{analysis.overall_summary}</p>
                  </div>

                  {/* Risks & opportunities */}
                  {(analysis.risk_signals.length > 0 || analysis.opportunities.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                      {analysis.risk_signals.length > 0 && (
                        <div className="rounded p-4" style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.red }}>Risk Signals</p>
                          <ul className="flex flex-col gap-1.5">{analysis.risk_signals.map((r, i) => <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: T.navyMid }}><span style={{ color: T.red }}>{"\u2022"}</span>{r}</li>)}</ul>
                        </div>
                      )}
                      {analysis.opportunities.length > 0 && (
                        <div className="rounded p-4" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.green }}>Opportunities</p>
                          <ul className="flex flex-col gap-1.5">{analysis.opportunities.map((o, i) => <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: T.navyMid }}><span style={{ color: T.green }}>{"\u2022"}</span>{o}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* NARRATIVES */}
              {topicTab === "narratives" && (
                <div className="flex flex-col gap-3">
                  {analysis.key_narratives.map((n, i) => {
                    const fc = framingColor(n.framing);
                    return (
                      <div key={i} className="rounded p-4" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h4 className="font-bold text-sm" style={{ color: T.navy }}>{n.theme}</h4>
                          <div className="flex gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: fc.bg, color: fc.text }}>{n.framing}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: n.frequency === "High" ? T.crimsonBg : n.frequency === "Medium" ? T.yellowBg : T.cardBg, color: n.frequency === "High" ? T.crimson : n.frequency === "Medium" ? T.yellow : T.navyLight }}>{n.frequency}</span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: T.navyMid }}>{n.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ACTORS */}
              {topicTab === "actors" && (
                <div className="flex flex-col gap-2">
                  {analysis.influential_actors.map((a, i) => {
                    const stanceC = a.stance === "Supportive" ? { bg: T.greenBg, text: T.green } : a.stance === "Critical" ? { bg: T.redBg, text: T.red } : { bg: T.yellowBg, text: T.yellow };
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: T.navy }}>{a.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: T.navyLight }}>{a.type}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: a.reach === "High" ? T.crimsonBg : a.reach === "Medium" ? T.yellowBg : T.cardBg, color: a.reach === "High" ? T.crimson : a.reach === "Medium" ? T.yellow : T.navyLight }}>{a.reach} reach</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: stanceC.bg, color: stanceC.text }}>{a.stance}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TOPIC LINKS */}
              {topicTab === "topics" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded p-4 text-sm" style={{ background: T.indigoBg, border: `1px solid ${T.indigoBorder}`, color: T.indigo }}>
                    Topics connected to <strong>{analysis.sector}</strong> in the public discourse in <strong>{analysis.region}</strong>:
                  </div>
                  {analysis.topic_links.map((t, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded" style={{ background: T.white, border: `1px solid ${T.border}` }}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-3 h-3 rounded-full" style={{ background: strengthColor(t.strength) }} />
                        <span className="text-[10px] font-bold" style={{ color: strengthColor(t.strength) }}>{t.strength}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: T.navy }}>{t.topic}</p>
                        <p className="text-sm mt-0.5" style={{ color: T.navyMid }}>{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ STAKEHOLDERS VIEW â”€â”€ */}
          {view === "stakeholders" && (
            selectedStakeholder
              ? <StakeholderCard profile={selectedStakeholder} onBack={() => setSelectedStakeholder(null)} />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.stakeholder_profiles.map((sp, i) => {
                    const sc2 = sentimentColor(sp.sentiment);
                    return (
                      <button key={i} onClick={() => setSelectedStakeholder(sp)} className="text-left rounded p-4 transition-all hover:shadow-md" style={{ background: T.white, border: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = T.crimsonBorder)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-sm" style={{ color: T.navy }}>{sp.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: T.navyLight }}>{sp.organization}</p>
                          </div>
                          <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: sc2.bg, color: sc2.text, border: `1px solid ${sc2.border}` }}>{sp.sentiment}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: sp.mention_volume === "High" ? T.crimsonBg : T.cardBg, color: sp.mention_volume === "High" ? T.crimson : T.navyLight }}>{sp.mention_volume}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {sp.platforms.map(p => <span key={p} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: T.indigoBg, color: T.indigo }}>{p}</span>)}
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: T.navyMid }}>{sp.notable_coverage}</p>
                        <div className="flex items-center gap-1 mt-2" style={{ color: T.navyLight }}>
                          <span className="text-xs">View profile</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

