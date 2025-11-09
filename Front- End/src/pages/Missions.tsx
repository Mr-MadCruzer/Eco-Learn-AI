import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, RefreshCw } from 'lucide-react';
import { MissionCard } from '@/components/MissionCard';
import { missionsData, Mission as BaseMission } from '@/data/mockData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { missionsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type UIMission = BaseMission & { backendId?: string };

const Missions = () => {
  const { t } = useTranslation();
  const [missions, setMissions] = useState<UIMission[]>([]);
  const [userData, setUserData] = useLocalStorage('ecolearn_user', { points: 0, co2_saved: 0 });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      // Try dynamic generation first (different missions per session)
      const generated = await missionsAPI.generateMissions({ n: 5 });
      const list = generated.missions || [];
      if (list.length > 0) {
        const ui: UIMission[] = list.map((m: any, idx: number) => ({
          id: idx + 1,
          text: m.title,
          textHi: m.title,
          co2: Number(m.co2_saving_kg ?? 0),
          points: Number(m.points ?? 0),
          completed: false,
          backendId: m.id,
        }));
        setMissions(ui);
        return;
      }
      // Fallback to static catalog if generation returns empty
      const staticList = await missionsAPI.getMissions();
      const uiStatic: UIMission[] = staticList.map((m: any, idx: number) => ({
        id: idx + 1,
        text: m.title,
        textHi: m.title,
        co2: Number(m.co2_saving_kg ?? 0),
        points: Number(m.points ?? 0),
        completed: false,
        backendId: m.id,
      }));
      setMissions(uiStatic);
    } catch (err) {
      console.error('Failed to fetch missions, using mock:', err);
      toast({
        title: 'Using mock missions',
        description: 'Backend missions unavailable. Mock list loaded.',
      });
      setMissions(missionsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleComplete = async (missionId: number) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    setLoading(true);
    try {
      // Use real backend mission ID when available
      const backendMissionId = mission.backendId || `m_${missionId}`;
      const result = await missionsAPI.calculatePoints([backendMissionId]);
      
      if (result.awarded_points > 0) {
        setMissions(missions.map(m => 
          m.id === missionId ? { ...m, completed: true } : m
        ));

        setUserData({
          points: userData.points + result.awarded_points,
          co2_saved: Number((userData.co2_saved + mission.co2).toFixed(2)),
        });

        toast({
          title: 'Mission Completed!',
          description: `You earned ${result.awarded_points} EcoPoints!`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Mission not recognized by backend.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete mission. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('missions.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('missions.subtitle')}</p>
      </div>

      <div className="text-center mb-8">
        <Button onClick={fetchMissions} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('missions.regenerate')}
        </Button>
      </div>

      {loading && missions.length === 0 ? (
        <p className="text-center text-muted-foreground">Loading missions...</p>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <MissionCard 
              key={mission.id} 
              mission={mission} 
              onComplete={handleComplete}
              disabled={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Missions;
