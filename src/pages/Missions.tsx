import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import { MissionCard } from '@/components/MissionCard';
import { missionsData } from '@/data/mockData';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Missions = () => {
  const { t } = useTranslation();
  const [missions, setMissions] = useState(missionsData);
  const [userData, setUserData] = useLocalStorage('ecolearn_user', { points: 0, co2_saved: 0 });

  const handleComplete = (missionId: number) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    setMissions(missions.map(m => 
      m.id === missionId ? { ...m, completed: true } : m
    ));

    setUserData({
      points: userData.points + mission.points,
      co2_saved: Number((userData.co2_saved + mission.co2).toFixed(2)),
    });
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

      <div className="space-y-4">
        {missions.map((mission) => (
          <MissionCard 
            key={mission.id} 
            mission={mission} 
            onComplete={handleComplete}
          />
        ))}
      </div>
    </div>
  );
};

export default Missions;
