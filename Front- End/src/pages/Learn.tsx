import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { agentAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const Learn = () => {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const userText = prompt.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    
    try {
      // Call the backend agent (chat-style reply)
      const result = await agentAPI.sendTask(userText, { lang: i18n.language });
      const reply = result.reply || result.answer || 'Sorry, I could not generate a reply.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Graceful fallback
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            i18n.language === 'hi'
              ? 'कनेक्शन में समस्या है। कृपया बाद में पुनः प्रयास करें।'
              : 'There was a connection issue. Please try again later.',
        },
      ]);

      toast({
        title: 'Connection Issue',
        description: 'Using offline responses. Backend may be unavailable.',
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

      {messages.length > 0 && (
        <Card className="p-6 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0">
                <div
                  className={
                    m.role === 'assistant'
                      ? 'w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'
                      : 'w-10 h-10 rounded-full bg-muted flex items-center justify-center'
                  }
                >
                  <Sparkles className={m.role === 'assistant' ? 'h-5 w-5 text-primary' : 'h-5 w-5 text-muted-foreground'} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold mb-1 text-muted-foreground">
                  {m.role === 'assistant' ? 'AI' : 'You'}
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
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
