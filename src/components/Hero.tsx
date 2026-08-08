import { useEffect, useState } from "react";
import logo from "../assets/agt-logo.png";

export default function Hero() {
  const texts = [
    "Logo Tasarımı",
    "Sosyal Medya Tasarımı",
    "Kartvizit Tasarımı",
    "Menü Tasarımı",
    "Web Tasarımı",
    "Yapay Zekâ Çözümleri",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="hero">
      <img src={logo} alt="AGT Studio" className="hero-logo" />

      <h1 className="animated-title">{texts[index]}</h1>

      <p className="animated-subtitle">
        Dijital Tasarım ve Yapay Zekâ Çözümleri
      </p>

      <div className="hero-line"></div>

      <a href="#services" className="hero-button">
        Hizmetlerimizi Keşfet
      </a>
    </section>
  );
}