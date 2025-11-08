import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Leaf, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

const Dashboard = () => {
  const { t } = useTranslation();
  const [userData] = useLocalStorage('ecolearn_user', { points: 0, co2_saved: 0 });

  const badges = [
    { name: 'Bronze', threshold: 10, unlocked: userData.points >= 10 },
    { name: 'Silver', threshold: 50, unlocked: userData.points >= 50 },
    { name: 'Gold', threshold: 100, unlocked: userData.points >= 100 },
  ];

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Points',
        data: [5, 8, 12, 15, 20, 25, userData.points],
        borderColor: 'hsl(142 71% 32%)',
        backgroundColor: 'hsla(142 71% 32% / 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container py-12">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('dashboard.ecoPoints')}</h3>
            <Leaf className="h-5 w-5 text-success" />
          </div>
          <p className="text-4xl font-bold text-success">{userData.points}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('dashboard.co2Saved')}</h3>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-4xl font-bold text-primary">{userData.co2_saved} {t('common.kg')}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('dashboard.badges')}</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-4xl font-bold text-accent">{badges.filter(b => b.unlocked).length}/{badges.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.weeklyTrend')}</h3>
          <div className="h-[200px]">
            <Line data={weeklyData} options={chartOptions} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.badges')}</h3>
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Badge key={badge.name} {...badge} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link to="/missions">
              <div className="text-center">
                <span className="text-2xl mb-2 block">✅</span>
                {t('dashboard.actions.mission')}
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4">
            <Link to="/daily-log">
              <div className="text-center">
                <span className="text-2xl mb-2 block">📝</span>
                {t('dashboard.actions.log')}
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4">
            <Link to="/learn">
              <div className="text-center">
                <span className="text-2xl mb-2 block">🎓</span>
                {t('dashboard.actions.learn')}
              </div>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
