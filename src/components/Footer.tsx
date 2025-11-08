import { ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30 py-8 mt-auto">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold mb-3">EcoLearn+ India</h3>
            <p className="text-sm text-muted-foreground">
              Empowering climate action through education and engagement.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-3">Data Sources</h3>
            <div className="space-y-2">
              <a
                href="https://www.earthdata.nasa.gov/esds/csda/asdi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ASDI (NASA)
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              <a
                href="https://openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                OpenAI
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-3">Privacy</h3>
            <p className="text-sm text-muted-foreground">
              All your data is stored locally on your device. We don't collect or share personal information.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © 2024 EcoLearn+ India. Built for climate education.
        </div>
      </div>
    </footer>
  );
};
