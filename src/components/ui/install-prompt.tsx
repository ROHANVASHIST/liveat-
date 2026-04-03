import { useState, useEffect } from 'react';
import { Button } from './button';
import { Download, X } from 'lucide-react';

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
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-800 flex items-center gap-6 max-w-md">
        <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
          <Download className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-tight">Install LiveAt</h3>
          <p className="text-slate-400 text-sm mt-1">Access your chats instantly from your home screen.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleInstall}
            className="bg-white text-slate-900 hover:bg-white/90 font-bold rounded-xl h-10 px-6"
          >
            Install
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShow(false)}
            className="text-slate-500 hover:text-white hover:bg-slate-800 font-bold rounded-xl h-10"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
