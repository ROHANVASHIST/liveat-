import React, { useState, useEffect } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Card } from '../card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { 
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  Cpu,
  Terminal,
  Database,
  Lock,
  Zap,
  MessageSquare,
  Globe,
  Mic,
  Wifi,
  Users,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWelcomeProps {
  onJoin: (name: string) => void;
  currentUser: string;
  onUsernameChange: (username: string) => void;
  isLoading?: boolean;
  onGoogleLogin?: () => void;
  onEmailAuth?: (email: string, password: string, name: string, isSignup: boolean) => Promise<void>;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  onGoogleLogin,
  onEmailAuth,
}) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);
  const [liveCounter, setLiveCounter] = useState(0);
  const [activePage, setActivePage] = useState<'home' | 'docs' | 'privacy' | 'support'>('home');

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL ? (import.meta.env.VITE_BACKEND_URL.startsWith('http') ? import.meta.env.VITE_BACKEND_URL : `https://${import.meta.env.VITE_BACKEND_URL}`) : ''}/api/online-count`);
        if (res.ok) {
          const data = await res.json();
          setLiveCounter(data.count);
        }
      } catch (err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailLoading(true);

    try {
      await onEmailAuth?.(email, password, name, activeTab === 'signup');
      setEmailLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setEmailLoading(false);
    }
  };

  const scrollToAuth = () => {
    document.getElementById('auth-node')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: Zap, title: 'Real-Time Messaging', desc: 'WebSocket-powered instant delivery with zero-latency peer-to-peer communication.' },
    { icon: Shield, title: 'End-to-End Encrypted', desc: 'AES-256-GCM encryption ensures every message stays private between sender and receiver.' },
    { icon: Sparkles, title: 'AI-Powered Tools', desc: 'Neural text polishing, conversation summaries, and intelligent auto-replies on demand.' },
    { icon: Globe, title: 'Multi-Device Sync', desc: 'Seamless cross-device experience — chat from your phone, tablet, or desktop simultaneously.' },
  ];

  const capabilities = [
    { icon: MessageSquare, label: 'Live Chat Rooms', stat: 'Unlimited' },
    { icon: Mic, label: 'Voice-to-Text', stat: 'Built-in' },
    { icon: FileText, label: 'File Sharing', stat: '10MB max' },
    { icon: Users, label: 'Direct Messages', stat: '1-on-1' },
    { icon: Database, label: 'Message History', stat: '7 Days' },
    { icon: Wifi, label: 'Connection', stat: 'WebSocket' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden relative bg-mesh">
      <div className="scan-line" />
      
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tighter uppercase">LiveAt</span>
            <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 bg-muted/20">v2.4.0</span>
          </div>
          <div className="flex items-center gap-6">
            {activePage === 'home' ? (
              <>
                <div className="hidden md:flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full status-online connection-pulse" /> {liveCounter.toLocaleString()} Online</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" /> Encrypted</span>
                </div>
                <Button onClick={scrollToAuth} variant="outline" className="tech-btn bg-transparent border-border hover:bg-muted text-foreground">Start Chatting</Button>
              </>
            ) : (
                <Button onClick={() => setActivePage('home')} variant="outline" className="tech-btn bg-transparent border-border hover:bg-muted text-foreground">Return to Kernel</Button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {activePage === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Side — Hero Content */}
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full status-online connection-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Live & Encrypted</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[0.95]">
                TALK IN<br />
                <span className="gradient-text">REAL TIME.</span><br />
                <span className="text-muted-foreground text-3xl lg:text-4xl">No delays. No compromises.</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-lg mb-8">
                Instant messaging with WebSocket delivery, AI-powered message tools, voice input, file sharing, and end-to-end encryption — all in one terminal-grade interface.
              </p>
              
              {/* Rotating Features */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    className={cn(
                      "p-4 border transition-all duration-300 cursor-default hover-lift",
                      activeFeature === i 
                        ? "border-primary/40 bg-primary/5 tech-glow" 
                        : "border-border bg-muted/20"
                    )}
                    onClick={() => setActiveFeature(i)}
                  >
                    <feat.icon className={cn("h-5 w-5 mb-3 transition-colors", activeFeature === i ? "text-primary" : "text-muted-foreground")} />
                    <h4 className="font-mono text-xs uppercase font-bold mb-1">{feat.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">{feat.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Live Stats Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="pt-8 border-t border-border/50"
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 opacity-70 hover:opacity-100 transition-all">
                {capabilities.map((cap) => (
                  <div key={cap.label} className="flex flex-col gap-1.5 items-center text-center">
                    <cap.icon size={14} className="text-primary" />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground leading-tight">{cap.label}</span>
                    <span className="font-mono text-[10px] font-bold">{cap.stat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Side — Auth Card */}
          <div id="auth-node" className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="tech-card p-0 overflow-hidden bg-background/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_hsl(var(--primary)/0.05)]">
                <div className="p-8 border-b border-border bg-muted/10 flex justify-between items-center">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Join the Network</h3>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">Sign in to start chatting in real time</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-primary animate-tech-pulse" />
                </div>
                
                <div className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 p-1 rounded-none h-12 border border-border">
                      <TabsTrigger value="signin" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Register</TabsTrigger>
                    </TabsList>
                    
                    <form onSubmit={handleEmailAuth} className="space-y-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {activeTab === 'signup' && (
                            <div className="space-y-2">
                              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Display Name</label>
                              <Input 
                                placeholder="Your name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="tech-input w-full h-12" 
                                required
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">E-Mail Address</label>
                            <Input 
                              type="email" 
                              placeholder="you@example.com" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="tech-input w-full h-12" 
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="tech-input w-full h-12" 
                              required
                            />
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {error && (
                        <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive text-[10px] font-mono uppercase tracking-widest text-center">
                          {error}
                        </div>
                      )}

                      <Button type="submit" disabled={emailLoading} className="tech-btn w-full h-12 flex justify-between px-6">
                        <span>{emailLoading ? 'CONNECTING...' : (activeTab === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                        <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-background/80 px-2 text-muted-foreground font-mono">Or continue with</span></div>
                      </div>

                      <Button onClick={onGoogleLogin} type="button" variant="outline" className="tech-btn w-full h-12 bg-transparent border-border text-foreground hover:bg-muted flex items-center justify-center gap-3">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google Account</span>
                      </Button>
                    </form>
                  </Tabs>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
        )}

        {/* Documentation View */}
        {activePage === 'docs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-8 font-mono">
             <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 mb-6">
               <Terminal size={12} className="text-primary" />
               <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">System Documentation</span>
             </div>
             <h1 className="text-4xl font-bold tracking-tighter mb-8 text-foreground uppercase">Operator Manual</h1>
             <p className="text-sm text-muted-foreground leading-relaxed">Welcome to the LiveAt core system documentation. This registry details connection protocols, interface customization, and data persistence guidelines.</p>
             <div className="tech-card p-8 mt-8 space-y-6">
               <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b border-border pb-2">Connecting to WebSockets</h3>
               <p className="text-[11px] text-muted-foreground">Our messaging transport layer uses an `wss://` protocol node wrapper. Your authentication handles handshake automatically through the session cookie.</p>
               <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b border-border pb-2 mt-8">Message Encryption</h3>
               <p className="text-[11px] text-muted-foreground">Every data packet transmitted through the Concierge GUI is AES-256 encrypted using an ephemeral session key generated on initial boot.</p>
             </div>
          </motion.div>
        )}

        {/* Privacy Policy View */}
        {activePage === 'privacy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-8 font-mono">
             <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 mb-6">
               <Shield size={12} className="text-primary" />
               <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Security Ledger</span>
             </div>
             <h1 className="text-4xl font-bold tracking-tighter mb-8 text-foreground uppercase">Privacy Policy</h1>
             <div className="tech-card p-8 mt-8 space-y-6">
               <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b border-border pb-2">Data Retention</h3>
               <p className="text-[11px] text-muted-foreground">Data nodes (messages) are strictly retained for 7 system days. A nightly chron cleanup routine automatically purges any node older than the threshold.</p>
               <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b border-border pb-2 mt-8">Telemetry</h3>
               <p className="text-[11px] text-muted-foreground">We collect aggregate network metrics directly reported in our environment analytics, decoupled from direct operator identity.</p>
             </div>
          </motion.div>
        )}

        {/* Support View */}
        {activePage === 'support' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-8 font-mono">
             <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 mb-6">
               <Activity size={12} className="text-primary" />
               <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Emergency Request</span>
             </div>
             <h1 className="text-4xl font-bold tracking-tighter mb-8 text-foreground uppercase">Support Console</h1>
             <div className="tech-card p-8 mt-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Operator Email</label>
                 <input placeholder="operator@network.com" className="w-full h-12 bg-background border border-border px-4 text-[11px] uppercase tracking-widest outline-none focus:border-primary/50" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Issue Definition</label>
                 <textarea placeholder="Describe subsystem failure..." className="w-full h-32 bg-background border border-border px-4 py-4 text-[11px] uppercase tracking-widest outline-none focus:border-primary/50 resize-none" />
               </div>
               <button className="tech-btn w-full h-12 text-[11px] uppercase tracking-[0.3em] font-bold mt-4">Transmit Alert</button>
             </div>
          </motion.div>
        )}

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-32 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-border bg-muted/10 mb-12">
            <Lock size={10} className="text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Built for privacy-first communication</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="tech-card p-8 text-center hover-lift">
              <div className="h-14 w-14 mx-auto border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-5">
                <Zap size={24} />
              </div>
              <h3 className="font-mono text-xs uppercase font-bold tracking-widest mb-3">Instant Delivery</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Messages arrive in under 10ms via persistent WebSocket connections. No polling, no delays.</p>
            </div>
            <div className="tech-card p-8 text-center hover-lift">
              <div className="h-14 w-14 mx-auto border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-5">
                <Cpu size={24} />
              </div>
              <h3 className="font-mono text-xs uppercase font-bold tracking-widest mb-3">AI Assistant</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Built-in AI polishes your messages, summarizes conversations, and provides intelligent replies.</p>
            </div>
            <div className="tech-card p-8 text-center hover-lift">
              <div className="h-14 w-14 mx-auto border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-5">
                <Shield size={24} />
              </div>
              <h3 className="font-mono text-xs uppercase font-bold tracking-widest mb-3">Always Private</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">All messages auto-expire after 7 days. No data mining, no tracking, no third-party access.</p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-12 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><Terminal size={12} className="text-primary" /> LiveAt</span>
            <span className="opacity-30">|</span>
            <span>© 2026</span>
            <span className="opacity-30">|</span>
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
             <button onClick={() => { setActivePage('docs'); window.scrollTo(0,0); }} className={cn("transition-colors uppercase", activePage === 'docs' ? "text-primary font-bold" : "hover:text-primary")}>Documentation</button>
             <button onClick={() => { setActivePage('privacy'); window.scrollTo(0,0); }} className={cn("transition-colors uppercase", activePage === 'privacy' ? "text-primary font-bold" : "hover:text-primary")}>Privacy Policy</button>
             <button onClick={() => { setActivePage('support'); window.scrollTo(0,0); }} className={cn("transition-colors uppercase", activePage === 'support' ? "text-primary font-bold" : "hover:text-primary")}>Contact Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
