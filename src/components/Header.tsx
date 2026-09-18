import {
  FaInstagram, FaTiktok, FaWhatsapp, FaEnvelope, FaHome, FaPalette,
  FaImage, FaInfoCircle, FaPhone, FaShoppingBag, FaGlobe, FaBars,
} from "react-icons/fa";
import { useState } from "react";
import circleLogo from "../assets/favicon.png";
import { useLanguage } from "../i18n/LanguageContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const closeMenu = () => setOpen(false);
  const toggleLanguage = () => setLanguage(language === "tr" ? "en" : "tr");

  return (
    <>
      <header className="header">
        <button className="mobile-menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
          <FaBars />
        </button>

        <a className="brand" href="#hero" aria-label="AGT Studio">
          <img src={circleLogo} className="header-logo" alt="AGT Studio" />
          <div className="brand-text"><span className="gold">AGT</span><span className="white">STUDIO</span></div>
        </a>

        <nav className="desktop-nav">
          <a href="#hero">{t("home")}</a>
          <a href="#etsy">{t("etsy")}</a>
          <a href="#services">{t("services")}</a>
          <a href="#portfolio">{t("portfolio")}</a>
          <a href="#about">{t("about")}</a>
          <a href="#contact">{t("contact")}</a>
        </nav>

        <div className="header-actions">
          <button className="language-button" onClick={toggleLanguage} aria-label={language === "tr" ? "Switch to English" : "Türkçeye geç"}>
            <FaGlobe /> {language === "tr" ? "EN" : "TR"}
          </button>
          <a className="contact-button" href="#contact">{t("contact")}</a>
        </div>
      </header>

      <div className={`sidebar-overlay ${open ? "active" : ""}`} onClick={closeMenu} />
      <aside className={`sidebar ${open ? "active" : ""}`}>
        <div className="sidebar-top">
          <img src={circleLogo} className="sidebar-logo" alt="AGT Studio" />
          <h2>AGT Studio</h2>
          <button className="close-button" onClick={closeMenu}>✕</button>
        </div>

        <div className="socials">
          <a href="#hero" onClick={closeMenu}><FaHome />{t("home")}</a>
          <a href="#etsy" onClick={closeMenu}><FaShoppingBag />{t("etsy")}</a>
          <a href="#services" onClick={closeMenu}><FaPalette />{t("services")}</a>
          <a href="#portfolio" onClick={closeMenu}><FaImage />{t("portfolio")}</a>
          <a href="#about" onClick={closeMenu}><FaInfoCircle />{t("about")}</a>
          <a href="#contact" onClick={closeMenu}><FaPhone />{t("contact")}</a>
          <hr />
          <button className="language-menu-button" onClick={toggleLanguage}><FaGlobe /> {language === "tr" ? "English" : "Türkçe"}</button>
          <a href="https://www.instagram.com/agtstudio.tr" target="_blank" rel="noreferrer"><FaInstagram />{t("instagram")}</a>
          <a href="https://www.tiktok.com/@agtstudio.tr" target="_blank" rel="noreferrer"><FaTiktok />{t("tiktok")}</a>
          <a href="mailto:agtstudyo@gmail.com"><FaEnvelope />{t("gmail")}</a>
          <a href="https://wa.me/905343767308" target="_blank" rel="noreferrer"><FaWhatsapp />{t("whatsapp")}</a>
        </div>
      </aside>
    </>
  );
}