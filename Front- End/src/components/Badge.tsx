import { Award } from 'lucide-react';

interface BadgeProps {
  name: string;
  unlocked: boolean;
  threshold: number;
}

export const Badge = ({ name, unlocked, threshold }: BadgeProps) => {
  const colors = {
    Bronze: 'from-amber-600 to-amber-800',
    Silver: 'from-gray-300 to-gray-500',
    Gold: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
      unlocked ? 'bg-gradient-to-br ' + colors[name as keyof typeof colors] : 'bg-muted/50 opacity-50'
    }`}>
      <Award className={`h-8 w-8 ${unlocked ? 'text-white' : 'text-muted-foreground'}`} />
      <div className="text-center">
        <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-muted-foreground'}`}>
          {name}
        </p>
        <p className={`text-xs ${unlocked ? 'text-white/80' : 'text-muted-foreground'}`}>
          {threshold}+ points
        </p>
      </div>
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </div>
  );
};
