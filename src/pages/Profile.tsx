import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [userData, setUserData] = useLocalStorage('ecolearn_user', { points: 0, co2_saved: 0 });

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all your data?')) {
      setUserData({ points: 0, co2_saved: 0 });
      localStorage.clear();
      toast({
        title: 'Data reset',
        description: 'All your data has been cleared.',
      });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(userData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecolearn-data.json';
    a.click();
    
    toast({
      title: 'Data exported',
      description: 'Your data has been downloaded.',
    });
  };

  return (
    <div className="container py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <User className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('profile.title')}</h1>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('profile.language')}</h3>
          <div className="flex gap-4">
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={i18n.language === 'hi' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('hi')}
            >
              हिन्दी
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Your Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">EcoPoints:</span>
              <span className="font-semibold">{userData.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CO₂ Saved:</span>
              <span className="font-semibold">{userData.co2_saved} kg</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Data Management</h3>
          <div className="space-y-3">
            <Button variant="outline" onClick={handleExport} className="w-full">
              {t('profile.exportData')}
            </Button>
            <Button variant="destructive" onClick={handleReset} className="w-full">
              {t('profile.resetData')}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-muted/30">
          <p className="text-sm text-muted-foreground">{t('profile.privacy')}</p>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
