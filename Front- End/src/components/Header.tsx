import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [userData] = useLocalStorage('ecolearn_user', { points: 0, co2_saved: 0 });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/learn', label: t('nav.learn') },
    { path: '/visualize', label: t('nav.visualize') },
    { path: '/missions', label: t('nav.missions') },
    { path: '/daily-log', label: t('nav.dailyLog') },
    { path: '/dashboard', label: t('nav.dashboard') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="rounded-lg bg-primary p-2">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">EcoLearn+</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center space-x-1"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
          </Button>
          
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <Leaf className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success">{userData.points}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
