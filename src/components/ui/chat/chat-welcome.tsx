import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Card } from '../card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { 
  ArrowRight, Sparkles, Shield, Activity, Cpu, Terminal, Database, Lock, 
  Zap, MessageSquare, Globe, Mic, Wifi, Users, FileText, Key, Server, Cloud,
  CheckCircle2, Star, TrendingUp, Clock, Heart, Bell, Image, Video, Send,
  Search, Share2, Settings, Volume2, Camera, Smile, HelpCircle, ChevronRight,
  Award, ThumbsUp, UserCheck, UserPlus, LogIn, Fingerprint, Eye, RefreshCw,
  ShieldCheck, AlertTriangle, BarChart3, PieChart, Lightbulb, Rocket, Flag,
  Code, MapPin, Navigation, Compass, Box, Layers, Workflow, Target, CheckCircle,
  X, Menu, Sun, Moon
} from 'lucide-react';

interface ChatWelcomeProps {
  onJoin: (username: string) => void;
  onGoogleLogin: () => void;
  onEmailAuth: (email: string, password: string, name: string, isSignup: boolean) => Promise<void>;
  isLoading: boolean;
  onUsernameChange: (name: string) => void;
  currentUser: string;
}

const features = [
  { icon: Zap, title: 'Real-Time Messaging', desc: 'Instant communication with WebSocket-powered low-latency delivery' },
  { icon: Shield, title: 'Enterprise Security', desc: 'End-to-end encryption, MFA, passkeys, and brute force protection' },
  { icon: Cpu, title: 'AI-Powered Assistant', desc: 'Concierge Core with sentiment analysis, smart replies, and summarization' },
  { icon: Globe, title: 'Cross-Platform', desc: 'Seamless experience across web, mobile, and desktop with cloud sync' },
  { icon: Lock, title: 'Multi-Factor Auth', desc: 'TOTP, biometric passkeys, and hardware key support for maximum protection' },
  { icon: MessageSquare, title: 'Rich Messaging', desc: 'Voice messages, file sharing, reactions, threads, and message editing' },
  { icon: Users, title: 'Team Collaboration', desc: 'Broadcast lists, pinned messages, starred items, and group management' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Customizable alerts, read receipts, typing indicators, and priority inbox' },
  { icon: Mic, title: 'Voice & Location', desc: 'Voice messages, live location sharing, and real-time tracking' },
  { icon: Search, title: 'Advanced Search', desc: 'Full-text message search with filters by date, sender, and content type' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time metrics, engagement tracking, heatmaps, and user retention' },
  { icon: Server, title: 'Self-Hosted', desc: 'Full control with Supabase backend, PostgreSQL, and open-source architecture' },
];

const stats = [
  { icon: MessageSquare, value: '10K+', label: 'Messages/Day' },
  { icon: Users, value: '500+', label: 'Active Users' },
  { icon: TrendingUp, value: '99.9%', label: 'Uptime SLA' },
  { icon: Lock, value: '256-bit', label: 'Encryption' },
];

const techStack = [
  { icon: Terminal, name: 'React/TypeScript', desc: 'Frontend' },
  { icon: Database, name: 'Supabase/PostgreSQL', desc: 'Database' },
  { icon: Server, name: 'Node.js/Express', desc: 'Backend' },
  { icon: Wifi, name: 'WebSocket', desc: 'Real-Time' },
  { icon: Cloud, name: 'Docker/K8s', desc: 'Deployment' },
  { icon: Cpu, name: 'AI/ML Pipeline', desc: 'Intelligence' },
  { icon: Shield, name: 'OAuth 2.0/JWT', desc: 'Auth' },
  { icon: Lock, name: 'TOTP/WebAuthn', desc: 'MFA' },
];

export function ChatWelcome({ onJoin, onGoogleLogin, onEmailAuth, isLoading, onUsernameChange, currentUser }: ChatWelcomeProps) {
  const [joinUsername, setJoinUsername] = useState(currentUser || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLocalJoin = () => {
    if (joinUsername.trim()) {
      onUsernameChange(joinUsername);
      onJoin(joinUsername);
    }
  };

  const handleEmailAuthAction = async (isSignup: boolean) => {
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setAuthError('Please fill in all required fields');
      return;
    }
    setIsAuthLoading(true);
    setAuthError('');
    try {
      await onEmailAuth(email, password, isSignup ? name : '', isSignup);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono animate-pulse">Initializing System</p>
            <p className="text-[8px] uppercase tracking-[0.4em] text-muted-foreground/60 font-mono">Loading modules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-y-auto overflow-x-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation */}
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">Concierge</span>
              <span className="tech-label">v3.0</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => setShowFeatures(!showFeatures)} className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
                Features
              </button>
              <button onClick={() => setShowTech(!showTech)} className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
                Tech Stack
              </button>
              <Button 
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="tech-btn h-9 px-5"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-6 py-4 space-y-3">
              <button onClick={() => { setShowFeatures(!showFeatures); setMobileNavOpen(false); }} className="block w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider py-2">
                Features
              </button>
              <button onClick={() => { setShowTech(!showTech); setMobileNavOpen(false); }} className="block w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider py-2">
                Tech Stack
              </button>
              <Button 
                onClick={() => { document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' }); setMobileNavOpen(false); }}
                className="tech-btn w-full"
              >
                Get Started
              </Button>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.05] via-transparent to-transparent" />
          <div className="scan-line" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Next-Gen Communication Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
              Connect.<br />
              <span className="gradient-text">Collaborate.</span><br />
              Communicate.
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Enterprise-grade real-time messaging platform with end-to-end encryption, 
              AI-powered assistance, multi-factor authentication, and advanced analytics. 
              Built for teams that demand security and performance.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="tech-btn h-12 px-8 text-xs gap-2"
              >
                <Rocket className="h-4 w-4" />
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button 
                onClick={() => setShowFeatures(true)}
                className="h-12 px-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-none transition-all"
              >
                View Features
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="tech-card p-4">
                  <stat.icon className="h-5 w-5 text-primary mb-2 mx-auto" />
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        {showFeatures && (
          <section className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 mb-4">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Platform Features</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Everything You Need</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">Enterprise features wrapped in a modern, intuitive interface</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <div 
                    key={i} 
                    className="tech-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:shadow-primary/5"
                  >
                    <div className="h-10 w-10 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tech Stack Section */}
        {showTech && (
          <section className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 mb-4">
                  <Code className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Technology Stack</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Built With Modern Tech</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">Industry-leading technologies powering every message</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {techStack.map((tech, i) => (
                  <div 
                    key={i} 
                    className="tech-card p-6 text-center hover:border-primary/30 transition-all"
                  >
                    <tech.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">{tech.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Auth Section */}
        <section id="auth-section" className="min-h-screen flex items-center justify-center py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] via-transparent to-transparent" />
          
          <div className="relative z-10 w-full max-w-md mx-auto px-6">
            <div className="text-center mb-10">
              <div className="h-16 w-16 rounded-none bg-primary flex items-center justify-center mx-auto mb-6 shadow-sm shadow-primary/20">
                <MessageSquare className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">Welcome to Concierge</h2>
              <p className="text-sm text-muted-foreground">Sign in to start communicating securely</p>
            </div>

            <Card className="tech-card overflow-hidden">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent">
                  <TabsTrigger value="signin" className="text-xs uppercase tracking-wider font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                    <LogIn className="h-3.5 w-3.5 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs uppercase tracking-wider font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                    <UserPlus className="h-3.5 w-3.5 mr-2" />
                    Sign Up
                  </TabsTrigger>
                  <TabsTrigger value="guest" className="text-xs uppercase tracking-wider font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                    <UserCheck className="h-3.5 w-3.5 mr-2" />
                    Guest
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  {/* Sign In */}
                  <TabsContent value="signin" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="tech-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="tech-input"
                      />
                    </div>

                    {authError && (
                      <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <p className="text-xs text-destructive">{authError}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleEmailAuthAction(false)}
                      disabled={isAuthLoading}
                      className="tech-btn w-full h-12"
                    >
                      {isAuthLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Authenticating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Sign In
                        </div>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground bg-background">or continue with</span>
                      </div>
                    </div>

                    <Button
                      onClick={onGoogleLogin}
                      variant="outline"
                      className="w-full h-12 text-xs font-bold uppercase tracking-[0.2em] border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-none"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                  </TabsContent>

                  {/* Sign Up */}
                  <TabsContent value="signup" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                      <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="tech-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="tech-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                      <Input
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="tech-input"
                      />
                    </div>

                    {authError && (
                      <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <p className="text-xs text-destructive">{authError}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleEmailAuthAction(true)}
                      disabled={isAuthLoading}
                      className="tech-btn w-full h-12"
                    >
                      {isAuthLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Create Account
                        </div>
                      )}
                    </Button>
                  </TabsContent>

                  {/* Guest Access */}
                  <TabsContent value="guest" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Choose a Display Name</label>
                      <Input
                        placeholder="Agent_007"
                        value={joinUsername}
                        onChange={(e) => {
                          setJoinUsername(e.target.value);
                          onUsernameChange(e.target.value);
                        }}
                        className="tech-input"
                      />
                    </div>

                    <div className="p-3 border border-border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Guest Mode</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Limited features. Sign up for full access including end-to-end encryption, AI features, and persistent storage.</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleLocalJoin}
                      disabled={!joinUsername.trim()}
                      className="tech-btn w-full h-12"
                    >
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Join as Guest
                      </div>
                    </Button>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>

            {/* Security Badges */}
            <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: Lock, label: 'E2E Encrypted' },
                { icon: Fingerprint, label: 'MFA Enabled' },
                { icon: ShieldCheck, label: 'SOC 2 Compliant' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <badge.icon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Concierge Communication Platform v3.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground/40">Built with</span>
                <Heart className="h-3 w-3 text-destructive/50" />
                <span className="text-[10px] text-muted-foreground/40">by the Concierge Team</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}