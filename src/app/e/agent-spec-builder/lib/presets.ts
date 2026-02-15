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
];
