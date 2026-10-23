import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserProfile, saveUserProfile } from '../../lib/profile';
import type { UserProfile } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (profile: UserProfile) => void;
}

export default function ProfileModal({ isOpen, onClose, onSaved }: ProfileModalProps) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>({ name: '', phone: '', title: '' });

  useEffect(() => {
    if (isOpen) {
      setProfile(getUserProfile());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(profile);
    if (onSaved) onSaved(profile);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">👷 {t('profile.title')}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-hint mb-12">
              {t('profile.hint')}
            </div>

            <div className="form-group">
              <label className="form-label">{t('profile.nameLabel')}</label>
              <input
                className="form-input"
                placeholder={t('profile.namePlaceholder')}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-group mt-12">
              <label className="form-label">{t('profile.phoneLabel')}</label>
              <input
                className="form-input"
                type="tel"
                placeholder={t('profile.phonePlaceholder')}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="form-group mt-12">
              <label className="form-label">{t('profile.specialtyLabel')}</label>
              <input
                className="form-input"
                placeholder={t('profile.specialtyPlaceholder')}
                value={profile.title || ''}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              {t('profile.cancel')}
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              💾 {t('profile.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
