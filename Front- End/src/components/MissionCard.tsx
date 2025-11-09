import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mission } from '@/data/mockData';
import Confetti from 'react-confetti';
import { useToast } from '@/hooks/use-toast';

interface MissionCardProps {
  mission: Mission;
  onComplete: (missionId: number) => void;
  disabled?: boolean;
}

export const MissionCard = ({ mission, onComplete, disabled }: MissionCardProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = () => {
    onComplete(mission.id);
    setShowConfetti(true);
    
    toast({
      title: t('missions.completed'),
      description: `+${mission.points} ${t('missions.points')} • ${mission.co2} ${t('common.kg')} ${t('missions.co2')}`,
    });

    setTimeout(() => setShowConfetti(false), 3000);
  };

  const text = i18n.language === 'hi' ? mission.textHi : mission.text;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      <Card className={`p-4 transition-all hover:shadow-md ${mission.completed ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">{text}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Leaf className="h-3 w-3 text-success" />
                {mission.co2} {t('common.kg')}
              </span>
              <span className="flex items-center gap-1 text-accent">
                ⭐ {mission.points} {t('missions.points')}
              </span>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={mission.completed || disabled}
            className={mission.completed ? 'bg-success' : ''}
          >
            {mission.completed ? (
              <Check className="h-4 w-4" />
            ) : (
              t('missions.markDone')
            )}
          </Button>
        </div>
      </Card>
    </>
  );
};
