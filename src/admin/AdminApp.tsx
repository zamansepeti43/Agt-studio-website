import './admin.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminGuard from './components/AdminGuard';
import Dashboard from './pages/Dashboard';
import SectionManager from './pages/SectionManager';
import ServicesManager from './pages/ServicesManager';
import JobsManager from './pages/JobsManager';
import PackagesManager from './pages/PackagesManager';
import PortfolioManager from './pages/PortfolioManager';
import SiteSettings from './pages/SiteSettings';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<Dashboard />} />
        <Route path="sections"  element={<SectionManager />} />
        <Route path="services"  element={<ServicesManager />} />
        <Route path="jobs"      element={<JobsManager />} />
        <Route path="packages"  element={<PackagesManager />} />
        <Route path="portfolio" element={<PortfolioManager />} />
        <Route path="settings"  element={<SiteSettings />} />
        <Route path="*"         element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
