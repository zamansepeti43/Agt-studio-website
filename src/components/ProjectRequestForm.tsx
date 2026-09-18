import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./ProjectRequestForm.css";
import { useLanguage } from "../i18n/LanguageContext";

const serviceKeys = ["website","mobileApp","pwa","ecommerce","customSoftware","logoCorporate","other"];
const budgetKeys = ["undecided","under5","five15","fifteen30","thirty50","over50"];

export default function ProjectRequestForm(){
  const {t,language}=useLanguage();
  const [form,setForm]=useState({name:"",company:"",phone:"",email:"",service:"",budget:"",message:""});
  const [sending,setSending]=useState(false);
  const [status,setStatus]=useState<"idle"|"success"|"error">("idle");
  const update=(field:keyof typeof form,value:string)=>setForm(prev=>({...prev,[field]:value}));
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setSending(true);setStatus("idle");try{
    const serviceIndex=serviceKeys.indexOf(form.service);
    const budgetIndex=budgetKeys.indexOf(form.budget);
    const {error}=await supabase.from("project_requests").insert({
      name:form.name.trim(),company:form.company.trim()||null,phone:form.phone.trim(),email:form.email.trim()||null,
      service:serviceIndex>=0?serviceKeys[serviceIndex]:form.service,budget:budgetIndex>=0?budgetKeys[budgetIndex]:form.budget,message:form.message.trim()
    });
    if(error)throw error; setForm({name:"",company:"",phone:"",email:"",service:"",budget:"",message:""});setStatus("success");
  }catch(error){console.error("Project request submission failed:",error);setStatus("error")}finally{setSending(false)}};
  return <div className="project-request-card">
    <div className="project-request-heading"><span className="project-request-eyebrow">{t("tellProject")}</span><h3>{t("dreamProject")}</h3><p>{t("projectIntro")}</p></div>
    <form className="project-request-form" onSubmit={submit}>
      <div className="project-request-grid">
        <label>{t("fullName")} *<input required value={form.name} onChange={e=>update("name",e.target.value)} placeholder={language==="tr"?"Adınız Soyadınız":"Your full name"} autoComplete="name"/></label>
        <label>{t("company")}<input value={form.company} onChange={e=>update("company",e.target.value)} placeholder={language==="tr"?"Firma adınız":"Company name"} autoComplete="organization"/></label>
        <label>{t("phone")} *<input required type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="05XX XXX XX XX" autoComplete="tel"/></label>
        <label>{t("email")}<input type="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="example@mail.com" autoComplete="email"/></label>
        <label>{t("need")} *<select required value={form.service} onChange={e=>update("service",e.target.value)}><option value="">{t("select")}</option>{serviceKeys.map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>
        <label>{t("budget")}<select value={form.budget} onChange={e=>update("budget",e.target.value)}><option value="">{t("select")}</option>{budgetKeys.map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>
      </div>
      <label>{t("describe")} *<textarea required value={form.message} onChange={e=>update("message",e.target.value)} placeholder={t("describePlaceholder")} rows={6}/></label>
      <button className="project-request-submit" type="submit" disabled={sending}>{sending?t("sending"):t("requestQuote")}</button>
      {status==="success"&&<p className="project-request-success" role="status">{t("success")}</p>}
      {status==="error"&&<p className="project-request-error" role="alert">{t("error")}</p>}
    </form>
  </div>;
}