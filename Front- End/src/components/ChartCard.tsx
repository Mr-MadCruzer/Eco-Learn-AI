import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  caption?: string;
}

export const ChartCard = ({ title, children, caption }: ChartCardProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        {children}
      </div>
      {caption && (
        <p className="mt-4 text-xs text-muted-foreground italic">{caption}</p>
      )}
    </Card>
  );
};
