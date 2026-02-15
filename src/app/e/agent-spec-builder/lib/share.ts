import type { SpecInput } from "./spec";

const EMPTY: SpecInput = {
  appName: "Agent Spec",
  objective: "",
  primaryUsers: "",
  context: "",
  tools: "",
  dataSources: "",
  constraints: "",
  successMetrics: "",
  nonGoals: "",
  risks: "",
  p95Latency: "",
  maxCostPerDay: "",
  maxRetries: "",
  degradeTo: "",
  toolContracts: [],
  evalCases: [],
};

function base64UrlEncode(input: string) {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const mod = normalized.length % 4;
  const pad = mod === 0 ? "" : mod === 2 ? "==" : mod === 3 ? "=" : "===";
  const text = atob(normalized + pad);

  // atob returns a binary string; convert it back to UTF-8
  return decodeURIComponent(
    Array.from(text)
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

export function encodeSpecState(input: SpecInput) {
  return base64UrlEncode(JSON.stringify(input));
}

export function decodeSpecState(encoded: string): SpecInput | null {
  try {
    const raw = JSON.parse(base64UrlDecode(encoded)) as Partial<SpecInput>;
    const out: SpecInput = {
      ...EMPTY,
      ...Object.fromEntries(
        Object.entries(raw ?? {}).map(([k, v]) => [k, typeof v === "string" ? v : v])
      ),
      toolContracts: Array.isArray(raw.toolContracts) ? raw.toolContracts : [],
      evalCases: Array.isArray(raw.evalCases) ? raw.evalCases : [],
    } as SpecInput;
    return out;
  } catch {
    return null;
  }
}
