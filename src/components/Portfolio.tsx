import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

interface PortfolioItem { id:string; title:string; description:string; image_url:string|null; category:string; }
const CATEGORY_DEFS=[
 {key:'Logo',icon:'🎨',title:{tr:'Logo Tasarımı',en:'Logo Design'},description:{tr:'İşletmenizi öne çıkaracak modern, kurumsal ve özgün logo tasarımları hazırlıyoruz.',en:'Modern, professional and original logo designs that make your business stand out.'}},
 {key:'Menü',icon:'📋',title:{tr:'Menü Tasarımı',en:'Menu Design'},description:{tr:'Restoranlar ve kafeler için özgün, şık menü tasarımları oluşturuyoruz.',en:'Original and stylish menu designs for restaurants and cafés.'}},
 {key:'Kartvizit',icon:'💼',title:{tr:'Kartvizit Tasarımı',en:'Business Card Design'},description:{tr:'Markanıza özel, profesyonel ve baskıya hazır kartvizit tasarımları oluşturuyoruz.',en:'Professional, print-ready business card designs tailored to your brand.'}},
 {key:'Sosyal Medya',icon:'📱',title:{tr:'Sosyal Medya Tasarımı',en:'Social Media Design'},description:{tr:'Instagram, TikTok ve diğer platformlar için dikkat çekici içerik tasarımları üretiyoruz.',en:'Engaging content designs for Instagram, TikTok and other platforms.'}},
 {key:'Web',icon:'🌐',title:{tr:'Web Tasarımı',en:'Web Design'},description:{tr:'Mobil uyumlu, hızlı ve modern internet siteleri geliştiriyoruz.',en:'Fast, modern and mobile-friendly websites.'}},
 {key:'Diğer',icon:'🤖',title:{tr:'Diğer Çalışmalar',en:'Other Work'},description:{tr:'Yapay zekâ destekli otomasyon, içerik üretimi ve dijital dönüşüm çözümleri sunuyoruz.',en:'AI-powered automation, content creation and digital transformation solutions.'}}
];
const normalize=(cat:string)=>CATEGORY_DEFS.some(c=>c.key===cat)?cat:'Diğer';

export default function Portfolio(){
 const {language,t}=useLanguage(); const [items,setItems]=useState<PortfolioItem[]>([]); const [openKey,setOpenKey]=useState<string|null>(null); const [lightbox,setLightbox]=useState<{url:string;title:string}|null>(null);
 useEffect(()=>{supabase.from('portfolio').select('id,title,description,image_url,category').eq('active',true).order('order',{ascending:true}).then(({data})=>{if(data)setItems(data as PortfolioItem[]);});},[]);
 const closeLightbox=useCallback(()=>{setLightbox(null);document.body.style.overflow='';},[]);
 const openLightbox=useCallback((url:string,title:string)=>{setLightbox({url,title});document.body.style.overflow='hidden';},[]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')closeLightbox()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[closeLightbox]);
 const populatedKeys=new Set(items.map(i=>normalize(i.category))); const displayCats=items.length===0?CATEGORY_DEFS:CATEGORY_DEFS.filter(c=>populatedKeys.has(c.key));
 return <section id="portfolio" className="portfolio-section"><h2>{t("portfolioTitle")}</h2><div className="cards">
 {displayCats.map(cat=>{const catItems=items.filter(i=>normalize(i.category)===cat.key);const isOpen=openKey===cat.key;return <div key={cat.key} className={`card portfolio-accordion${isOpen?' portfolio-accordion--open':''}`} onClick={()=>setOpenKey(prev=>prev===cat.key?null:cat.key)}>
 <span className="portfolio-chevron">{isOpen?'▲':'▼'}</span><div className="card-icon">{cat.icon}</div><h3>{cat.title[language]}</h3><p>{cat.description[language]}</p>
 {isOpen&&<div className="portfolio-expand" onClick={e=>e.stopPropagation()}>{catItems.length===0?<p style={{color:'#666',fontSize:13}}>{t("noContent")}</p>:<div className="portfolio-expand-grid">{catItems.map(item=><div key={item.id} className="portfolio-expand-item">{item.image_url?<img src={item.image_url} alt={item.title} onClick={e=>{e.stopPropagation();openLightbox(item.image_url!,item.title)}} className="portfolio-thumb"/>:<div className="portfolio-expand-placeholder">{cat.icon}</div>}<strong>{item.title}</strong>{item.description&&<p>{item.description}</p>}</div>)}</div>}</div>}
 </div>})}</div>
 {lightbox&&<div className="portfolio-lightbox" onClick={closeLightbox}><button className="portfolio-lightbox-close" onClick={closeLightbox} aria-label="Close">✕</button><img src={lightbox.url} alt={lightbox.title} onClick={e=>e.stopPropagation()}/></div>}
 </section>;
}