import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'
import ServicePage from './components/ServicePage.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

const servicePaths = [
  '/logo-tasarimi',
  '/sosyal-medya-tasarimi',
  '/web-tasarim',
  '/menu-tasarimi',
  '/kartvizit-tasarimi',
  '/yapay-zeka-cozumleri',
] as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        {servicePaths.map((path) => (
          <Route key={path} path={path} element={<ServicePage />} />
        ))}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
