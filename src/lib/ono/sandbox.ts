/**
 * Vercel Sandbox integration for executing user-submitted Python solutions.
 * Creates an ephemeral microVM, runs the solution against test cases,
 * and captures execution metrics.
 */

import { Sandbox } from '@vercel/sandbox'

export interface TestCaseInput {
  input: unknown[]
  expected: unknown
}

export interface TestResult {
  passed: boolean
  elapsedMs: number
  peakMemoryBytes: number
  actual: string
  expected: string
}

export interface ExecutionResult {
  allPassed: boolean
  testResults: TestResult[]
  metrics: {
    totalExecutionMs: number
    peakMemoryBytes: number
    loc: number
    numFunctions: number
    numClasses: number
    numImports: number
    avgNameLength: number
    longNamesCount: number
    commentLines: number
    totalLines: number
  }
  error?: string
}

/**
 * Generate the Python test harness that executes and scores a solution.
 */
function generateTestHarness(
  functionName: string,
  testCases: TestCaseInput[],
): string {
  return `
import json
import time
import tracemalloc
import sys
import ast
import importlib.util

# Load the solution module
spec = importlib.util.spec_from_file_location("solution", "/vercel/sandbox/solution.py")
mod = importlib.util.module_from_spec(spec)

try:
    spec.loader.exec_module(mod)
except Exception as e:
    print(json.dumps({"error": f"Failed to import solution: {str(e)}"}))
    sys.exit(1)

# Get the function
fn = getattr(mod, ${JSON.stringify(functionName)}, None)
if fn is None:
    print(json.dumps({"error": f"Function '${functionName}' not found in solution.py"}))
    sys.exit(1)

# Test cases
test_cases = ${JSON.stringify(testCases)}

results = []
total_time = 0
peak_mem = 0

for tc in test_cases:
    inputs = tc["input"]
    expected = tc["expected"]

    tracemalloc.start()
    start = time.perf_counter()

    try:
        actual = fn(*inputs)
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        mem = tracemalloc.get_traced_memory()[1]
        tracemalloc.stop()
        results.append({
            "passed": False,
            "elapsed_ms": elapsed,
            "peak_memory_bytes": mem,
            "actual": f"ERROR: {str(e)}",
            "expected": repr(expected),
        })
        total_time += elapsed
        peak_mem = max(peak_mem, mem)
        continue

    elapsed = (time.perf_counter() - start) * 1000
    mem = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()

    # Normalize comparison: sort lists for two_sum style problems
    passed = actual == expected
    if not passed and isinstance(actual, list) and isinstance(expected, list):
        passed = sorted(actual) == sorted(expected)
    if not passed and isinstance(actual, dict) and isinstance(expected, dict):
        passed = actual == expected

    results.append({
        "passed": passed,
        "elapsed_ms": elapsed,
        "peak_memory_bytes": mem,
        "actual": repr(actual),
        "expected": repr(expected),
    })
    total_time += elapsed
    peak_mem = max(peak_mem, mem)

# Static analysis of the solution source
with open("/vercel/sandbox/solution.py") as f:
    source = f.read()

lines = source.split("\\n")
code_lines = [l for l in lines if l.strip() and not l.strip().startswith("#")]
comment_lines_count = sum(1 for l in lines if l.strip().startswith("#"))

try:
    tree = ast.parse(source)
    num_functions = sum(1 for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)))
    num_classes = sum(1 for node in ast.walk(tree) if isinstance(node, ast.ClassDef))
    num_imports = sum(1 for node in ast.walk(tree) if isinstance(node, (ast.Import, ast.ImportFrom)))

    names = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            names.append(node.id)
        elif isinstance(node, ast.FunctionDef):
            names.append(node.name)
        elif isinstance(node, ast.ClassDef):
            names.append(node.name)

    avg_name_length = sum(len(n) for n in names) / max(len(names), 1)
    long_names = sum(1 for n in names if len(n) > 20)
except Exception:
    num_functions = 0
    num_classes = 0
    num_imports = 0
    avg_name_length = 0
    long_names = 0

output = {
    "all_passed": all(r["passed"] for r in results),
    "test_results": results,
    "metrics": {
        "total_execution_ms": total_time,
        "peak_memory_bytes": peak_mem,
        "loc": len(code_lines),
        "num_functions": num_functions,
        "num_classes": num_classes,
        "num_imports": num_imports,
        "avg_name_length": round(avg_name_length, 2),
        "long_names_count": long_names,
        "comment_lines": comment_lines_count,
        "total_lines": len(lines),
    },
}

print(json.dumps(output))
`
}

/**
 * Execute a solution in a Vercel Sandbox and return results.
 */
export async function executeSolution(
  solutionCode: string,
  functionName: string,
  testCases: TestCaseInput[],
): Promise<ExecutionResult> {
  let sandbox: Sandbox | null = null

  try {
    // Create sandbox with Python 3.13 runtime
    sandbox = await Sandbox.create({
      runtime: 'python3.13',
      timeout: 300_000, // 5 min sandbox lifetime
      networkPolicy: 'deny-all', // no network access for solutions
    })

    // Write solution and test harness to sandbox
    const harness = generateTestHarness(functionName, testCases)
    await sandbox.writeFiles([
      { path: 'solution.py', content: Buffer.from(solutionCode) },
      { path: 'harness.py', content: Buffer.from(harness) },
    ])

    // Execute with a generous timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000) // 2 min execution limit

    const result = await sandbox.runCommand('python3', ['harness.py'], {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const stdout = await result.stdout()
    const stderr = await result.stderr()

    if (result.exitCode !== 0) {
      return {
        allPassed: false,
        testResults: [],
        metrics: emptyMetrics(),
        error: stderr || `Process exited with code ${result.exitCode}`,
      }
    }

    // Parse the JSON output from the harness
    const parsed = JSON.parse(stdout.trim())

    if (parsed.error) {
      return {
        allPassed: false,
        testResults: [],
        metrics: emptyMetrics(),
        error: parsed.error,
      }
    }

    return {
      allPassed: parsed.all_passed,
      testResults: parsed.test_results.map((r: Record<string, unknown>) => ({
        passed: r.passed,
        elapsedMs: r.elapsed_ms as number,
        peakMemoryBytes: r.peak_memory_bytes as number,
        actual: r.actual as string,
        expected: r.expected as string,
      })),
      metrics: {
        totalExecutionMs: parsed.metrics.total_execution_ms,
        peakMemoryBytes: parsed.metrics.peak_memory_bytes,
        loc: parsed.metrics.loc,
        numFunctions: parsed.metrics.num_functions,
        numClasses: parsed.metrics.num_classes,
        numImports: parsed.metrics.num_imports,
        avgNameLength: parsed.metrics.avg_name_length,
        longNamesCount: parsed.metrics.long_names_count,
        commentLines: parsed.metrics.comment_lines,
        totalLines: parsed.metrics.total_lines,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown execution error'
    return {
      allPassed: false,
      testResults: [],
      metrics: emptyMetrics(),
      error: message.includes('abort')
        ? 'Execution timed out (2 minute limit)'
        : message,
    }
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop()
      } catch {
        // Best effort cleanup
      }
    }
  }
}

function emptyMetrics() {
  return {
    totalExecutionMs: 0,
    peakMemoryBytes: 0,
    loc: 0,
    numFunctions: 0,
    numClasses: 0,
    numImports: 0,
    avgNameLength: 0,
    longNamesCount: 0,
    commentLines: 0,
    totalLines: 0,
  }
}
