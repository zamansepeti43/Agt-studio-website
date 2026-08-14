import ProjectRequestForm from "./ProjectRequestForm";

export default function Contact() {
  return (
    <section className="section" id="contact">
      <h2 className="section-title">İletişim</h2>

      <ProjectRequestForm />

      <div className="card contact-details-card">
        <p>📧 E-posta: agtstudyo@gmail.com</p>

        <br />

        <p>📱 Instagram: @agtstudio.tr</p>

        <br />

        <p>🎵 TikTok: @agtstudio.tr</p>

        <br />

        <p>💬 WhatsApp: 0534 376 73 08</p>

        <br />

        <a
          href="https://wa.me/905343767308"
          className="hero-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp'tan Ulaşın
        </a>
      </div>
    </section>
  );
}
