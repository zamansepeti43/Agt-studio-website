import {
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaEnvelope,
  FaHome,
  FaPalette,
  FaImage,
  FaInfoCircle,
  FaPhone,
} from "react-icons/fa";

import { useState } from "react";
import circleLogo from "../assets/favicon.png";

export default function Header() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className="header">
        <div className="brand" onClick={() => setOpen(true)}>
          <img
            src={circleLogo}
            className="header-logo"
            alt="AGT Studio"
          />

          <div className="brand-text">
            <span className="gold">AGT</span>
            <span className="white">STUDIO</span>
          </div>
        </div>

        <nav className="desktop-nav">
          <a href="#hero">Ana Sayfa</a>
          <a href="#services">Hizmetler</a>
          <a href="#portfolio">Portföy</a>
          <a href="#about">Hakkımızda</a>
          <a href="#contact">İletişim</a>
        </nav>

        <button className="contact-button">İletişim</button>
      </header>

      <div
        className={`sidebar-overlay ${open ? "active" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`sidebar ${open ? "active" : ""}`}>
        <div className="sidebar-top">
          <img
            src={circleLogo}
            className="sidebar-logo"
            alt="AGT Studio"
          />

          <h2>AGT Studio</h2>

          <button className="close-button" onClick={closeMenu}>
            ✕
          </button>
        </div>

        <div className="socials">
          <a href="#hero" onClick={closeMenu}>
            <FaHome />
            Ana Sayfa
          </a>

          <a href="#services" onClick={closeMenu}>
            <FaPalette />
            Hizmetler
          </a>

          <a href="#portfolio" onClick={closeMenu}>
            <FaImage />
            Portföy
          </a>

          <a href="#about" onClick={closeMenu}>
            <FaInfoCircle />
            Hakkımızda
          </a>

          <a href="#contact" onClick={closeMenu}>
            <FaPhone />
            İletişim
          </a>

          <hr />

          <a
            href="https://www.instagram.com/agtstudio.tr"
            target="_blank"
            rel="noreferrer"
          >
            <FaInstagram />
            Instagram
          </a>

          <a
            href="https://www.tiktok.com/@agtstudio.tr"
            target="_blank"
            rel="noreferrer"
          >
            <FaTiktok />
            TikTok
          </a>

          <a href="mailto:agtstudyo@gmail.com">
            <FaEnvelope />
            Gmail
          </a>

          <a
            href="https://wa.me/905343767308"
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp />
            WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}