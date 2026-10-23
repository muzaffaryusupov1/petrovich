import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProfileModal from '../features/profile/ProfileModal';
import { getUserProfile } from '../lib/profile';

export default function AppHeader() {
  const { t, i18n } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(getUserProfile);

  const toggleLang = () => {
    const next = i18n.language === 'uz' ? 'ru' : 'uz';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-header__logo">
          <span className="app-header__logo-icon">🏗️</span>
          {t('app.title')}
        </Link>
        <div className="app-header__actions">
          <button
            className="profile-btn"
            onClick={() => setIsProfileOpen(true)}
            aria-label="Usta profili"
            title={profile.name || t('profile.title')}
          >
            <span>👷</span>
            <span>{profile.name ? profile.name.split(' ')[0] : t('profile.button')}</span>
          </button>
          <button className="lang-btn" onClick={toggleLang} aria-label="Change language">
            {i18n.language === 'uz' ? 'RU' : 'UZ'}
          </button>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSaved={(updated) => setProfile(updated)}
      />
    </>
  );
}
