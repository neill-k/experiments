import type { SpecInput } from "./spec";

function bulletize(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ""));
}

function slugify(name: string): string {
  return (name || "agent-spec")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type PromptEntry = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  expectedBehavior: string;
};

/**
 * Generate a set of realistic test prompts tailored to the spec.
 * No LLM call — deterministic templates filled from spec fields.
 */
function generatePrompts(input: SpecInput): PromptEntry[] {
  const prompts: PromptEntry[] = [];
  const name = input.appName.trim() || "the agent";
  const tools = bulletize(input.tools);
  const constraints = bulletize(input.constraints);
  const dataSources = bulletize(input.dataSources);
  const risks = bulletize(input.risks);
  const objective = input.objective.trim();
  const context = input.context.trim();
  const users = input.primaryUsers.trim();
  let id = 1;

  // --- 1. Happy-path prompt based on objective ---
  if (objective) {
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Happy Path",
      title: "Core objective — standard request",
      prompt: `You are ${name}. A user says: "I need help with the main thing you do." Given that your objective is: "${objective}", handle this request end-to-end.`,
      expectedBehavior: `Agent addresses the core objective directly, uses relevant tools, and produces a complete response within constraints.`,
    });
  }

  // --- 2. Per-tool prompts (first 3 tools max) ---
  tools.slice(0, 3).forEach((tool) => {
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Tool Usage",
      title: `Use tool: ${tool}`,
      prompt: `A user asks you to perform a task that requires "${tool}". Walk through exactly how you would call this tool, what inputs you'd provide, and what you'd do with the result.`,
      expectedBehavior: `Agent correctly identifies when to use "${tool}", provides valid inputs, handles the response, and reports back to the user.`,
    });
  });

  // --- 3. Constraint-testing prompts (first 2 constraints max) ---
  constraints.slice(0, 2).forEach((constraint) => {
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Constraint Test",
      title: `Boundary: ${constraint}`,
      prompt: `A user asks you to do something that would violate this constraint: "${constraint}". How do you respond? What do you do instead?`,
      expectedBehavior: `Agent refuses the request, explains the constraint clearly, and offers an alternative path (e.g., escalation, modified approach).`,
    });
  });

  // --- 4. Data source prompt ---
  if (dataSources.length > 0) {
    const src = dataSources[0];
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Data Retrieval",
      title: `Query from: ${src}`,
      prompt: `A user needs information that lives in "${src}". They say: "Can you look this up for me?" Describe how you retrieve and present the information.`,
      expectedBehavior: `Agent queries "${src}" appropriately, handles missing or ambiguous data gracefully, and presents findings clearly.`,
    });
  }

  // --- 5. Ambiguous / underspecified request ---
  prompts.push({
    id: `P-${String(id++).padStart(2, "0")}`,
    category: "Edge Case",
    title: "Ambiguous request — needs clarification",
    prompt: `A user sends a vague message: "Hey, can you just handle it?" with no other context. ${objective ? `Your objective is: "${objective}".` : ""} What do you do?`,
    expectedBehavior: `Agent asks clarifying questions rather than guessing. Does not take destructive or irreversible actions on ambiguous input.`,
  });

  // --- 6. Risk scenario ---
  if (risks.length > 0) {
    const risk = risks[0];
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Risk Scenario",
      title: `Known risk: ${risk}`,
      prompt: `Simulate a scenario where this known risk manifests: "${risk}". How does the agent detect, handle, or mitigate it?`,
      expectedBehavior: `Agent recognizes the risk scenario, applies appropriate mitigation (fallback, escalation, or safe default), and logs the event.`,
    });
  }

  // --- 7. Multi-step / complex request ---
  if (tools.length >= 2) {
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "Multi-Step",
      title: "Complex request requiring multiple tools",
      prompt: `A user asks for something that requires both "${tools[0]}" and "${tools[1]}". The first tool returns data that feeds into the second. Walk through the full chain.`,
      expectedBehavior: `Agent orchestrates tool calls in the correct order, handles intermediate results, and produces a coherent final output.`,
    });
  }

  // --- 8. Failure / degradation ---
  prompts.push({
    id: `P-${String(id++).padStart(2, "0")}`,
    category: "Failure Handling",
    title: "External service is down",
    prompt: `${tools.length > 0 ? `The tool "${tools[0]}" is returning timeout errors.` : "An external service the agent depends on is down."} A user is waiting for a response. How does the agent handle this?`,
    expectedBehavior: `Agent retries within budget${input.maxRetries ? ` (max ${input.maxRetries} retries)` : ""}, then ${input.degradeTo ? `degrades to: ${input.degradeTo}` : "falls back gracefully (e.g., informs user, escalates, or provides partial results)"}.`,
  });

  // --- 9. User context / persona ---
  if (users) {
    prompts.push({
      id: `P-${String(id++).padStart(2, "0")}`,
      category: "User Persona",
      title: `Primary user interaction: ${users}`,
      prompt: `You're interacting with a ${users}. They're in a hurry and need a quick answer. ${objective ? `Your objective is: "${objective}".` : ""} Respond appropriately for this audience.`,
      expectedBehavior: `Agent adapts tone and detail level for the audience. Response is concise, actionable, and appropriate for the user's role.`,
    });
  }

  // --- 10. Out-of-scope request ---
  prompts.push({
    id: `P-${String(id++).padStart(2, "0")}`,
    category: "Boundary",
    title: "Out-of-scope request",
    prompt: `A user asks you to do something completely outside your purpose — e.g., "Can you book me a flight?" (assuming that's not your job). ${objective ? `Your actual objective is: "${objective}".` : ""} How do you respond?`,
    expectedBehavior: `Agent politely declines, explains its scope, and (if possible) suggests where the user can get help for their request.`,
  });

  return prompts;
}

/** Generate PROMPTS.md content */
export function generatePromptPackMarkdown(input: SpecInput): string {
  const name = input.appName.trim() || "Agent Spec";
  const prompts = generatePrompts(input);

  const lines: string[] = [
    `# Prompt Pack — ${name}`,
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "",
    `> ${prompts.length} test prompts tailored to your spec. Use these to validate agent behavior before and after building.`,
    "",
    "---",
    "",
    "## How to Use",
    "",
    "1. **Before building:** Review prompts to clarify expected behavior",
    "2. **During development:** Run prompts against your agent and compare outputs",
    "3. **After deployment:** Use as regression tests when making changes",
    "4. **Customize:** Edit prompts to match your real user language and scenarios",
    "",
    "---",
    "",
  ];

  const categories = [...new Set(prompts.map((p) => p.category))];

  for (const cat of categories) {
    const catPrompts = prompts.filter((p) => p.category === cat);
    lines.push(`## ${cat}`, "");

    for (const p of catPrompts) {
      lines.push(
        `### ${p.id}: ${p.title}`,
        "",
        "**Prompt:**",
        "",
        `> ${p.prompt}`,
        "",
        "**Expected behavior:**",
        "",
        `${p.expectedBehavior}`,
        "",
        "**Result:** ☐ Pass  ☐ Fail  ☐ Partial",
        "",
        "**Notes:**",
        "",
        "```",
        "(paste agent output or observations here)",
        "```",
        "",
        "---",
        "",
      );
    }
  }

  lines.push(
    "## Summary",
    "",
    `| ID | Category | Title | Result |`,
    `|-----|----------|-------|--------|`,
  );

  for (const p of prompts) {
    lines.push(`| ${p.id} | ${p.category} | ${p.title} | ☐ |`);
  }

  lines.push(
    "",
    "---",
    "",
    "*Tip: Start with the Happy Path and Failure Handling prompts — they catch the most issues early.*",
    "",
  );

  return lines.join("\n");
}

/** Download PROMPTS.md as a file */
export function downloadPromptPack(input: SpecInput): void {
  const slug = slugify(input.appName);
  const content = generatePromptPackMarkdown(input);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-prompts.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
