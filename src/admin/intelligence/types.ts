export type BrainAction = 'TRAFİK' | 'KAPAK_SEO' | 'DÖNÜŞÜM' | 'SEO' | 'VERİ_TOPLA';

export type BrainListing = {
  listing_id: number;
  title: string;
  views?: number;
  num_favorers?: number;
  price?: { amount?: number; divisor?: number; currency_code?: string };
  tags?: string[];
  description?: string;
  section_id?: number | null;
  shop_section_id?: number | null;
};

export type StoreBenchmarks = {
  listingCount: number;
  totalViews: number;
  totalFavorites: number;
  avgViews: number;
  medianViews: number;
  avgFavorites: number;
  medianFavorites: number;
  avgFavoriteRate: number;
  medianPrice: number;
};

export type BrainDecision = {
  listingId: number;
  title: string;
  action: BrainAction;
  priority: number;
  confidence: number;
  reasons: string[];
  recommendation: string;
  metrics: {
    views: number;
    favorites: number;
    favoriteRate: number;
    viewsVsMedian: number;
    seoScore: number;
    price: number;
  };
};