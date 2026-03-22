import type { Stakeholder } from "../api/discover/route";

const RENEWABLE_ENERGY_LEBANON: Stakeholder[] = [
  {
    name: "Minister of Energy and Water, Republic of Lebanon",
    organization: "Ministry of Energy and Water (MoEW)",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 9,
    stance: "neutral",
    key_positions: [
      "Controls national grid policy and renewable energy licensing framework, with authority over all utility-scale project approvals",
      "Has signalled conditional support for solar subsidies but is constrained by IMF fiscal consolidation requirements and EDL debt",
      "Oversees Électricité du Liban restructuring plan, which is a prerequisite for bankable grid-connection agreements",
    ],
    engagement_recommendation:
      "Request a ministerial-level briefing to align project milestones with MoEW's 2026 sector reform roadmap; frame the project as supporting EDL transition, not bypassing it.",
    sources: [],
  },
  {
    name: "Director General, Lebanese Center for Energy Conservation (LCEC)",
    organization: "Lebanese Center for Energy Conservation (LCEC)",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 7,
    stance: "supportive",
    key_positions: [
      "Implements Lebanon's UNDP-backed net-metering programme for rooftop solar, covering over 6,000 registered installations",
      "Authored Lebanon's National Renewable Energy Action Plan (NREAP) targeting 30% renewables by 2030",
      "Coordinates EU-funded capacity building for municipal energy managers across 30+ Lebanese municipalities",
    ],
    engagement_recommendation:
      "Co-develop technical annexes and feasibility documentation with LCEC to leverage their regulatory credibility with international donors and the World Bank.",
    sources: [],
  },
  {
    name: "Layla Saab",
    organization: "Natural Resource Governance Institute (NRGI) — MENA",
    current_officeholder: "Layla Saab",
    type: "ngo",
    influence_score: 6,
    stance: "opposed",
    key_positions: [
      "Publicly critiques opaque procurement processes in energy concessions, with published reports on Lebanon's offshore gas licensing",
      "Advocates for mandatory community benefit-sharing clauses in all renewable energy project agreements",
      "Has flagged governance gaps in Lebanon's energy sector that she argues make large-scale private investment premature",
    ],
    engagement_recommendation:
      "Engage proactively before project launch with full transparency commitments, a published stakeholder consultation log, and a community impact framework to pre-empt public criticism.",
    sources: [],
  },
  {
    name: "Georges Riachi",
    organization: "Federation of Lebanese Chambers of Commerce, Industry & Agriculture",
    current_officeholder: "Georges Riachi",
    type: "private",
    influence_score: 8,
    stance: "supportive",
    key_positions: [
      "Champions private-sector-led energy solutions as the primary mechanism to break the state monopoly strangling Lebanese businesses",
      "Represents generator industry interests transitioning toward solar hybrid systems, creating commercial alignment with project objectives",
      "Has publicly endorsed the World Bank's Emergency Social and Economic Support project energy reform package",
    ],
    engagement_recommendation:
      "Frame engagement around business competitiveness, FDI attraction, and energy cost reduction to secure a private-sector coalition that can lobby MoEW alongside the project team.",
    sources: [],
  },
  {
    name: "Head of Infrastructure & Energy Unit, EU Delegation to Lebanon",
    organization: "EU Delegation to Lebanon — Infrastructure & Energy Unit",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 8,
    stance: "supportive",
    key_positions: [
      "Manages a €200M EU energy envelope for Lebanon, including grid rehabilitation and renewable energy integration grants",
      "Conditions EU funding on regulatory transparency, anti-corruption compliance, and procurement aligned with EU standards",
      "Coordinates with EBRD on grid modernisation co-financing and is actively seeking bankable project pipelines",
    ],
    engagement_recommendation:
      "Present the project as aligned with EU Green Deal neighbourhood objectives and request a co-financing structured dialogue; prepare an EU-standard environmental and social impact assessment in advance.",
    sources: [],
  },
  {
    name: "Marc Toufic",
    organization: "Terrain Solar (Private Developer)",
    current_officeholder: "Marc Toufic",
    type: "private",
    influence_score: 6,
    stance: "supportive",
    key_positions: [
      "Operates a 15MW portfolio of commercial and industrial solar installations across Mount Lebanon and the Bekaa",
      "Facing critical grid-connection bottlenecks due to EDL technical incapacity, creating shared advocacy interests",
      "Actively lobbying MoEW and parliament for wheeling rights reform that would allow private power purchase agreements",
    ],
    engagement_recommendation:
      "Include in the project's technical advisory structure to leverage operational ground-truth knowledge and existing municipal permitting relationships across key governorates.",
    sources: [],
  },
  {
    name: "Nour Khalil",
    organization: "L'Orient Today — Environment & Energy Desk",
    current_officeholder: "Nour Khalil",
    type: "media",
    influence_score: 5,
    stance: "neutral",
    key_positions: [
      "Covers Lebanon's generator sector and energy subsidy reform with a critical lens, reaching 200,000+ English-language readers",
      "Has published investigative pieces on delays and cost overruns in World Bank-funded EDL rehabilitation contracts",
      "Actively seeks access to technical project documentation and financial models for fact-based reporting",
    ],
    engagement_recommendation:
      "Offer structured quarterly press briefings and access to non-proprietary project data to shape accurate coverage and build a working relationship before any adverse reporting emerges.",
    sources: [],
  },
  {
    name: "Dr. Riad Chedid",
    organization: "American University of Beirut — Faculty of Engineering & Architecture",
    current_officeholder: "Dr. Riad Chedid",
    type: "academic",
    influence_score: 6,
    stance: "supportive",
    key_positions: [
      "Published peer-reviewed modelling demonstrating Lebanon's technical potential for 30% renewable penetration by 2030 under reformed grid conditions",
      "Serves as technical advisor to LCEC on grid integration studies and to the UN-Habitat urban energy resilience panel",
      "Co-authors WHO and UNDP reports on the health and economic co-benefits of renewable energy adoption in post-conflict contexts",
    ],
    engagement_recommendation:
      "Commission a third-party technical validation study through AUB to build credibility with the donor community, international lenders, and Lebanese regulatory bodies simultaneously.",
    sources: [],
  },
];

const PUBLIC_HEALTH_LEBANON: Stakeholder[] = [
  {
    name: "Minister of Public Health, Republic of Lebanon",
    organization: "Ministry of Public Health (MoPH)",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 9,
    stance: "supportive",
    key_positions: [
      "Leads national hospital accreditation reform and pharmaceutical regulation modernisation following the 2019 financial collapse",
      "Has prioritised the rehabilitation of the primary healthcare network, which lost over 40% of its staff to emigration since 2019",
      "Coordinates with WHO and UNICEF on communicable disease surveillance and the National Immunisation Programme recovery plan",
    ],
    engagement_recommendation:
      "Propose embedding a joint technical working group within MoPH to align deliverables with the National Health Strategy 2021–2025 and secure ministerial co-ownership of project outcomes.",
    sources: [],
  },
  {
    name: "Dr. Alexandra Hamdan",
    organization: "World Health Organization — Lebanon Country Office",
    current_officeholder: "Dr. Alexandra Hamdan",
    type: "ngo",
    influence_score: 8,
    stance: "supportive",
    key_positions: [
      "Manages a $45M WHO emergency health response portfolio across 26 primary healthcare centres and 6 district hospitals",
      "Leads donor harmonisation across 12 UN health-sector partners through the Health Cluster coordination mechanism",
      "Advocates for transitioning Lebanon from emergency humanitarian health response toward a resilient, publicly financed system",
    ],
    engagement_recommendation:
      "Position the project within the Health Cluster framework from day one to access coordinated funding streams, avoid duplication with existing WHO programming, and benefit from WHO's MoPH relationship.",
    sources: [],
  },
  {
    name: "Dr. Ramzi Haddad",
    organization: "Lebanese Medical Association (LMA)",
    current_officeholder: "Dr. Ramzi Haddad",
    type: "academic",
    influence_score: 7,
    stance: "neutral",
    key_positions: [
      "Represents over 5,000 licensed physicians on national health policy, professional standards, and social protection advocacy",
      "Opposes models that commodify healthcare without building social protection floors, citing post-collapse fee-for-service failures",
      "Has resisted parallel NGO health systems that, in his view, undermine public institutions and accelerate physician migration",
    ],
    engagement_recommendation:
      "Engage LMA in the project's clinical governance board as a legitimacy anchor; offer to integrate continuing medical education credits into project training programmes to align with physician professional interests.",
    sources: [],
  },
  {
    name: "Hana Sleiman",
    organization: "ALEF — Act for Human Rights",
    current_officeholder: "Hana Sleiman",
    type: "ngo",
    influence_score: 6,
    stance: "opposed",
    key_positions: [
      "Documents healthcare access barriers for displaced Syrian and Palestinian populations and stateless persons in Lebanon",
      "Critically monitors fee-for-service models imposed under economic reform conditionalities, which she argues exclude the poorest quintile",
      "Tracks mental health service collapse in public hospitals and advocates for emergency psychological support funding",
    ],
    engagement_recommendation:
      "Commission an independent social impact assessment prior to launch and formally invite ALEF to participate in the project's civil society review panel to demonstrate accountability to marginalised groups.",
    sources: [],
  },
  {
    name: "Rania Farhat",
    organization: "Hariri Foundation for Sustainable Human Development",
    current_officeholder: "Rania Farhat",
    type: "private",
    influence_score: 7,
    stance: "supportive",
    key_positions: [
      "Funds community health worker training across 220 Lebanese municipalities, with established networks in Tripoli and Bekaa",
      "Champions a public-private partnership model for clinic rehabilitation, with a track record of USAID and Gulf development fund co-financing",
      "Has relationships with Saudi and Emirati development funds that could be mobilised for complementary project financing",
    ],
    engagement_recommendation:
      "Explore a co-funding arrangement that leverages the Foundation's existing municipal networks and donor trust relationships; propose joint branding of community health worker outputs.",
    sources: [],
  },
  {
    name: "Dr. Jad Mahfouz",
    organization: "American University of Beirut Medical Center (AUBMC)",
    current_officeholder: "Dr. Jad Mahfouz",
    type: "academic",
    influence_score: 8,
    stance: "neutral",
    key_positions: [
      "Leads health systems research with WHO co-authorship, focusing on Lebanon's physician emigration crisis and hospital financing",
      "Cautions against project designs that fragment the referral pyramid, citing evidence from post-2006 reconstruction missteps",
      "Advises international donors on evidence-based programme design and has significant influence over how funding is perceived by the medical community",
    ],
    engagement_recommendation:
      "Retain as an independent technical advisor with a mandate to publish peer-reviewed outcome data; this simultaneously builds project credibility and addresses the academic community's scepticism about externally-driven health interventions.",
    sources: [],
  },
  {
    name: "Nada Andraos",
    organization: "An-Nahar — Health & Society",
    current_officeholder: "Nada Andraos",
    type: "media",
    influence_score: 5,
    stance: "neutral",
    key_positions: [
      "Covers pharmaceutical shortages and hospital closures with nationwide Arabic-language reach, influencing public trust in health interventions",
      "Has reported extensively on NSSF (National Social Security Fund) reform debates and their impact on out-of-pocket healthcare costs",
      "Monitors and amplifies civil society criticism of donor-driven health projects perceived as bypassing state institutions",
    ],
    engagement_recommendation:
      "Develop a media partnership agreement offering structured access to project milestones and patient impact stories in exchange for factual, evidence-based coverage that counters misinformation.",
    sources: [],
  },
  {
    name: "Michel Mawad",
    organization: "Amel Association International",
    current_officeholder: "Michel Mawad",
    type: "ngo",
    influence_score: 7,
    stance: "supportive",
    key_positions: [
      "Operates 32 primary healthcare centres serving over 400,000 beneficiaries annually across 25 Lebanese districts",
      "Built cross-sectarian trust in underserved communities over 40+ years, making Amel a uniquely credible implementation partner",
      "Coordinates with UNHCR and IOM on refugee and migrant health service integration within Lebanon's primary care system",
    ],
    engagement_recommendation:
      "Partner on service delivery implementation through Amel's clinic network to accelerate community reach and bypass bureaucratic delays; Amel's established trust with beneficiaries is a key project risk mitigant.",
    sources: [],
  },
];

const MANAGEMENT_CONSULTING_GCC: Stakeholder[] = [
  {
    name: "Governor, Public Investment Fund (PIF)",
    organization: "Public Investment Fund (PIF) — Kingdom of Saudi Arabia",
    current_officeholder: "Yasir Al-Rumayyan",
    type: "government",
    influence_score: 10,
    stance: "supportive",
    key_positions: [
      "Directs a $700B+ sovereign wealth fund with the largest consulting vendor spend in the GCC, encompassing strategy, transformation, and programme management mandates",
      "Champions Vision 2030 giga-project delivery that inherently requires global management expertise and creates continuous consulting demand",
      "Has consolidated strategic consulting procurement under PIF's Programme Management Office, requiring approved vendor panel registration",
    ],
    engagement_recommendation:
      "Secure an introductory meeting through mutual investment banking relationships; position the firm as a Vision 2030 delivery partner rather than an advisory vendor, and lead with giga-project operational track record.",
    sources: [],
  },
  {
    name: "Khaldoon Al Mubarak",
    organization: "Mubadala Investment Company — Abu Dhabi",
    current_officeholder: "Khaldoon Al Mubarak",
    type: "private",
    influence_score: 9,
    stance: "supportive",
    key_positions: [
      "Oversees an AED 1T+ investment portfolio requiring ongoing organisational transformation, post-merger integration, and operating model redesign support",
      "Prefers long-term embedded advisory partnerships over transactional project mandates, with multi-year framework agreements as the standard engagement model",
      "Selects consulting partners through personal CEO-level referral networks rather than open RFP processes for sensitive transformation mandates",
    ],
    engagement_recommendation:
      "Position the firm as a strategic partner with demonstrated specialisation in energy transition and sovereign wealth fund transformation; engage through Abu Dhabi Global Market (ADGM) relationship channels and request a CEO-level introductory meeting.",
    sources: [],
  },
  {
    name: "President, Saudi Industrial Development Fund (SIDF)",
    organization: "Saudi Industrial Development Fund (SIDF)",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 7,
    stance: "neutral",
    key_positions: [
      "Drives localisation (Saudisation) requirements that directly affect consulting firm staffing models and in-Kingdom delivery ratios",
      "Monitors compliance with Vision 2030 human capital development targets and has authority to restrict non-compliant vendors from public sector mandates",
      "Increasingly requires formal knowledge transfer and national talent development commitments as contract conditions for foreign advisory firms",
    ],
    engagement_recommendation:
      "Develop a comprehensive Saudi national talent development plan — including graduate hiring targets, secondment programmes, and a Knowledge Transfer Annex — as a standard component of every proposal submitted for public sector work.",
    sources: [],
  },
  {
    name: "Director General, Sharjah Investment and Development Authority (Shurooq)",
    organization: "Sharjah Investment and Development Authority (Shurooq)",
    current_officeholder: "To be verified",
    type: "government",
    influence_score: 7,
    stance: "supportive",
    key_positions: [
      "Champions knowledge economy, creative industries, and cultural tourism as high-growth consulting markets in the UAE's Northern Emirates",
      "Active in WEF, G20 and international policy forums, creating visibility opportunities for firms with aligned thought leadership",
      "Advocates publicly for women's leadership in GCC business transformation, creating reputational alignment opportunities for firms with visible female leadership",
    ],
    engagement_recommendation:
      "Align the firm's ESG and diversity credentials with Shurooq's mandate; propose a joint thought leadership publication on knowledge economy strategy to establish regional presence and access Shurooq's investor network.",
    sources: [],
  },
  {
    name: "Chief Executive, Saudi Tourism Authority (STA)",
    organization: "Saudi Tourism Authority (STA)",
    current_officeholder: "Fahd Hamidaddin",
    type: "government",
    influence_score: 8,
    stance: "supportive",
    key_positions: [
      "Oversees an $800B+ tourism giga-project pipeline — including NEOM, Red Sea, Diriyah, and Qiddiya — creating sustained demand for strategy, operations design, and change management expertise",
      "Operating under aggressive Vision 2030 delivery timelines that create continuous demand for high-capacity consulting teams with rapid mobilisation capability",
      "Preferences firms with demonstrated hospitality sector benchmarking and international tourism master-planning capabilities",
    ],
    engagement_recommendation:
      "Lead with case studies adjacent to NEOM-scale destination development; propose a rapid-mobilisation team structure with a named senior partner dedicated to STA account leadership to demonstrate delivery seriousness.",
    sources: [],
  },
  {
    name: "Fatima Al-Jaber",
    organization: "Al Jaber Group — United Arab Emirates",
    current_officeholder: "Fatima Al-Jaber",
    type: "private",
    influence_score: 7,
    stance: "neutral",
    key_positions: [
      "Leads a diversified family conglomerate undergoing second-generation governance professionalisation, creating demand for board advisory and family office restructuring expertise",
      "Sceptical of consulting value extraction without substantive knowledge transfer, citing past experiences with deliverable-heavy but impact-light engagements",
      "Influential in Abu Dhabi business council networks, with referral authority across multiple family office and conglomerate relationships",
    ],
    engagement_recommendation:
      "Propose a fixed-fee diagnostic with transparent methodology documentation and a formal knowledge transfer plan; position the firm's local team depth as evidence that Abu Dhabi presence is substantive, not just a regional sales office.",
    sources: [],
  },
  {
    name: "Dr. Nasser Saidi",
    organization: "Nasser Saidi & Associates",
    current_officeholder: "Dr. Nasser Saidi",
    type: "academic",
    influence_score: 6,
    stance: "neutral",
    key_positions: [
      "Publishes widely-cited analysis on GCC economic diversification, corporate governance reform, and financial sector development",
      "Advises regional central banks and sovereign funds on structural reform, with access to C-suite and ministerial audiences across the GCC",
      "Frequently quoted in regional and international financial press as an independent voice, shaping business leader perceptions of advisory quality",
    ],
    engagement_recommendation:
      "Engage as a senior regional advisor with a named role in the firm's GCC leadership structure; leverage his media relationships to amplify the firm's thought leadership and provide warm introductions to sovereign fund clients.",
    sources: [],
  },
  {
    name: "Eiman Al-Mutawa",
    organization: "Arabian Business — Strategy & Markets Editor",
    current_officeholder: "Eiman Al-Mutawa",
    type: "media",
    influence_score: 5,
    stance: "neutral",
    key_positions: [
      "Covers GCC corporate transformation, C-suite strategy, and consulting firm market dynamics with pan-Gulf digital and print readership",
      "Tracks consulting firm project wins, partner movements, and regional market share — directly influencing client perception of firm standing",
      "Influential in shaping regional business leaders' perceptions of which advisory firms are considered credible regional players versus global firms parachuting in",
    ],
    engagement_recommendation:
      "Offer exclusive data from an original GCC consulting market study or regional benchmark report in exchange for branded feature coverage of the firm's regional practice; establish a standing quarterly briefing relationship.",
    sources: [],
  },
];

export interface DemoScenario {
  sector: string;
  region: string;
  stakeholders: Stakeholder[];
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    sector: "Renewable Energy",
    region: "Lebanon",
    stakeholders: RENEWABLE_ENERGY_LEBANON,
  },
  {
    sector: "Public Health",
    region: "Lebanon",
    stakeholders: PUBLIC_HEALTH_LEBANON,
  },
  {
    sector: "Management Consulting",
    region: "GCC",
    stakeholders: MANAGEMENT_CONSULTING_GCC,
  },
];

/** Returns demo stakeholders if the query matches a preset, otherwise null. */
export function getDemoData(sector: string, region: string): DemoScenario | null {
  const s = sector.toLowerCase().trim();
  const r = region.toLowerCase().trim();

  for (const scenario of DEMO_SCENARIOS) {
    const matchSector = s.includes(scenario.sector.toLowerCase());
    const matchRegion = r.includes(scenario.region.toLowerCase()) ||
      scenario.region.toLowerCase().includes(r);
    if (matchSector && matchRegion) return scenario;
  }
  return null;
}

export const DEMO_HINTS = DEMO_SCENARIOS.map(
  (s) => `${s.sector} (${s.region})`
).join(", ");
