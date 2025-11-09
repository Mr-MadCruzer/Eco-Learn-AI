import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { ChartCard } from '@/components/ChartCard';
import { indiaTemperatureData, indiaCO2Data } from '@/data/mockData';
import { TrendingUp } from 'lucide-react';
import { dataAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Visualize = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [backendTempData, setBackendTempData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real temperature data from backend
  useEffect(() => {
    const fetchTemperatureData = async () => {
      try {
        const data = await dataAPI.getTemperatureData();
        setBackendTempData(data);
      } catch (error) {
        console.error('Error fetching temperature data:', error);
        toast({
          title: 'Connection Issue',
          description: 'Using mock temperature data. Backend may be unavailable.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemperatureData();
  }, [toast]);

  const tempData = {
    labels: backendTempData.length > 0 ? backendTempData.map(d => d.year) : indiaTemperatureData.map(d => d.Year),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: backendTempData.length > 0 ? backendTempData.map(d => d.t_mean_c) : indiaTemperatureData.map(d => d.AvgTemp),
        borderColor: 'hsl(142 71% 32%)',
        backgroundColor: 'hsla(142 71% 32% / 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const co2Data = {
    labels: indiaCO2Data.map(d => d.Year),
    datasets: [
      {
        label: 'CO₂ Emissions (Mt)',
        data: indiaCO2Data.map(d => d.CO2),
        backgroundColor: 'hsl(38 92% 50%)',
        borderColor: 'hsl(38 92% 50%)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="container py-12">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('visualize.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('visualize.subtitle')}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ChartCard 
          title={t('visualize.tempTitle')}
          caption={t('visualize.source')}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading temperature data...</div>
            </div>
          ) : (
            <Line data={tempData} options={chartOptions} />
          )}
        </ChartCard>

        <ChartCard 
          title={t('visualize.co2Title')}
          caption={t('visualize.source')}
        >
          <Bar data={co2Data} options={chartOptions as ChartOptions<'bar'>} />
        </ChartCard>
      </div>

      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-2">Key Insights:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• {backendTempData.length > 0 ? 'Real-time data shows' : 'Historical data indicates'} India's temperature trends</li>
          <li>• CO₂ emissions have grown significantly over recent decades</li>
          <li>• Small individual actions can collectively make a significant impact</li>
        </ul>
      </div>
    </div>
  );
};

export default Visualize;
