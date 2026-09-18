import { useLanguage } from "../i18n/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="hero">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />

      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-eyebrow">{t("heroEyebrow")}</span>
          <h1>
            {t("heroTitle")} <span>{t("heroTitleAccent")}</span>
          </h1>
          <p className="hero-description">{t("heroDescription")}</p>

          <div className="hero-actions">
            <a href="#etsy" className="hero-button hero-button-primary">{t("heroProductsCta")} <span>→</span></a>
            <a href="#services" className="hero-button hero-button-secondary">{t("discoverServices")} <span>→</span></a>
          </div>

          <div className="hero-points">
            <span>✓ {t("heroPointProducts")}</span>
            <span>✓ {t("heroPointAI")}</span>
            <span>✓ {t("heroPointWeb")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
