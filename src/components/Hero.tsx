import { useEffect, useState } from "react";
import logo from "../assets/agt-logo.png";
import { useLanguage } from "../i18n/LanguageContext";

export default function Hero() {
  const { language, t } = useLanguage();
  const texts = language === "tr"
    ? ["Logo Tasarımı","Sosyal Medya Tasarımı","Kartvizit Tasarımı","Menü Tasarımı","Web Tasarımı","Yapay Zekâ Çözümleri"]
    : ["Logo Design","Social Media Design","Business Card Design","Menu Design","Web Design","AI Solutions"];
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [language]);
  useEffect(() => { const timer=setInterval(()=>setIndex(prev=>(prev+1)%texts.length),2500); return()=>clearInterval(timer); }, [language, texts.length]);
  return <section id="hero" className="hero">
    <img src={logo} alt="AGT Studio" className="hero-logo" />
    <h1 className="animated-title">{texts[index]}</h1>
    <p className="animated-subtitle">{t("digitalSolutions")}</p>
    <div className="hero-line"></div>
    <a href="#services" className="hero-button">{t("discoverServices")}</a>
  </section>;
}