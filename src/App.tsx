import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import AppHeader from './app/AppHeader';
import EstimateListPage from './features/estimates/EstimateListPage';
import EstimateFormPage from './features/estimates/EstimateFormPage';
import EstimateDetailPage from './features/estimates/EstimateDetailPage';

export default function App() {
  const { t } = useTranslation();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="page">
        <Routes>
          <Route path="/" element={<EstimateListPage />} />
          <Route path="/new" element={<EstimateFormPage />} />
          <Route path="/estimate/:id" element={<EstimateDetailPage />} />
          <Route path="/estimate/:id/edit" element={<EstimateFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {needRefresh && (
        <div className="pwa-toast">
          <span>{t('pwa.updateAvailable')}</span>
          <button className="btn btn-accent btn-sm" onClick={() => updateServiceWorker(true)}>
            {t('pwa.reload')}
          </button>
        </div>
      )}
    </div>
  );
}
