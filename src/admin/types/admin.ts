export interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number | null;
  price_type: 'fixed' | 'quote';
  active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
  // Backward compat
  name?: string;
  priceType?: 'fixed' | 'quote';
}

export interface Package {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_text: string;
  featured: boolean;
  active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
  // Supabase related
  package_items?: PackageItem[];
  // Backward compat
  name?: string;
  features?: string[];
}

export interface PackageItem {
  id: string;
  package_id: string;
  text: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Section {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  price: number | null;
  price_type: 'fixed' | 'quote';
  active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
  // Backward compat
  name?: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  tagline: string;
  phone: string;
  email: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  created_at?: string;
  updated_at?: string;
  // Backward compat
  siteName?: string;
}

