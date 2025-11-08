import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Leaf, TrendingUp, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Index = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, label: t('home.stats.users'), value: '10,000+' },
    { icon: Leaf, label: t('home.stats.co2Saved'), value: '50,000' },
    { icon: Award, label: t('home.stats.missions'), value: '25,000+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-success py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-block rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">🌱 EcoLearn+ India</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              {t('home.title')}
            </h1>
            
            <p className="mb-8 text-xl text-white/90">
              {t('home.subtitle')}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/learn">{t('home.cta')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Link to="/dashboard">{t('home.demo')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <stat.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="font-semibold mb-2">Learn</h3>
              <p className="text-sm text-muted-foreground">Ask AI about climate change in India</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Visualize</h3>
              <p className="text-sm text-muted-foreground">See real climate data for India</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold mb-2">Act</h3>
              <p className="text-sm text-muted-foreground">Complete daily eco-missions</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold mb-2">Earn</h3>
              <p className="text-sm text-muted-foreground">Get points and unlock badges</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-success to-primary">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to make a difference?</h2>
          <p className="text-xl text-white/90 mb-8">Join thousands of Indians taking climate action</p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/missions">Start Your First Mission</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
