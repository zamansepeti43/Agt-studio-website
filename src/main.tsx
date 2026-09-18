import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'
import ServicePage from './components/ServicePage.tsx'
import DigitalProductPage from './components/DigitalProductPage.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

const servicePaths=['/logo-tasarimi','/sosyal-medya-tasarimi','/web-tasarim','/menu-tasarimi','/kartvizit-tasarimi','/yapay-zeka-cozumleri']
const productPaths=['/etsy-profit-calculator','/etsy-product-research-tool','/etsy-product-idea-finder','/pressure-washing-pricing-calculator','/bakery-pricing-calculator','/etsy-customer-support-tool','/ai-api-finder-pro','/ai-api-finder-basic','/no-code-apk-builder','/windows-apk-builder','/barbershop-management-software']
createRoot(document.getElementById('root')!).render(<StrictMode><LanguageProvider><BrowserRouter><Routes><Route path="/admin/*" element={<AdminApp/>}/>{servicePaths.map(path=><Route key={path} path={path} element={<ServicePage/>}/>)}{productPaths.map(path=><Route key={path} path={path} element={<DigitalProductPage/>}/>)}<Route path="/*" element={<App/>}/></Routes></BrowserRouter></LanguageProvider></StrictMode>)