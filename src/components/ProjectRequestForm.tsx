import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./ProjectRequestForm.css";

const services = ["Web sitesi", "Mobil uygulama", "PWA", "E-ticaret", "Özel yazılım", "Logo / kurumsal tasarım", "Diğer"];
const budgets = ["Henüz karar vermedim", "5.000 TL altı", "5.000 – 15.000 TL", "15.000 – 30.000 TL", "30.000 – 50.000 TL", "50.000 TL+"];

export default function ProjectRequestForm() {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", service: "", budget: "", message: "" });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setStatus("idle");
    try {
      const { error } = await supabase.from("project_requests").insert({ name: form.name.trim(), company: form.company.trim() || null, phone: form.phone.trim(), email: form.email.trim() || null, service: form.service, budget: form.budget || null, message: form.message.trim() });
      if (error) throw error;
      setForm({ name: "", company: "", phone: "", email: "", service: "", budget: "", message: "" });
      setStatus("success");
    } catch (error) {
      console.error("Project request submission failed:", error);
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="project-request-card">
      <div className="project-request-heading">
        <span className="project-request-eyebrow">PROJENİZİ ANLATIN</span>
        <h3>Hayalinizdeki projeyi birlikte yapalım.</h3>
        <p>Ne yaptırmak istediğinizi anlatın. Talebinizi inceleyip size uygun çözüm ve teklif için dönüş yapalım.</p>
      </div>
      <form className="project-request-form" onSubmit={submit}>
        <div className="project-request-grid">
          <label>Ad Soyad *<input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Adınız Soyadınız" autoComplete="name" /></label>
          <label>İşletme / Firma<input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Firma adınız" autoComplete="organization" /></label>
          <label>Telefon / WhatsApp *<input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="05XX XXX XX XX" autoComplete="tel" /></label>
          <label>E-posta<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="ornek@mail.com" autoComplete="email" /></label>
          <label>İhtiyacınız nedir? *<select required value={form.service} onChange={(e) => update("service", e.target.value)}><option value="">Seçiniz</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
          <label>Tahmini bütçe<select value={form.budget} onChange={(e) => update("budget", e.target.value)}><option value="">Seçiniz</option>{budgets.map((budget) => <option key={budget} value={budget}>{budget}</option>)}</select></label>
        </div>
        <label>Projenizi anlatın *<textarea required value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Ne yaptırmak istiyorsunuz? İstediğiniz özellikleri mümkün olduğunca anlatın." rows={6} /></label>
        <button className="project-request-submit" type="submit" disabled={sending}>{sending ? "Gönderiliyor..." : "Teklif Talep Et"}</button>
        {status === "success" && <p className="project-request-success" role="status">Talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.</p>}
        {status === "error" && <p className="project-request-error" role="alert">Talep gönderilemedi. Lütfen tekrar deneyin veya WhatsApp üzerinden bize ulaşın.</p>}
      </form>
    </div>
  );
}
