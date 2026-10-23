import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AppHeader() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLang = () => {
    const next = i18n.language === 'uz' ? 'ru' : 'uz';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <header className="app-header">
      <Link to="/" className="app-header__logo">
        <span className="app-header__logo-icon">🏗️</span>
        {t('app.title')}
      </Link>
      <div className="app-header__actions">
        <button className="lang-btn" onClick={toggleLang} aria-label="Change language">
          {i18n.language === 'uz' ? 'RU' : 'UZ'}
        </button>
      </div>
    </header>
  );
}
