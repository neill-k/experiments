import type { SpecInput } from "./spec";

export type Preset = {
  id: string;
  label: string;
  description: string;
  data: SpecInput;
};

const budgetDefaults = {
  p95Latency: "",
  maxCostPerDay: "",
  maxRetries: "",
  degradeTo: "",
};

export const presets: Preset[] = [
  {
    id: "support-triage",
    label: "Support Triage Agent",
    description:
      "Triage, draft replies, and route inbound tickets with human approval.",
    data: {
      appName: "Support Triage Agent Spec",
      objective:
        "Reduce time-to-first-response by auto-triaging inbound tickets, suggesting replies, and routing to the right queue with human approval.",
      primaryUsers: "Support reps, support lead, on-call engineer",
      context:
        "Inbound tickets arrive via Zendesk. The agent reads the ticket + customer history, classifies severity, suggests a draft response, and routes/escalates based on policy.",
      tools: [
        "Zendesk: read ticket",
        "Zendesk: add internal note",
        "Zendesk: update ticket fields (requires approval)",
        "Knowledge base search",
        "PagerDuty: create incident (requires approval)",
      ].join("\n"),
      dataSources: [
        "Zendesk tickets",
        "Customer CRM (read-only)",
        "Product/ops knowledge base",
        "Incident runbooks",
      ].join("\n"),
      constraints: [
        "No automated external responses without explicit human approval",
        "Respect PII handling policies",
      ].join("\n"),
      p95Latency: "<= 10s",
      maxCostPerDay: "<= $50/day",
      maxRetries: "2",
      degradeTo: "Human handoff + safe draft response",
      successMetrics: [
        "Time-to-first-response reduced by 30%",
        "Correct routing accuracy >= 90%",
        "Escalation precision (avoid false pages)",
      ].join("\n"),
      nonGoals: ["Fully autonomous ticket closure", "Training custom models"].join(
        "\n"
      ),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Misclassification causing missed SLAs",
        "Over-escalation to on-call",
        "PII leakage in logs",
      ].join("\n"),
    },
  },
  {
    id: "sales-rfp",
    label: "RFP / Security Questionnaire Agent",
    description: "Draft questionnaire answers with citations from approved sources.",
    data: {
      appName: "RFP Agent Spec",
      objective:
        "Speed up completion of RFPs/security questionnaires by extracting relevant answers from approved sources and generating drafts for review.",
      primaryUsers: "Sales engineer, security/compliance, legal",
      context:
        "Prospects send documents with long lists of questions. The agent searches approved sources (SOC2, policies, product docs) and drafts answers with citations.",
      tools: [
        "Document upload + text extraction",
        "Search in approved policy docs",
        "Citation formatter",
        "Export answers to CSV/Doc",
      ].join("\n"),
      dataSources: [
        "Security policies",
        "SOC2 report (restricted)",
        "Product documentation",
        "Prior approved questionnaires",
      ].join("\n"),
      constraints: [
        "Only use approved sources; no guessing",
        "Citations required for each answer",
        "Access control: SOC2 restricted",
      ].join("\n"),
      ...budgetDefaults,
      successMetrics: [
        "Draft completion time reduced by 50%",
        "Fewer back-and-forth clarifications",
      ].join("\n"),
      nonGoals: [
        "Sending answers directly to customers",
        "Editing source-of-truth documents",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Hallucinated claims without citations",
        "Accidental disclosure of restricted content",
      ].join("\n"),
    },
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes + Action Items Agent",
    description:
      "Turn transcripts into crisp notes, decisions, and follow-ups (with guardrails).",
    data: {
      appName: "Meeting Notes Agent Spec",
      objective:
        "Convert meeting transcripts into a clean summary (decisions, risks, open questions) and a prioritized action list with owners, due dates, and source quotes.",
      primaryUsers: "Team leads, PMs, ICs, exec assistants",
      context:
        "After each meeting, a transcript is available (Zoom/Meet). The agent produces notes and proposed tasks; humans review before anything is posted to shared systems.",
      tools: [
        "Transcript ingestion",
        "Task system: create task (requires approval)",
        "Calendar: propose follow-ups (requires approval)",
        "Slack/Email: send recap (requires approval)",
      ].join("\n"),
      dataSources: [
        "Meeting transcript",
        "Prior meeting notes (read-only)",
        "Project docs and milestones",
      ].join("\n"),
      constraints: [
        "No external sends without explicit approval",
        "Include 2–5 direct quotes as anchors for key decisions",
        "Respect confidentiality markers in the transcript",
      ].join("\n"),
      ...budgetDefaults,
      successMetrics: [
        "Notes published within 10 minutes",
        "Action item capture rate >= 90%",
        "Low rework: < 10% of tasks need correction",
      ].join("\n"),
      nonGoals: [
        "Making binding decisions",
        "Auto-scheduling people without consent",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Misattributing action items",
        "Leaking sensitive content",
        "Over-confident summaries (missing uncertainty)",
      ].join("\n"),
    },
  },
  {
    id: "itsm-routing",
    label: "ITSM Ticket Routing Agent",
    description:
      "Classify and route internal IT requests; suggest fixes; avoid risky automation.",
    data: {
      appName: "ITSM Routing Agent Spec",
      objective:
        "Reduce IT backlog by classifying inbound tickets, suggesting next steps, and routing to the right resolver group with clear rationale and confidence.",
      primaryUsers: "IT service desk, SRE/on-call, employees",
      context:
        "Employees file tickets via ServiceNow/Jira Service Management. The agent reads the ticket, checks known-issues/runbooks, and proposes routing + a draft reply.",
      tools: [
        "ServiceNow/JSM: read ticket",
        "ServiceNow/JSM: update fields (requires approval)",
        "Runbook search",
        "Identity directory lookup (read-only)",
      ].join("\n"),
      dataSources: ["ITSM ticket history", "Runbooks / KB", "Known-issues list"].join(
        "\n"
      ),
      constraints: [
        "Never reset passwords or change access autonomously",
        "Prefer safer suggestions with links to runbooks",
        "Escalate security-sensitive tickets immediately",
      ].join("\n"),
      ...budgetDefaults,
      successMetrics: [
        "Routing accuracy >= 92%",
        "Mean time to assignment reduced by 40%",
      ].join("\n"),
      nonGoals: ["Executing remediation commands", "Changing IAM permissions"].join(
        "\n"
      ),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Incorrect routing causing delays",
        "Sensitive data exposure (credentials, access details)",
      ].join("\n"),
    },
  },
  {
    id: "exec-briefing",
    label: "Executive Briefing Agent",
    description:
      "Weekly top-line business + product briefing with sources and confidence tags.",
    data: {
      appName: "Executive Briefing Agent Spec",
      objective:
        "Produce a weekly briefing: top wins, risks, metrics deltas, and decisions needed — with sources and confidence tags to avoid overclaiming.",
      primaryUsers: "Executives, chiefs of staff, PM leadership",
      context:
        "The agent runs on a schedule, pulling from approved sources (dashboards, incident log, OKRs). It drafts a concise briefing for review.",
      tools: [
        "Metrics dashboard: read",
        "Project tracker: read",
        "Incident log: read",
        "Email/Slack: send briefing (requires approval)",
      ].join("\n"),
      dataSources: ["Weekly KPI dashboard", "OKRs", "Incident reports", "Release notes"].join(
        "\n"
      ),
      constraints: [
        "Cite sources for metrics claims",
        "Tag uncertain statements explicitly",
        "Keep to 1 page / 5 minutes read",
      ].join("\n"),
      ...budgetDefaults,
      successMetrics: [
        "Briefing delivered by Monday 09:00",
        "Exec satisfaction (qualitative)",
        "Fewer status meetings needed",
      ].join("\n"),
      nonGoals: ["Making roadmap commitments", "Publishing externally"].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Stale data leading to wrong decisions",
        "Overconfident narrative without caveats",
      ].join("\n"),
    },
  },
  {
    id: "onboarding-copilot",
    label: "Employee Onboarding Copilot",
    description:
      "Guide new hires through first-week setup, policy reading, and tool provisioning.",
    data: {
      appName: "Employee Onboarding Copilot Spec",
      objective:
        "Reduce new-hire ramp time by 40% through guided setup, automated tool provisioning requests, personalized learning paths, and proactive check-ins during the first 30 days.",
      primaryUsers: "New hires, hiring managers, People Ops",
      context:
        "New employees receive a chat-based copilot on day 1. It walks them through company policies, benefits enrollment, tool access requests, team introductions, and role-specific training — escalating to People Ops when human judgment is needed.",
      tools: [
        "HRIS: read employee profile + department",
        "Identity provisioning: request tool access (requires approval)",
        "Knowledge base: search policies, benefits docs",
        "Calendar: suggest 1:1s with team members (requires approval)",
        "Slack: send welcome message to team channel (requires approval)",
      ].join("\n"),
      dataSources: [
        "HRIS employee records",
        "Company handbook / policy wiki",
        "Benefits enrollment portal",
        "Team org charts",
        "Role-specific training plans",
      ].join("\n"),
      constraints: [
        "Never approve access requests autonomously — always route to manager",
        "Don't share compensation or performance data",
        "Respect regional differences in benefits and compliance",
        "All policy answers must cite the specific handbook section",
      ].join("\n"),
      p95Latency: "<= 5s",
      maxCostPerDay: "<= $20/day",
      maxRetries: "2",
      degradeTo: "Redirect to People Ops Slack channel with context summary",
      successMetrics: [
        "Time to fully provisioned (all tools active) reduced by 40%",
        "New hire satisfaction score >= 4.5/5 at day-30 survey",
        "People Ops tickets from new hires reduced by 50%",
      ].join("\n"),
      nonGoals: [
        "Making hiring or termination decisions",
        "Processing payroll or compensation changes",
        "Replacing People Ops — augmenting them",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Outdated policy docs leading to wrong guidance",
        "Over-provisioning tool access without proper approval chain",
        "Privacy: leaking one employee's data to another",
      ].join("\n"),
    },
  },
  {
    id: "code-review",
    label: "Code Review Assistant",
    description:
      "Automated PR review: flag bugs, security issues, style violations, and suggest improvements.",
    data: {
      appName: "Code Review Assistant Spec",
      objective:
        "Accelerate code review by providing automated first-pass feedback on PRs — catching bugs, security vulnerabilities, style violations, and test gaps before human reviewers spend time.",
      primaryUsers: "Software engineers, tech leads, security team",
      context:
        "Triggered on every PR via GitHub webhook. The agent reads the diff, checks against team style guides and security rules, and posts inline comments. It never approves or merges — only suggests. Human reviewers get a pre-triaged PR with known issues already flagged.",
      tools: [
        "GitHub: read PR diff + file contents",
        "GitHub: post review comments (inline + summary)",
        "Static analysis runner: lint, type-check, SAST",
        "Style guide search: team conventions wiki",
        "Dependency vulnerability scanner (read-only)",
      ].join("\n"),
      dataSources: [
        "PR diff and full file context",
        "Team style guide / ADRs",
        "OWASP top-10 rules",
        "Dependency vulnerability DB (Snyk/OSV)",
        "Historical review comments (for pattern learning)",
      ].join("\n"),
      constraints: [
        "Never approve or merge PRs",
        "Clearly label suggestions vs. blocking issues",
        "Max 10 inline comments per review (avoid noise fatigue)",
        "Security findings always flagged, never suppressed",
        "Don't comment on test files unless logic bugs",
      ].join("\n"),
      p95Latency: "<= 60s per PR",
      maxCostPerDay: "<= $30/day",
      maxRetries: "1",
      degradeTo: "Skip automated review; notify team in Slack",
      successMetrics: [
        "Bugs caught before human review >= 25% of total",
        "Review cycle time reduced by 30%",
        "False positive rate < 15% (comments marked unhelpful)",
      ].join("\n"),
      nonGoals: [
        "Replacing human code review",
        "Auto-fixing code (suggest only)",
        "Reviewing architecture decisions",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Noisy comments causing reviewer fatigue / ignore-all behavior",
        "Missing context on business logic leading to bad suggestions",
        "Security false negatives (missed vulnerabilities)",
      ].join("\n"),
    },
  },
  {
    id: "incident-responder",
    label: "Incident Response Coordinator",
    description:
      "Coordinate incident response: gather signals, draft comms, track timeline, and suggest runbook steps.",
    data: {
      appName: "Incident Response Coordinator Spec",
      objective:
        "Reduce mean-time-to-resolution by 30% by automating incident signal gathering, timeline tracking, communication drafting, and runbook step suggestions — keeping humans in the decision loop for all actions.",
      primaryUsers: "On-call engineers, incident commanders, SRE leads",
      context:
        "When an alert fires (PagerDuty/OpsGenie), the agent creates an incident channel, pulls relevant metrics and logs, suggests runbook steps, drafts status page updates, and maintains a real-time timeline. All destructive actions require human confirmation.",
      tools: [
        "PagerDuty/OpsGenie: read alert details",
        "Slack: create incident channel + post updates (requires approval for external comms)",
        "Metrics dashboard: query Datadog/Grafana (read-only)",
        "Log search: query Splunk/ELK (read-only)",
        "Runbook search: match alert to known runbooks",
        "Status page: draft update (requires approval)",
      ].join("\n"),
      dataSources: [
        "Alert metadata and history",
        "APM metrics and dashboards",
        "Application and infrastructure logs",
        "Runbook library",
        "Previous incident postmortems",
      ].join("\n"),
      constraints: [
        "Never execute remediation commands (suggest only)",
        "External communications (status page, customer emails) always require IC approval",
        "Preserve full audit trail of every action and suggestion",
        "Respect on-call rotation — don't page outside policy",
      ].join("\n"),
      p95Latency: "<= 15s for signal gathering",
      maxCostPerDay: "<= $40/day",
      maxRetries: "3",
      degradeTo: "Manual incident process; post summary of gathered signals to channel",
      successMetrics: [
        "MTTR reduced by 30%",
        "Correct runbook suggested within first 2 minutes >= 80%",
        "Status page update drafted within 5 minutes of declaration",
      ].join("\n"),
      nonGoals: [
        "Autonomous remediation (restart services, rollback deploys)",
        "Replacing the incident commander role",
        "Post-incident review generation (separate agent)",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Alert correlation errors leading to wrong runbook",
        "Metric query failures during outage (cascading failure)",
        "Over-communication: too many Slack messages during high-stress incident",
      ].join("\n"),
    },
  },
  {
    id: "data-pipeline-monitor",
    label: "Data Pipeline Monitor",
    description:
      "Watch ETL/ELT pipelines, detect anomalies, alert on failures, and suggest fixes.",
    data: {
      appName: "Data Pipeline Monitor Spec",
      objective:
        "Proactively detect data pipeline failures, quality anomalies, and SLA breaches — then alert the right team with root-cause hypotheses and suggested remediation steps.",
      primaryUsers: "Data engineers, analytics leads, platform team",
      context:
        "The agent monitors scheduled ETL/ELT jobs (Airflow, dbt, Fivetran). When a job fails or data quality checks flag anomalies, it gathers context (logs, row counts, schema changes), identifies likely root cause, and alerts with actionable next steps.",
      tools: [
        "Airflow/dbt API: read DAG status, task logs",
        "Data warehouse: run quality checks (read-only SQL)",
        "Schema registry: detect schema drift",
        "Slack: post alerts to data-alerts channel",
        "PagerDuty: create incident for SLA breach (requires approval)",
      ].join("\n"),
      dataSources: [
        "Pipeline orchestrator metadata (DAG runs, task status)",
        "Data warehouse tables (row counts, freshness)",
        "Schema change logs",
        "Historical failure patterns",
        "Data SLA definitions",
      ].join("\n"),
      constraints: [
        "Never modify production data or re-run pipelines autonomously",
        "Read-only SQL only (no DDL/DML)",
        "Limit alert frequency: deduplicate related failures into single threads",
        "Respect data classification — don't include PII in alert messages",
      ].join("\n"),
      p95Latency: "<= 30s for anomaly detection",
      maxCostPerDay: "<= $15/day",
      maxRetries: "2",
      degradeTo: "Raw alert forwarding without root-cause analysis",
      successMetrics: [
        "Pipeline failure detected within 5 minutes of occurrence",
        "Root-cause hypothesis accuracy >= 70%",
        "Data SLA breach alerts sent before downstream impact",
      ].join("\n"),
      nonGoals: [
        "Auto-fixing pipelines or rerunning failed jobs",
        "Data transformation or modeling",
        "Replacing data observability platforms (Monte Carlo, etc.)",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Alert fatigue from noisy false positives",
        "Misidentified root cause leading to wasted investigation time",
        "Query cost overruns from aggressive monitoring",
      ].join("\n"),
    },
  },
  {
    id: "customer-feedback",
    label: "Customer Feedback Synthesizer",
    description:
      "Aggregate feedback from multiple channels into themed insights with sentiment trends.",
    data: {
      appName: "Customer Feedback Synthesizer Spec",
      objective:
        "Transform scattered customer feedback (support tickets, NPS surveys, app reviews, social mentions) into weekly themed insights with sentiment trends, priority rankings, and actionable recommendations for product and CX teams.",
      primaryUsers: "Product managers, CX leads, executive team",
      context:
        "Customer feedback lives in 5+ systems. The agent runs weekly, pulling new feedback, clustering into themes (bugs, feature requests, praise, churn signals), tracking sentiment trends, and producing a prioritized digest for product planning.",
      tools: [
        "Zendesk/Intercom: read recent tickets + tags",
        "Survey platform: read NPS/CSAT responses",
        "App store reviews: scrape iOS/Android reviews",
        "Social listening: read tagged mentions (read-only)",
        "Slack: post weekly digest to #product-feedback (requires approval)",
      ].join("\n"),
      dataSources: [
        "Support tickets (last 7 days)",
        "NPS/CSAT survey responses",
        "App store reviews (iOS + Android)",
        "Social media mentions",
        "Previous feedback digests (for trend comparison)",
      ].join("\n"),
      constraints: [
        "Never respond to customers directly",
        "Anonymize individual feedback in digests (no names/emails)",
        "Flag statistical uncertainty when sample sizes are small",
        "Include direct quotes as evidence (anonymized)",
        "Don't conflate correlation with causation in trend analysis",
      ].join("\n"),
      p95Latency: "<= 5min for full weekly synthesis",
      maxCostPerDay: "<= $10/day (weekly batch)",
      maxRetries: "2",
      degradeTo: "Deliver raw categorized list without trend analysis",
      successMetrics: [
        "Product team reads digest weekly (engagement >= 80%)",
        "At least 1 insight per month directly influences roadmap",
        "Theme categorization accuracy >= 85% (spot-checked quarterly)",
      ].join("\n"),
      nonGoals: [
        "Responding to customers",
        "Making product prioritization decisions",
        "Real-time alerting (this is a batch digest)",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Sampling bias: over-representing vocal minority",
        "Sentiment analysis errors on sarcasm/nuance",
        "Stale themes from previous weeks carried forward incorrectly",
      ].join("\n"),
    },
  },
  {
    id: "contract-reviewer",
    label: "Contract Review Assistant",
    description:
      "Flag risky clauses, missing terms, and deviations from standard playbook in contracts.",
    data: {
      appName: "Contract Review Assistant Spec",
      objective:
        "Accelerate contract review by automatically flagging risky clauses, missing standard terms, and deviations from the approved playbook — reducing legal review time by 50% for routine agreements.",
      primaryUsers: "Legal team, procurement, sales ops",
      context:
        "When a new contract or redline is uploaded, the agent compares it against the company's standard clause library and risk playbook. It produces a structured review: flagged clauses with risk level, missing required terms, and suggested counter-language — all for human legal review.",
      tools: [
        "Document parser: extract text from PDF/DOCX",
        "Clause library: search standard/approved clauses",
        "Risk playbook: match clause patterns to risk categories",
        "Review report generator: structured output (PDF/Markdown)",
        "Slack/Email: notify legal team of new review (requires approval)",
      ].join("\n"),
      dataSources: [
        "Uploaded contract document",
        "Company standard clause library",
        "Risk playbook (liability, IP, termination, indemnity rules)",
        "Previously reviewed contracts (for precedent)",
        "Regulatory requirements by jurisdiction",
      ].join("\n"),
      constraints: [
        "Never provide legal advice — flag and suggest, humans decide",
        "Always surface the original clause text alongside any flag",
        "Clearly distinguish standard deviations from actual risk",
        "Support multi-jurisdiction awareness (US, EU, UK at minimum)",
        "Confidential documents must not leave the secure environment",
      ].join("\n"),
      p95Latency: "<= 90s per contract",
      maxCostPerDay: "<= $25/day",
      maxRetries: "1",
      degradeTo: "Return partial review with unprocessed sections clearly marked",
      successMetrics: [
        "Legal review time for routine contracts reduced by 50%",
        "Risky clause detection recall >= 90%",
        "False positive rate < 20% (clauses flagged unnecessarily)",
      ].join("\n"),
      nonGoals: [
        "Providing legal advice or opinions",
        "Auto-accepting or executing contracts",
        "Replacing outside counsel for complex negotiations",
      ].join("\n"),
      toolContracts: [],
      evalCases: [],
      risks: [
        "Missed risky clause (false negative) with material impact",
        "Over-flagging causing review fatigue",
        "Jurisdiction-specific nuance missed by general rules",
        "Confidentiality breach if documents leak to external APIs",
      ].join("\n"),
    },
  },
];
