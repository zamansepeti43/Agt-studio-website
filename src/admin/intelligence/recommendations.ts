import type { BrainDecision, BrainListing, StoreBenchmarks } from './types';
import { scoreListing } from './scoring';

export function recommend(listing: BrainListing, benchmarks: StoreBenchmarks): BrainDecision {
  const s = scoreListing(listing, benchmarks);
  const reasons: string[] = [];
  let action: BrainDecision['action'] = 'VERİ_TOPLA';
  let priority = 70;
  let confidence = 55;
  let recommendation = 'Büyük değişiklik yapmadan daha fazla veri topla.';

  if (s.views >= Math.max(10, benchmarks.medianViews * 1.15) && s.favorites >= 1) {
    action = 'DÖNÜŞÜM';
    priority = 98;
    confidence = Math.min(95, 72 + Math.round(Math.min(18, s.viewRatio * 8)));
    reasons.push('Mağaza medyanının üzerinde trafik var.');
    reasons.push('Ürün en az bir favori almış; ilgi sinyali doğrulanmış.');
    recommendation = 'Önce kapak görseli, demo/ekran görüntüleri, fayda anlatımı ve güven mesajını test et. Fiyatı hemen düşürme.';
  } else if (s.views >= Math.max(10, benchmarks.medianViews * 1.15) && s.favorites === 0) {
    action = 'KAPAK_SEO';
    priority = 92;
    confidence = 84;
    reasons.push('Trafik geliyor ancak favori sinyali oluşmamış.');
    reasons.push('İlk temas (kapak + başlık + konumlandırma) zayıf olabilir.');
    recommendation = 'İlk görseli ve başlığı fayda odaklı yeniden test et; ürünün kime ve ne kazandırdığı ilk ekranda anlaşılmalı.';
  } else if (s.views < Math.max(8, benchmarks.medianViews * 0.45)) {
    action = 'TRAFİK';
    priority = 88;
    confidence = 82;
    reasons.push('Görüntülenme mağaza referansının belirgin altında.');
    reasons.push('Örneklem küçük olduğu için satış/dönüşüm hakkında kesin hüküm verilemez.');
    recommendation = 'Önce arama niyeti, başlık, etiket ve kategori uyumunu düzelt; ardından Pinterest/dış trafik testi yap.';
  } else if (s.seo < 70) {
    action = 'SEO';
    priority = 78;
    confidence = 76;
    reasons.push(`SEO sinyali düşük (${s.seo}/100): başlık, etiket veya açıklama eksik.`);
    recommendation = 'Arama niyetine uygun başlık/etiketleri ve açıklamanın ilk bölümünü güçlendir; sonra yeniden ölç.';
  } else if (s.favorites >= 1) {
    action = 'DÖNÜŞÜM';
    priority = 76;
    confidence = 68;
    reasons.push('Favori sinyali var.');
    recommendation = 'Güven, demo ve teklif sunumunu test et; fiyatı tek başına değiştirme.';
  } else {
    reasons.push('Mağaza referansına göre henüz güçlü bir sinyal oluşmadı.');
    recommendation = 'Veri toplamaya devam et; küçük örneklemde agresif değişiklik yapma.';
  }

  return {
    listingId: listing.listing_id,
    title: listing.title,
    action,
    priority,
    confidence,
    reasons,
    recommendation,
    metrics: {
      views: s.views,
      favorites: s.favorites,
      favoriteRate: s.favoriteRate,
      viewsVsMedian: benchmarks.medianViews ? s.views / benchmarks.medianViews : 0,
      seoScore: s.seo,
      price: s.price,
    },
  };
}