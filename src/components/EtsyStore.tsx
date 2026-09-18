import { useEffect, useState } from "react";
import "./EtsyStore.css";
import { useLanguage } from "../i18n/LanguageContext";

interface EtsyImage { url_570xN?:string; url_760xN?:string; url_fullxfull?:string; }
interface EtsyListing { listing_id:number; title:string; url?:string; price?:{amount?:number;divisor?:number;currency_code?:string}; images?:EtsyImage[]; }
interface EtsyResponse { shop?:{shop_name?:string;url?:string}; listings?:{results?:EtsyListing[]}; }
const SHOP_URL="https://www.etsy.com/shop/AGTStudioCo";
const englishTitles:Record<number,string>={
4574820715:"Barbershop Management Software | Appointment, CRM & Inventory | Windows App",
4577542450:"Etsy Product Idea Finder | Digital Product Research Tool | Etsy Seller Tool",
4574138529:"Pressure Washing Business Spreadsheet | Pricing Calculator | Job Tracker & Profit Dashboard",
4573839919:"Etsy Profit Calculator | Etsy Fee Calculator | Pricing Spreadsheet | Profit Tracker",
4573718071:"Etsy Product Research Tool | Digital Product Ideas | Competitor Analysis Spreadsheet",
4575285227:"Etsy Seller Customer Support Tool | AI Reply Prompts | Buyer Response Templates | Excel",
4574114283:"Bakery Pricing Calculator | Recipe Cost Spreadsheet | Profit Calculator | Order Tracker",
4576154195:"AI API Finder Pro | Free AI APIs | AI Developer Tool | Android App",
4576139109:"Android APK Builder | ZIP to APK | HTML to APK | No Code App Maker",
4576174491:"AI API Finder | Free AI APIs | AI Developer Tool | Android App",
4576184560:"Android APK Builder | ZIP to APK | Windows Software"
};
const turkishTitles:Record<number,string>={
4574820715:"Berber Dükkanı Yönetim Yazılımı | Randevu, Müşteri ve Stok | Windows",
4577542450:"Etsy Ürün Fikri Bulucu | Dijital Ürün Araştırma Aracı | Etsy Satıcı Aracı",
4574138529:"Basınçlı Yıkama İşletmesi Excel | Fiyat Hesaplama | İş ve Kâr Takibi",
4573839919:"Etsy Kâr Hesaplayıcı | Etsy Komisyon Hesaplayıcı | Fiyatlandırma Excel",
4573718071:"Etsy Ürün Araştırma Aracı | Dijital Ürün Fikirleri | Rakip Analizi Excel",
4575285227:"Etsy Satıcı Müşteri Destek Aracı | Yapay Zekâ Yanıtları | Excel",
4574114283:"Pastane Fiyat Hesaplayıcı | Reçete Maliyeti | Kâr ve Sipariş Takibi",
4576154195:"Yapay Zekâ API Bulucu Pro | Ücretsiz AI API'ler | Geliştirici Aracı",
4576139109:"Android APK Oluşturucu | ZIP'ten APK | HTML'den Uygulama | Kodsuz",
4576174491:"Yapay Zekâ API Bulucu | Ücretsiz AI API'ler | Geliştirici Aracı",
4576184560:"Android APK Oluşturucu | ZIP'ten APK | Windows Yazılımı"
};
function getImage(l:EtsyListing){return l.images?.[0]?.url_570xN||l.images?.[0]?.url_760xN||l.images?.[0]?.url_fullxfull||null}
function getPrice(l:EtsyListing){const amount=l.price?.amount;if(typeof amount!=="number")return null;return new Intl.NumberFormat("tr-TR",{style:"currency",currency:l.price?.currency_code||"TRY"}).format(amount/(l.price?.divisor||100))}
export default function EtsyStore(){
 const {language,t}=useLanguage(); const [listings,setListings]=useState<EtsyListing[]>([]); const [shopUrl,setShopUrl]=useState(SHOP_URL); const [loading,setLoading]=useState(true);
 useEffect(()=>{let cancelled=false;fetch("/api/etsy/listings?state=active&limit=50&offset=0").then(r=>{if(!r.ok)throw new Error("Etsy products unavailable");return r.json() as Promise<EtsyResponse>}).then(data=>{if(cancelled)return;setListings(data.listings?.results||[]);if(data.shop?.url)setShopUrl(data.shop.url)}).catch(()=>{if(!cancelled)setListings([])}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[]);
 return <section id="etsy" className="etsy-store-section">
  <div className="etsy-store-header"><div><p className="etsy-eyebrow">{t("etsyEyebrow")}</p><h2 className="etsy-store-title"><span>{t("etsyTitle")}</span></h2><p className="etsy-store-subtitle">{t("etsySubtitle")}</p></div><a className="etsy-shop-button" href={shopUrl} target="_blank" rel="noopener noreferrer">{t("goShop")}</a></div>
  {loading?<div className="etsy-store-state">{t("loadingProducts")}</div>:listings.length===0?<div className="etsy-store-state"><div><p>{t("productsUnavailable")}</p><a href={SHOP_URL} target="_blank" rel="noopener noreferrer">{t("openEtsy")}</a></div></div>:<div className="etsy-products-grid">{listings.map(l=>{const image=getImage(l);const price=getPrice(l);const url=l.url||`https://www.etsy.com/listing/${l.listing_id}`;const title=(language==="tr"?turkishTitles:englishTitles)[l.listing_id]||l.title;return <a className="etsy-product-card" key={l.listing_id} href={url} target="_blank" rel="noopener noreferrer"><div className="etsy-product-image-wrap">{image?<img src={image} alt={title} className="etsy-product-image" loading="lazy"/>:<div className="etsy-product-placeholder">🛍️</div>}</div><div className="etsy-product-content"><h3>{title}</h3>{price&&<strong>{price}</strong>}<span>{t("viewOnEtsy")}</span></div></a>})}</div>}
  <div className="etsy-store-footer"><a href={shopUrl} target="_blank" rel="noopener noreferrer">{t("allProducts")}</a></div>
 </section>;
}