import type { BrainListing, StoreBenchmarks } from './types';

const priceOf = (l: BrainListing) => {
  const amount = Number(l.price?.amount || 0);
  const divisor = Number(l.price?.divisor || 100);
  return divisor ? amount / divisor : 0;
};

export function seoScore(listing: BrainListing) {
  const title = listing.title?.trim() || '';
  const tags = Array.isArray(listing.tags) ? listing.tags.filter(Boolean) : [];
  const description = listing.description?.trim() || '';
  let score = 0;
  if (title.length >= 35 && title.length <= 140) score += 35;
  else if (title.length >= 20) score += 20;
  if (tags.length >= 10) score += 30;
  else if (tags.length >= 7) score += 20;
  if (description.length >= 1000) score += 35;
  else if (description.length >= 500) score += 20;
  return Math.min(100, score);
}

export function scoreListing(listing: BrainListing, benchmarks: StoreBenchmarks) {
  const views = Number(listing.views || 0);
  const favorites = Number(listing.num_favorers || 0);
  const favoriteRate = views ? (favorites / views) * 100 : 0;
  const viewRatio = benchmarks.medianViews > 0 ? views / benchmarks.medianViews : 0;
  const interestRatio = benchmarks.medianFavorites > 0 ? favorites / benchmarks.medianFavorites : favorites ? 1 : 0;
  const seo = seoScore(listing);
  const price = priceOf(listing);

  return { views, favorites, favoriteRate, viewRatio, interestRatio, seo, price };
}