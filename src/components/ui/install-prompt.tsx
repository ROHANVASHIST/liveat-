import { useState, useEffect } from 'react';
import { Download, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 font-mono">
      <div className="bg-background border border-primary/30 p-6 shadow-[0_0_30px_rgba(0,229,255,0.1)] flex items-center gap-6 max-w-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none" />
        <div className="scan-line opacity-20 pointer-events-none" />
        
        <div className="h-12 w-12 border border-primary/50 bg-primary/10 flex items-center justify-center shrink-0 text-primary relative">
          <Download size={20} className="relative z-10" />
          <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-primary animate-tech-pulse" />
        </div>
        
        <div className="flex-1 relative z-10">
          <h3 className="font-bold text-[12px] uppercase tracking-widest text-foreground">SYSTEM::INSTALL_WEB_NODE</h3>
          <p className="text-[9px] text-muted-foreground mt-1.5 uppercase tracking-[0.2em] font-medium opacity-70">
            Mount application locally for offline persistence & rapid execution.
          </p>
        </div>
        
        <div className="flex flex-col gap-2 relative z-10">
          <button 
            onClick={handleInstall}
            className="tech-btn bg-primary text-primary-foreground font-bold h-9 px-4 text-[9px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Terminal size={10} /> Mount
          </button>
          <button 
            onClick={() => setShow(false)}
            className="tech-btn bg-transparent border-transparent hover:border-border text-muted-foreground font-bold h-7 px-4 text-[9px] uppercase tracking-widest"
          >
            Abort
          </button>
        </div>
      </div>
    </div>
  );
}
