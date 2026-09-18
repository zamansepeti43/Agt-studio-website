import logo from "../assets/agt-logo.png";
import { useLanguage } from "../i18n/LanguageContext";

export default function Hero() {
  const { language, t } = useLanguage();

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
            <a href="#etsy" className="hero-button hero-button-primary">{t("heroProductsCta")}</a>
            <a href="#services" className="hero-button hero-button-secondary">{t("discoverServices")}</a>
          </div>

          <div className="hero-points">
            <span>✓ {t("heroPointProducts")}</span>
            <span>✓ {t("heroPointAI")}</span>
            <span>✓ {t("heroPointWeb")}</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-logo-shell">
            <div className="hero-logo-ring" />
            <img src={logo} alt="" className="hero-logo" />
          </div>
          <div className="hero-visual-card">
            <span>{t("heroVisualLabel")}</span>
            <strong>{t("heroVisualTitle")}</strong>
            <small>{t("heroVisualText")}</small>
          </div>
        </div>
      </div>
    </section>
  );
}