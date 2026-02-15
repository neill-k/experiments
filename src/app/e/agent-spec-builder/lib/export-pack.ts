import { generateSpecMarkdown, type SpecInput, EVAL_CATEGORIES } from "./spec";
import { generatePromptPackMarkdown } from "./prompt-pack";

function slugify(name: string): string {
  return (name || "agent-spec")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function bulletize(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ""));
}

/** Generate EVAL_PLAN.md from the spec inputs */
function generateEvalPlan(input: SpecInput): string {
  const name = input.appName.trim() || "Agent Spec";
  const metrics = bulletize(input.successMetrics);
  const tools = bulletize(input.tools);
  const risks = bulletize(input.risks);

  const metricsSection =
    metrics.length > 0
      ? metrics.map((m) => `| ${m} | (define) | (define) | (define) |`).join("\n")
      : "| (TBD) | (define) | (define) | (define) |";

  const toolTestCases =
    tools.length > 0
      ? tools
          .map(
            (t, i) =>
              `### TC-${String(i + 1).padStart(2, "0")}: ${t}\n\n` +
              `- **Input:** (realistic sample input)\n` +
              `- **Expected output:** (what should the agent do?)\n` +
              `- **Pass criteria:** (how do we know it worked?)\n` +
              `- **Edge case:** (what could go wrong?)\n`
          )
          .join("\n")
      : "### TC-01: (add tool test cases)\n\n- **Input:** (TBD)\n- **Expected output:** (TBD)\n- **Pass criteria:** (TBD)\n";

  const riskTests =
    risks.length > 0
      ? risks
          .map((r) => `- [ ] Verify mitigation for: ${r}`)
          .join("\n")
      : "- [ ] (add risk-specific test cases)";

  return `# Evaluation Plan — ${name}

**Generated:** ${new Date().toISOString()}

> This plan accompanies the main spec. Fill in the test cases before building.

---

## Success Metrics & Thresholds

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
${metricsSection}

---

${input.evalCases && input.evalCases.length > 0
    ? `## Eval Rubric (from builder)

| # | Category | Scenario | Input | Expected Behavior | Pass Criteria |
|---|----------|----------|-------|-------------------|---------------|
${input.evalCases
  .map((ec, i) => {
    const catLabel = EVAL_CATEGORIES.find((c) => c.value === ec.category)?.label || ec.category;
    return `| ${i + 1} | ${catLabel} | ${ec.scenario || "(TBD)"} | ${ec.input || "(TBD)"} | ${ec.expectedBehavior || "(TBD)"} | ${ec.passCriteria || "(TBD)"} |`;
  })
  .join("\n")}

---

`
    : ""}## Offline Test Cases

Write 10–30 realistic input/output pairs. Start with the happy path, then add edge cases.

${toolTestCases}

---

## Risk-Specific Tests

${riskTests}

---

## Online / Pilot Evaluation

### Phase 1: Human-in-the-loop (Week 1–2)
- All tool actions require human approval
- Track: approval rate, override rate, time-to-approve
- Goal: build confidence that the agent makes safe decisions

### Phase 2: Supervised autonomy (Week 3–4)
- Allow low-risk actions without approval
- Keep human approval for high-risk actions
- Track: error rate, escalation rate, user satisfaction

### Phase 3: Full deployment
- Define graduation criteria based on Phase 2 metrics
- Set up ongoing monitoring and alerting
- Document rollback procedure

---

## Evaluation Checklist

- [ ] 10+ offline test cases written
- [ ] Success metric baselines measured
- [ ] Risk mitigations tested
- [ ] Human-in-the-loop workflow verified
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting configured

---

*Tip: Run offline evals before writing any agent code. It forces clarity on what "good" looks like.*
`;
}

/** Generate SECURITY_NOTES.md from the spec inputs */
function generateSecurityNotes(input: SpecInput): string {
  const name = input.appName.trim() || "Agent Spec";
  const tools = bulletize(input.tools);
  const constraints = bulletize(input.constraints);
  const dataSources = bulletize(input.dataSources);

  const toolPerms =
    tools.length > 0
      ? tools
          .map((t) => {
            const needsApproval = t.toLowerCase().includes("approval");
            const readOnly = t.toLowerCase().includes("read");
            const risk = needsApproval ? "🟡 Medium" : readOnly ? "🟢 Low" : "🔴 High — needs review";
            return `| ${t} | ${risk} | ${needsApproval ? "Yes" : readOnly ? "N/A (read)" : "**Add approval gate**"} |`;
          })
          .join("\n")
      : "| (no tools listed) | — | — |";

  const dataClassification =
    dataSources.length > 0
      ? dataSources
          .map((d) => `| ${d} | (classify) | (define) | (define) |`)
          .join("\n")
      : "| (no sources listed) | — | — | — |";

  const constraintsChecklist =
    constraints.length > 0
      ? constraints.map((c) => `- [ ] ${c}`).join("\n")
      : "- [ ] (add security constraints from spec)";

  const contracts =
    input.toolContracts && input.toolContracts.length > 0
      ? input.toolContracts
          .map(
            (tc) =>
              `### ${tc.name || "Unnamed Tool"}\n\n` +
              `- **Auth:** ${tc.auth || "(TBD)"}\n` +
              `- **PII handling:** ${tc.piiHandling || "(TBD)"}\n` +
              `- **Failure modes:** ${tc.failureModes || "(TBD)"}\n` +
              `- **Idempotent:** ${tc.idempotent ? "Yes" : "No — needs deduplication strategy"}\n`
          )
          .join("\n")
      : "(No structured tool contracts defined — consider adding them in the spec builder.)";

  return `# Security Notes — ${name}

**Generated:** ${new Date().toISOString()}

> Review these notes with your security/compliance team before deploying.

---

## Tool Permission Matrix

| Tool | Risk Level | Human Approval Required? |
|------|-----------|--------------------------|
${toolPerms}

**Principle:** Default to human-in-the-loop for any action that creates, modifies, or deletes data externally.

---

## Data Classification

| Source | Sensitivity | Access Pattern | Retention |
|--------|------------|----------------|-----------|
${dataClassification}

### PII Considerations
- [ ] Identify all fields that may contain PII
- [ ] Ensure PII is never logged in plain text
- [ ] Define data retention and deletion policies
- [ ] Verify compliance with relevant regulations (GDPR, CCPA, HIPAA, etc.)

---

## Tool Contracts — Security View

${contracts}

---

## Constraint Compliance Checklist

${constraintsChecklist}

---

## Threat Model (Lightweight)

### Prompt injection
- [ ] Agent inputs are sanitized / bounded
- [ ] System prompts are not user-modifiable
- [ ] Tool outputs are treated as untrusted data

### Data exfiltration
- [ ] Agent cannot send data to arbitrary endpoints
- [ ] All external calls are logged and auditable
- [ ] Egress is limited to approved tool endpoints

### Privilege escalation
- [ ] Agent permissions follow least-privilege principle
- [ ] No credential storage in agent memory/context
- [ ] API keys are scoped and rotated

### Denial of service / cost
- [ ] Rate limits configured on all tool calls
- [ ] Token/cost budget enforced per session
- [ ] Retry logic has backoff and max attempts

---

## Audit & Observability

- [ ] Every tool call logged with: timestamp, input, output, user context
- [ ] Anomaly detection on: error rate, cost spikes, unusual tool patterns
- [ ] Regular review cadence: (weekly / monthly)
- [ ] Incident response plan documented

---

## Pre-Launch Security Checklist

- [ ] Tool permission matrix reviewed by security team
- [ ] Data classification completed
- [ ] PII handling verified
- [ ] Threat model reviewed
- [ ] Audit logging confirmed
- [ ] Rollback procedure tested
- [ ] Incident response plan in place

---

*This document is a starting point. Tailor it to your org's security requirements and compliance framework.*
`;
}

/** Download a ZIP containing SPEC.md, EVAL_PLAN.md, and SECURITY_NOTES.md */
export async function downloadExportPack(input: SpecInput): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const slug = slugify(input.appName);
  const zip = new JSZip();

  const folder = zip.folder(slug);
  if (!folder) throw new Error("Failed to create zip folder");

  folder.file("SPEC.md", generateSpecMarkdown(input));
  folder.file("EVAL_PLAN.md", generateEvalPlan(input));
  folder.file("SECURITY_NOTES.md", generateSecurityNotes(input));
  folder.file("PROMPTS.md", generatePromptPackMarkdown(input));

  // Add a small README for the pack
  folder.file(
    "README.md",
    `# ${input.appName.trim() || "Agent Spec"} — Export Pack\n\n` +
      `Generated on ${new Date().toISOString()}\n\n` +
      `## Contents\n\n` +
      `| File | Description |\n` +
      `|------|-------------|\n` +
      `| SPEC.md | Full agent specification |\n` +
      `| EVAL_PLAN.md | Evaluation plan with test case templates |\n` +
      `| SECURITY_NOTES.md | Security review checklist and threat model |\n` +
      `| PROMPTS.md | Test prompts tailored to the spec for validation |\n\n` +
      `## Usage\n\n` +
      `1. Review and fill in the (TBD) sections\n` +
      `2. Share with your team for feedback\n` +
      `3. Use EVAL_PLAN.md to write test cases *before* building\n` +
      `4. Have security review SECURITY_NOTES.md before deployment\n`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-pack.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
