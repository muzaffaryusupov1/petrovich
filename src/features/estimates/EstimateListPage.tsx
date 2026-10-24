import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllEstimates, deleteEstimate, duplicateEstimate } from '../../lib/db';
import { computeEstimate, formatUZS } from '../../lib/calc';
import { getJobType } from '../jobTypes/loader';
import JobTypeSelectModal from '../jobTypes/JobTypeSelectModal';
import type { Estimate } from '../../types';

export default function EstimateListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language as 'uz' | 'ru';

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJobSelectOpen, setIsJobSelectOpen] = useState(false);

  const load = async () => {
    const all = await getAllEstimates();
    setEstimates(all.map(computeEstimate));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t('estimate.confirmDelete'))) return;
    await deleteEstimate(id);
    load();
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newId = await duplicateEstimate(id);
    navigate(`/estimate/${newId}`);
  };

  if (loading) return <div className="empty-state"><span>⏳</span></div>;

  return (
    <div>
      <div className="section-header">
        <h1>{t('nav.estimates')}</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsJobSelectOpen(true)}
        >
          ＋ {t('home.newEstimate')}
        </button>
      </div>

      {estimates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">{t('home.empty')}</div>
          <div className="empty-state__hint">{t('home.emptyHint')}</div>
          <button
            className="btn btn-primary mt-12"
            onClick={() => setIsJobSelectOpen(true)}
          >
            ＋ {t('home.newEstimate')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 }}>
          {estimates.map((est) => {
            const jobType = getJobType(est.jobTypeId);
            return (
              <div key={est.id} style={{ position: 'relative' }}>
                <Link to={`/estimate/${est.id}`} className="estimate-card">
                  <div className="estimate-card__icon" style={{ fontSize: '1.5rem' }}>
                    {jobType?.icon || '📋'}
                  </div>
                  <div className="estimate-card__body">
                    <div className="estimate-card__title">
                      {est.clientName || t('estimate.noClient')}
                    </div>
                    <div className="estimate-card__meta">
                      {jobType && (
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {lang === 'uz' ? jobType.name.uz : jobType.name.ru} ·{' '}
                        </span>
                      )}
                      {est.address && <span>{est.address} · </span>}
                      {new Date(est.createdAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU')}
                      {' · '}
                      {est.rooms.length} {lang === 'uz' ? 'xona' : 'комн.'}
                    </div>
                  </div>
                  <div className="estimate-card__total">
                    {formatUZS(est.grandTotal ?? 0)}
                  </div>
                </Link>

                {/* Quick action buttons */}
                <div style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 4,
                  paddingLeft: 4,
                }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleDuplicate(e, est.id)}
                    title={t('estimate.duplicate')}
                  >
                    📄 {t('estimate.duplicate')}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => handleDelete(e, est.id)}
                    title={t('estimate.delete')}
                  >
                    🗑 {t('estimate.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB button */}
      <button
        className="fab"
        onClick={() => setIsJobSelectOpen(true)}
        aria-label="New Estimate"
      >
        ＋
      </button>

      {/* Job Type Selector Modal */}
      <JobTypeSelectModal
        isOpen={isJobSelectOpen}
        onClose={() => setIsJobSelectOpen(false)}
      />
    </div>
  );
}
