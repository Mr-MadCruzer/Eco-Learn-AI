import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { activityAnalysis } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { carbonAPI } from '@/services/api';

type DailyLogAnalysis = {
  co2_estimate: number;
  impact_level: 'green' | 'moderate' | 'harmful';
  feedback: string;
  tips: string[];
  tipsHi: string[];
  benefits: string[];
  benefitsHi: string[];
};

const DailyLog = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [activity, setActivity] = useState('');
  const [analysis, setAnalysis] = useState<DailyLogAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    { key: 'car', label: t('dailyLog.presets.car') },
    { key: 'bus', label: t('dailyLog.presets.bus') },
    { key: 'meat', label: t('dailyLog.presets.meat') },
    { key: 'ac', label: t('dailyLog.presets.ac') },
  ];

  const handleAnalyze = async () => {
    if (!activity.trim()) return;
    
    setLoading(true);
    
    try {
      const result = await carbonAPI.analyzeLog({
        text: activity,
        lang: i18n.language,
      });

      const threatToImpact: Record<string, 'green' | 'moderate' | 'harmful'> = {
        Low: 'green',
        Moderate: 'moderate',
        High: 'harmful',
        Severe: 'harmful',
      };

      const impact =
        threatToImpact[result?.analysis?.threat as string] ?? 'moderate';

      const coachTips: string[] =
        (Array.isArray(result?.tips) ? result.tips : []) ||
        result?.analysis?.advice?.slice(0, 3) ||
        [];

      const transformedResult = {
        co2_estimate: result?.analysis?.total_kg ?? 0,
        impact_level: impact,
        feedback: result?.feedback ?? '',
        tips: coachTips,
        tipsHi: coachTips,
        benefits: ['Reduced carbon footprint', 'Cost savings', 'Environmental impact'],
        benefitsHi: ['कम कार्बन फुटप्रिंट', 'लागत बचत', 'पर्यावरणीय प्रभाव']
      };
      
      setAnalysis(transformedResult);
    } catch (error) {
      console.error('Error analyzing activity:', error);
      
      // Fallback to mock data if backend fails
      const lowerActivity = activity.toLowerCase();
      let result = activityAnalysis.car;
      
      if (lowerActivity.includes('bus') || lowerActivity.includes('बस')) {
        result = activityAnalysis.bus;
      } else if (lowerActivity.includes('meat') || lowerActivity.includes('मांस')) {
        result = activityAnalysis.meat;
      } else if (lowerActivity.includes('ac')) {
        result = activityAnalysis.ac;
      }
      
      setAnalysis({
        co2_estimate: result.co2_estimate,
        impact_level: result.impact_level,
        feedback: i18n.language === 'hi'
          ? 'ऑफ़लाइन मोड: हम सामान्य मार्गदर्शन साझा कर रहे हैं।'
          : 'Offline mode: showing general guidance.',
        tips: i18n.language === 'hi' ? result.tipsHi : result.tips,
        tipsHi: result.tipsHi,
        benefits: result.benefits,
        benefitsHi: result.benefitsHi,
      });
      
      toast({
        title: 'Connection Issue',
        description: 'Using offline analysis. Backend may be unavailable.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLog = () => {
    toast({
      title: 'Activity logged!',
      description: 'Your daily routine has been updated.',
    });
    setActivity('');
    setAnalysis(null);
  };

  const impactColors = {
    green: 'bg-success/10 text-success border-success/20',
    moderate: 'bg-warning/10 text-warning border-warning/20',
    harmful: 'bg-harmful/10 text-harmful border-harmful/20',
  };

  return (
    <div className="container py-12 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('dailyLog.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('dailyLog.subtitle')}</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((preset) => (
              <Button
                key={preset.key}
                variant="outline"
                size="sm"
                onClick={() => setActivity(preset.label)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Textarea
            placeholder={t('dailyLog.placeholder')}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          <Button 
            onClick={handleAnalyze} 
            disabled={loading || !activity.trim()}
            className="w-full"
          >
            {loading ? t('common.loading') : t('dailyLog.analyze')}
          </Button>
        </div>
      </Card>

      {analysis && (
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">
                {analysis.co2_estimate} <span className="text-2xl">{t('common.kg')}</span>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full border ${impactColors[analysis.impact_level]}`}>
                <span className="text-sm font-semibold capitalize">{t('dailyLog.results.impact')}: {analysis.impact_level}</span>
              </div>
              {analysis.feedback && (
                <p className="mt-3 text-sm text-muted-foreground italic">
                  {analysis.feedback}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                💡 {t('dailyLog.results.tips')}
              </h3>
              <ul className="space-y-1">
                {(i18n.language === 'hi' ? analysis.tipsHi : analysis.tips).map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                ✨ {t('dailyLog.results.benefits')}
              </h3>
              <ul className="space-y-1">
                {(i18n.language === 'hi' ? analysis.benefitsHi : analysis.benefits).map((benefit: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">• {benefit}</li>
                ))}
              </ul>
            </div>

            <Button onClick={handleAddToLog} className="w-full">
              {t('dailyLog.results.addToLog')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyLog;
