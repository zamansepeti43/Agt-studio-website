import { useEffect, useState } from "react";
import "./EtsyStore.css";

interface EtsyImage {
  url_570xN?: string;
  url_760xN?: string;
  url_fullxfull?: string;
}

interface EtsyListing {
  listing_id: number;
  title: string;
  description?: string;
  url?: string;
  price?: {
    amount?: number;
    divisor?: number;
    currency_code?: string;
  };
  images?: EtsyImage[];
}

interface EtsyResponse {
  shop?: {
    shop_name?: string;
    url?: string;
  };
  listings?: {
    results?: EtsyListing[];
  };
}

const SHOP_URL = "https://www.etsy.com/shop/AGTStudioCo";

function getImage(listing: EtsyListing) {
  return (
    listing.images?.[0]?.url_570xN ||
    listing.images?.[0]?.url_760xN ||
    listing.images?.[0]?.url_fullxfull ||
    null
  );
}

function getPrice(listing: EtsyListing) {
  const amount = listing.price?.amount;
  const divisor = listing.price?.divisor || 100;

  if (typeof amount !== "number") return null;

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: listing.price?.currency_code || "TRY",
  }).format(amount / divisor);
}

export default function EtsyStore() {
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [shopUrl, setShopUrl] = useState(SHOP_URL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/etsy/listings?state=active&limit=50&offset=0")
      .then((response) => {
        if (!response.ok) throw new Error("Etsy ürünleri alınamadı");
        return response.json() as Promise<EtsyResponse>;
      })
      .then((data) => {
        if (cancelled) return;

        const results = data.listings?.results || [];
        setListings(results);
        if (data.shop?.url) setShopUrl(data.shop.url);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="etsy" className="etsy-store-section">
      <div className="etsy-store-header">
        <div>
          <p className="etsy-eyebrow">AGT STUDIO • ETSY</p>
          <h2 className="etsy-store-title">
            Etsy <span>Mağazamız</span>
          </h2>
          <p className="etsy-store-subtitle">
            AGTStudioCo mağazamızdaki dijital ürünleri keşfedin.
            Ürünü seçtiğinizde doğrudan Etsy üzerindeki ilan sayfasına yönlendirilirsiniz.
          </p>
        </div>

        <a
          className="etsy-shop-button"
          href={shopUrl || SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          🛍️ Mağazaya Git
        </a>
      </div>

      {loading ? (
        <div className="etsy-store-state">Etsy ürünleri yükleniyor...</div>
      ) : listings.length === 0 ? (
        <div className="etsy-store-state">
          <p>Ürünler şu anda yüklenemedi.</p>
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">
            Etsy mağazasını aç →
          </a>
        </div>
      ) : (
        <div className="etsy-products-grid">
          {listings.map((listing) => {
            const image = getImage(listing);
            const price = getPrice(listing);
            const listingUrl =
              listing.url ||
              `https://www.etsy.com/listing/${listing.listing_id}`;

            return (
              <a
                className="etsy-product-card"
                key={listing.listing_id}
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="etsy-product-image-wrap">
                  {image ? (
                    <img
                      src={image}
                      alt={listing.title}
                      className="etsy-product-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="etsy-product-placeholder">🛍️</div>
                  )}
                </div>

                <div className="etsy-product-content">
                  <h3>{listing.title}</h3>
                  {price && <strong>{price}</strong>}
                  <span>🛒 Etsy'de İncele →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <div className="etsy-store-footer">
        <a
          href={shopUrl || SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Tüm ürünleri Etsy mağazasında gör →
        </a>
      </div>
    </section>
  );
}
