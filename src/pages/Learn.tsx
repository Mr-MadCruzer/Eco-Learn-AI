import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { aiResponses } from '@/data/mockData';

const Learn = () => {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const lowerPrompt = prompt.toLowerCase();
      let answer = aiResponses.default;
      
      if (lowerPrompt.includes('warming') || lowerPrompt.includes('वार्मिंग')) {
        answer = aiResponses['global warming'];
      } else if (lowerPrompt.includes('heat') || lowerPrompt.includes('लू')) {
        answer = aiResponses.heatwave;
      }
      
      setResponse(i18n.language === 'hi' ? answer.hi : answer.en);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container py-12 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-block mb-4 rounded-full bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t('learn.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('learn.subtitle')}</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <Textarea
            placeholder={t('learn.placeholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          <Button 
            onClick={handleAsk} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? t('learn.loading') : t('learn.teachMe')}
          </Button>
        </div>
      </Card>

      {response && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-success/5 border-primary/20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-primary">AI Response</h3>
              <p className="text-sm leading-relaxed text-foreground">{response}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Suggested Questions */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Suggested Questions:</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'How does global warming affect India?',
            'What causes heatwaves?',
            'How can I reduce my carbon footprint?',
          ].map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setPrompt(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Learn;
