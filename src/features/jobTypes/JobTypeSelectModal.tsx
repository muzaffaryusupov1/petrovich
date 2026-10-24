import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllJobTypes } from './loader';
import type { JobTypeDef } from '../../types';

interface JobTypeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobTypeSelectModal({ isOpen, onClose }: JobTypeSelectModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language as 'uz' | 'ru';
  const jobTypes = getAllJobTypes();

  if (!isOpen) return null;

  const handleSelect = (jt: JobTypeDef) => {
    onClose();
    navigate(`/new?jobType=${jt.id}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">🏗️ {t('jobType.selectTitle')}</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
              {t('jobType.selectSubtitle')}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobTypes.map((jt) => (
            <div
              key={jt.id}
              onClick={() => handleSelect(jt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--color-border-light)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px var(--color-shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-light)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontSize: '1.8rem',
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {jt.icon || '🛠️'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                  {lang === 'uz' ? jt.name.uz : jt.name.ru}
                </div>
                {jt.description && (
                  <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: 2, lineHeight: 1.3 }}>
                    {lang === 'uz' ? jt.description.uz : jt.description.ru}
                  </div>
                )}
              </div>

              <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>➔</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
