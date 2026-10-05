import type { BrainDecision, BrainListing, StoreBenchmarks } from './types';
import { scoreListing } from './scoring';

export function recommend(listing: BrainListing, benchmarks: StoreBenchmarks): BrainDecision {
  const s = scoreListing(listing, benchmarks);
  const reasons: string[] = [];
  const sample: BrainDecision['sample'] = s.views >= 30 ? 'YÜKSEK' : s.views >= 10 ? 'ORTA' : 'DÜŞÜK';
  let action: BrainDecision['action'] = 'VERİ_TOPLA';
  let priority = 60;
  let confidence = sample === 'YÜKSEK' ? 78 : sample === 'ORTA' ? 66 : 45;
  let recommendation = 'Şimdilik büyük değişiklik yapma; daha fazla görüntülenme ve favori verisi topla.';

  if (s.views === 0) {
    action = 'VERİ_TOPLA';
    priority = 55;
    confidence = 92;
    reasons.push('Henüz ilan görüntülenmesi yok; performans teşhisi için veri yetersiz.');
    recommendation = 'Ürünü değiştirmeden önce görünürlük verisi oluştur. Başlık/etiketleri kontrol et ve Pinterest gibi ücretsiz dış trafik testi uygula.';
  } else if (s.views >= Math.max(20, benchmarks.medianViews * 1.25) && s.favorites >= 1) {
    action = 'DÖNÜŞÜM';
    priority = 98;
    confidence = Math.min(96, confidence + 15);
    reasons.push('İlan görüntülenmesi mağaza medyanının belirgin üzerinde.');
    reasons.push('Favori sinyali var; ürün sayfasında ilgi oluştuğu görülüyor.');
    recommendation = 'İlk olarak kapak, demo ekranları, fayda ve güven mesajını test et. Fiyatı tek başına düşürme.';
  } else if (s.views >= Math.max(20, benchmarks.medianViews * 1.25) && s.favorites === 0) {
    action = 'KAPAK_SEO';
    priority = 93;
    confidence = Math.min(92, confidence + 10);
    reasons.push('Yüksek görüntülenme var ancak favori sinyali yok.');
    reasons.push('İlk temasın (kapak + başlık + teklif) güçlendirilmesi daha mantıklı.');
    recommendation = 'Kapak görselini ve başlığı fayda odaklı yeniden düzenle; ürünün kime ne kazandırdığı ilk görselde net olsun.';
  } else if (s.views < Math.max(8, benchmarks.medianViews * 0.45)) {
    action = 'TRAFİK';
    priority = s.views < 5 ? 86 : 88;
    confidence = Math.min(88, confidence + 12);
    reasons.push('Görüntülenme mağaza referansının belirgin altında.');
    reasons.push(sample === 'DÜŞÜK' ? 'Örneklem küçük; kesin dönüşüm hükmü verilmemeli.' : 'Görünürlük sorunu ürün sayfası dönüşümünden önce geliyor.');
    recommendation = 'Arama niyetini, başlık/etiket uyumunu ve kategori seçimini düzelt; ardından ücretsiz Pinterest/dış trafik testi yap.';
  } else if (s.seo < 70) {
    action = 'SEO';
    priority = 78;
    confidence = Math.min(84, confidence + 8);
    reasons.push(`SEO sinyali düşük (${s.seo}/100).`);
    recommendation = 'Başlık, etiketler ve açıklamanın ilk bölümünü arama niyetine göre güçlendir; sonra yeniden ölç.';
  } else if (s.favorites >= 1) {
    action = 'DÖNÜŞÜM';
    priority = 74;
    confidence = Math.min(82, confidence + 6);
    reasons.push('Favori sinyali var ancak henüz güçlü trafik örneklemi yok.');
    recommendation = 'Büyük değişiklik yerine güven, demo ve teklif sunumunu iyileştir; yeni veriyi bekle.';
  } else {
    reasons.push('Henüz güçlü bir performans sinyali oluşmadı.');
    recommendation = 'Ürüne dokunmadan veri toplamaya devam et; küçük örneklemde agresif değişiklik yapma.';
  }

  return {
    listingId: listing.listing_id,
    title: listing.title,
    action,
    priority,
    confidence,
    sample,
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