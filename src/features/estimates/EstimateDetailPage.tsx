import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEstimate, deleteEstimate } from '../../lib/db';
import { computeEstimate, formatUZS } from '../../lib/calc';
import { generatePDF } from '../../lib/pdf';
import { getUserProfile } from '../../lib/profile';
import { getJobType } from '../jobTypes/loader';
import { shareEstimate, openTelegramShare, buildEstimateShareText } from '../../lib/share';
import type { Estimate, UserProfile } from '../../types';

export default function EstimateDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = i18n.language as 'uz' | 'ru';

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEstimate(id).then((est) => {
      if (est) setEstimate(computeEstimate(est));
      else navigate('/', { replace: true });
    });
    setProfile(getUserProfile());
  }, [id, navigate]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(t('estimate.confirmDelete'))) return;
    await deleteEstimate(id);
    navigate('/');
  };

  const handleExportPDF = async () => {
    if (!estimate) return;
    setExporting(true);
    try {
      await generatePDF(estimate, lang, profile);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!estimate) return;
    setExporting(true);
    try {
      const res = await shareEstimate(estimate, lang);
      if (res === 'fallback') {
        // Fallback to copying text
        await handleCopyText();
      }
    } finally {
      setExporting(false);
    }
  };

  const handleTelegramShare = () => {
    if (!estimate) return;
    openTelegramShare(estimate, lang);
  };

  const handleCopyText = async () => {
    if (!estimate) return;
    const text = buildEstimateShareText(estimate, lang, profile);
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('share.copiedToast'));
    } catch {
      showToast(t('share.copiedToast'));
    }
  };

  if (!estimate) return <div className="empty-state"><span>⏳</span></div>;

  const totalArea = (estimate.totalWallArea ?? 0) + (estimate.totalCeilingArea ?? 0);
  const jobType = getJobType(estimate.jobTypeId);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <span>✅</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← {t('estimate.back')}
      </button>

      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>
              {estimate.clientName || t('estimate.noClient')}
            </h1>
            {estimate.address && (
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>📍 {estimate.address}</div>
            )}
            {profile.name && (
              <div className="text-primary fw-bold" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                👷 {t('profile.title')}: {profile.name} {profile.phone ? `(${profile.phone})` : ''}
              </div>
            )}
            {jobType && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-bg)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', marginTop: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                <span>{jobType.icon || '🏗️'}</span>
                <span>{lang === 'uz' ? jobType.name.uz : jobType.name.ru}</span>
              </div>
            )}
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {t('estimate.createdAt')}: {new Date(estimate.createdAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU')}
            </div>
          </div>
          <Link to={`/estimate/${estimate.id}/edit`} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
            ✏️ {t('estimate.edit')}
          </Link>
        </div>
      </div>

      {/* Rooms summary */}
      <div className="card mt-12">
        <h2 style={{ marginBottom: 12 }}>🚪 {t('estimate.rooms')}</h2>
        {estimate.rooms.map((room, i) => (
          <div key={room.id} style={{
            padding: '10px 0',
            borderBottom: i < estimate.rooms.length - 1 ? '1px solid var(--color-border-light)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {room.name || `${t('room.title')} ${i + 1}`}
              </div>
              <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                {room.length}×{room.width}×{room.height}m
                {' · '}
                {room.doors} {lang === 'uz' ? 'eshik' : 'дв.'}
                {', '}
                {room.windows} {lang === 'uz' ? 'deraza' : 'окн.'}
                {room.includeCeiling ? (lang === 'uz' ? ' · shift ✓' : ' · потолок ✓') : ''}
              </div>
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '2px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600 }}>{t('estimate.totalArea')}</span>
          <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
            {totalArea.toFixed(2)} m²
          </span>
        </div>
      </div>

      {/* Materials */}
      <div className="card mt-12">
        <h2 style={{ marginBottom: 12 }}>🧱 {t('estimate.materials')}</h2>
        {estimate.materialLines.map((line) => (
          <div key={line.materialId} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid var(--color-border-light)',
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{lang === 'uz' ? line.name.uz : line.name.ru}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                {line.packages} × {line.packageSize} {line.packageUnit}
                {' @ '}
                {formatUZS(line.pricePerPackage)}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', textAlign: 'right' }}>
              {formatUZS(line.totalCost ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Labor */}
      <div className="card mt-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>💪 {t('estimate.labor')}</div>
          <div className="text-muted" style={{ fontSize: '0.82rem' }}>
            {totalArea.toFixed(2)} m² × {formatUZS(estimate.laborPricePerM2)}/m²
          </div>
        </div>
        <div style={{ fontWeight: 700 }}>{formatUZS(estimate.totalLaborCost ?? 0)}</div>
      </div>

      {/* Grand total */}
      <div className="totals-box mt-12">
        <div className="totals-row">
          <span>{t('estimate.materials')}</span>
          <span className="fw-bold">{formatUZS(estimate.totalMaterialCost ?? 0)}</span>
        </div>
        <div className="totals-row">
          <span>{t('estimate.labor')}</span>
          <span className="fw-bold">{formatUZS(estimate.totalLaborCost ?? 0)}</span>
        </div>
        <div className="totals-grand">
          <span className="totals-grand__label">{t('estimate.total')}</span>
          <span className="totals-grand__value">{formatUZS(estimate.grandTotal ?? 0)}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer mt-12">{t('estimate.disclaimer')}</div>

      {/* Customer Send / Telegram Integration Section */}
      <div className="card mt-16" style={{ background: 'var(--color-primary-bg)', borderColor: 'var(--color-primary)' }}>
        <h3 style={{ marginBottom: 4, color: 'var(--color-primary-dark)' }}>
          📤 {t('share.sectionTitle')}
        </h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
          {t('share.sectionDesc')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            className="btn btn-telegram btn-sm"
            onClick={handleTelegramShare}
          >
            ✈️ {t('share.telegram')}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyText}
          >
            📋 {t('share.copyText')}
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            className="btn btn-primary btn-full"
            onClick={handleShare}
            disabled={exporting}
          >
            {exporting ? '⏳ ...' : `📤 ${t('share.nativeShare')}`}
          </button>
        </div>
      </div>

      {/* Export & Delete Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <button
          className="btn btn-outline btn-full"
          onClick={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? '⏳ ...' : `📄 ${t('share.downloadPdf')}`}
        </button>
        <button className="btn btn-danger btn-full" onClick={handleDelete}>
          🗑 {t('estimate.delete')}
        </button>
      </div>
    </div>
  );
}
