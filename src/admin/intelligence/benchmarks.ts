import type { BrainListing, StoreBenchmarks } from './types';

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export function buildBenchmarks(listings: BrainListing[]): StoreBenchmarks {
  const views = listings.map(l => Number(l.views || 0));
  const favorites = listings.map(l => Number(l.num_favorers || 0));
  const rates = listings.filter(l => Number(l.views || 0) > 0).map(l => (Number(l.num_favorers || 0) / Number(l.views || 0)) * 100);
  const prices = listings.map(l => {
    const amount = Number(l.price?.amount || 0);
    const divisor = Number(l.price?.divisor || 100);
    return divisor ? amount / divisor : 0;
  }).filter(Boolean);

  return {
    listingCount: listings.length,
    totalViews: views.reduce((a, b) => a + b, 0),
    totalFavorites: favorites.reduce((a, b) => a + b, 0),
    avgViews: views.length ? views.reduce((a, b) => a + b, 0) / views.length : 0,
    medianViews: median(views),
    avgFavorites: favorites.length ? favorites.reduce((a, b) => a + b, 0) / favorites.length : 0,
    medianFavorites: median(favorites),
    avgFavoriteRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
    medianFavoriteRate: median(rates),
    medianPrice: median(prices),
  };
}