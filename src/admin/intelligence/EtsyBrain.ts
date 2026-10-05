import type { BrainListing, BrainDecision, StoreBenchmarks } from './types';
import { buildBenchmarks } from './benchmarks';
import { recommend } from './recommendations';

export function analyzeEtsyStore(listings: BrainListing[]) {
  const benchmarks: StoreBenchmarks = buildBenchmarks(listings);
  const decisions: BrainDecision[] = listings
    .map(listing => recommend(listing, benchmarks))
    .sort((a, b) => b.priority - a.priority || b.metrics.views - a.metrics.views);

  return {
    benchmarks,
    decisions,
    topDecisions: decisions.slice(0, 5),
  };
}

export type { BrainListing, BrainDecision, StoreBenchmarks };