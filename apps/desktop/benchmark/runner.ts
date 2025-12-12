/**
 * Benchmark runner for testing code generation quality
 *
 * This script runs benchmark prompts through the generation pipeline
 * and measures success rates, validation pass rates, and timing.
 */

import { BENCHMARK_PROMPTS, type BenchmarkPrompt } from './prompts';
import { validate } from '../src/lib/validator';

export interface BenchmarkResult {
  promptId: string;
  prompt: string;
  complexity: string;
  success: boolean;
  validOnFirstPass: boolean;
  fixAttemptsNeeded: number;
  errors: string[];
  generationTimeMs: number;
  totalTimeMs: number;
}

export interface BenchmarkSummary {
  totalPrompts: number;
  successCount: number;
  successRate: number;
  firstPassValidRate: number;
  averageGenerationTimeMs: number;
  averageTotalTimeMs: number;
  byComplexity: {
    simple: { total: number; success: number; rate: number };
    medium: { total: number; success: number; rate: number };
    complex: { total: number; success: number; rate: number };
  };
}

/**
 * Run a single benchmark prompt
 * Note: This is a mock implementation for testing purposes.
 * In production, this would call the actual Claude Code CLI.
 */
export async function runBenchmark(
  prompt: BenchmarkPrompt,
  generateFn: (prompt: string) => Promise<{ code: string; timeMs: number }>
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  let fixAttempts = 0;
  let validOnFirstPass = false;
  let success = false;
  const errors: string[] = [];

  try {
    // Generate initial code
    const { code, timeMs: generationTimeMs } = await generateFn(prompt.prompt);

    // Validate
    let validation = validate(code);
    validOnFirstPass = validation.valid;

    if (validation.valid) {
      success = true;
    } else {
      // Try up to 3 fix attempts
      while (!validation.valid && fixAttempts < 3) {
        fixAttempts++;
        errors.push(...validation.errors.map((e) => e.message));

        // In a real implementation, this would ask Claude to fix the code
        // For benchmarking, we just record the failure
        break;
      }

      success = validation.valid;
    }

    return {
      promptId: prompt.id,
      prompt: prompt.prompt,
      complexity: prompt.complexity,
      success,
      validOnFirstPass,
      fixAttemptsNeeded: fixAttempts,
      errors,
      generationTimeMs,
      totalTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      promptId: prompt.id,
      prompt: prompt.prompt,
      complexity: prompt.complexity,
      success: false,
      validOnFirstPass: false,
      fixAttemptsNeeded: fixAttempts,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      generationTimeMs: 0,
      totalTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Run all benchmark prompts
 */
export async function runAllBenchmarks(
  generateFn: (prompt: string) => Promise<{ code: string; timeMs: number }>
): Promise<{ results: BenchmarkResult[]; summary: BenchmarkSummary }> {
  const results: BenchmarkResult[] = [];

  for (const prompt of BENCHMARK_PROMPTS) {
    const result = await runBenchmark(prompt, generateFn);
    results.push(result);
    console.log(`[${result.success ? 'PASS' : 'FAIL'}] ${prompt.id}`);
  }

  const summary = calculateSummary(results);
  return { results, summary };
}

/**
 * Calculate benchmark summary statistics
 */
export function calculateSummary(results: BenchmarkResult[]): BenchmarkSummary {
  const successResults = results.filter((r) => r.success);
  const firstPassResults = results.filter((r) => r.validOnFirstPass);

  const byComplexity = {
    simple: { total: 0, success: 0, rate: 0 },
    medium: { total: 0, success: 0, rate: 0 },
    complex: { total: 0, success: 0, rate: 0 },
  };

  for (const result of results) {
    const complexity = result.complexity as keyof typeof byComplexity;
    byComplexity[complexity].total++;
    if (result.success) {
      byComplexity[complexity].success++;
    }
  }

  for (const key of Object.keys(byComplexity) as (keyof typeof byComplexity)[]) {
    byComplexity[key].rate =
      byComplexity[key].total > 0
        ? byComplexity[key].success / byComplexity[key].total
        : 0;
  }

  return {
    totalPrompts: results.length,
    successCount: successResults.length,
    successRate: results.length > 0 ? successResults.length / results.length : 0,
    firstPassValidRate:
      results.length > 0 ? firstPassResults.length / results.length : 0,
    averageGenerationTimeMs:
      results.length > 0
        ? results.reduce((sum, r) => sum + r.generationTimeMs, 0) / results.length
        : 0,
    averageTotalTimeMs:
      results.length > 0
        ? results.reduce((sum, r) => sum + r.totalTimeMs, 0) / results.length
        : 0,
    byComplexity,
  };
}

/**
 * Format summary for console output
 */
export function formatSummary(summary: BenchmarkSummary): string {
  return `
=== Benchmark Summary ===

Total Prompts: ${summary.totalPrompts}
Success Rate: ${(summary.successRate * 100).toFixed(1)}% (${summary.successCount}/${summary.totalPrompts})
First-Pass Valid Rate: ${(summary.firstPassValidRate * 100).toFixed(1)}%

By Complexity:
  Simple:  ${(summary.byComplexity.simple.rate * 100).toFixed(1)}% (${summary.byComplexity.simple.success}/${summary.byComplexity.simple.total})
  Medium:  ${(summary.byComplexity.medium.rate * 100).toFixed(1)}% (${summary.byComplexity.medium.success}/${summary.byComplexity.medium.total})
  Complex: ${(summary.byComplexity.complex.rate * 100).toFixed(1)}% (${summary.byComplexity.complex.success}/${summary.byComplexity.complex.total})

Timing:
  Avg Generation: ${summary.averageGenerationTimeMs.toFixed(0)}ms
  Avg Total: ${summary.averageTotalTimeMs.toFixed(0)}ms
`.trim();
}
