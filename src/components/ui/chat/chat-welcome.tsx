import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
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
  X, Menu, Sun, Moon, Network, Radio, GitBranch, Sliders, Gauge, Headphones,
  Download, Upload, Bookmark, FolderOpen, Calendar, ListChecks, Vote, Timer,
  Webhook, Smartphone, Monitor, Tablet, Cable, HardDrive, Cctv,
  Repeat, Maximize, Minimize, Globe2, Ship, TowerControl, Satellite,
  Kanban, FileSpreadsheet, Palette, Layout, PanelTop, PanelBottom,
  Building2
} from 'lucide-react';

interface ChatWelcomeProps {
  onJoin: (username: string) => void;
  onGoogleLogin: () => void;
  onEmailAuth: (email: string, password: string, name: string, isSignup: boolean) => Promise<void>;
  onPasswordReset?: (email: string) => Promise<void>;
  isLoading: boolean;
  onUsernameChange: (name: string) => void;
  currentUser: string;
}

const features = [
  {
    icon: MessageSquare, title: 'Real-Time Messaging',
    desc: 'WebSocket-powered instant messaging with sub-100ms latency. Message status tracking (sent, delivered, read), typing indicators, and delivery receipts.',
    details: ['WebSocket persistent connections', 'Typing indicators & read receipts', 'Message status tracking', 'Offline message queuing']
  },
  {
    icon: Lock, title: 'End-to-End Encryption',
    desc: 'Military-grade AES-256 encryption for all messages. Perfect forward secrecy with ephemeral key exchange ensures past communications stay secure.',
    details: ['AES-256-GCM encryption', 'Perfect forward secrecy', 'Ephemeral key exchange', 'Zero-access architecture']
  },
  {
    icon: Cpu, title: 'AI-Powered Intelligence',
    desc: 'Concierge Core AI engine provides smart replies, sentiment analysis, message polishing, chat summarization, and contextual automation.',
    details: ['Sentiment analysis engine', 'Smart reply suggestions', 'Message polishing AI', 'Conversation summarization']
  },
  {
    icon: Shield, title: 'Multi-Factor Security',
    desc: 'Defense-in-depth with TOTP, WebAuthn passkeys, hardware security keys, biometric authentication, and brute-force protection.',
    details: ['TOTP time-based OTP', 'WebAuthn/FIDO2 passkeys', 'Biometric authentication', 'Rate limiting & lockout']
  },
  {
    icon: Mic, title: 'Voice & Media Sharing',
    desc: 'Rich media support including voice messages, images, videos, documents, and live location sharing with real-time tracking.',
    details: ['Voice message recording', 'Live location sharing', 'Image & video sharing', 'Drag-and-drop file upload']
  },
  {
    icon: BarChart3, title: 'Advanced Analytics',
    desc: 'Comprehensive analytics dashboard with real-time metrics, engagement tracking, activity heatmaps, user retention, and content type distribution.',
    details: ['Real-time metrics dashboard', 'Engagement & retention tracking', 'Activity heatmaps', 'Content type analytics']
  },
  {
    icon: Users, title: 'Team Collaboration',
    desc: 'Organize with broadcast lists, chat folders, pinned messages, starred items, group management, and role-based access control.',
    details: ['Broadcast lists', 'Chat folders & organization', 'Pinned & starred messages', 'Role-based access control']
  },
  {
    icon: Bell, title: 'Smart Notifications',
    desc: 'Configurable notification preferences, priority inbox, mute controls, and cross-platform push notifications so you never miss important messages.',
    details: ['Customizable preferences', 'Priority inbox filtering', 'Cross-platform push', 'Quiet hours scheduling']
  },
  {
    icon: Search, title: 'Full-Text Search',
    desc: 'Powerful search across all messages with filters by date range, sender, room, content type, and advanced query syntax for precise results.',
    details: ['Full-text message search', 'Filter by date & sender', 'Content type filtering', 'Advanced query syntax']
  },
  {
    icon: Vote, title: 'Polls & Decisions',
    desc: 'Create polls with multiple choice or single selection, real-time vote tracking, and automated result aggregation for team decision-making.',
    details: ['Multiple & single choice', 'Real-time vote tracking', 'Automated result aggregation', 'Anonymous voting option']
  },
  {
    icon: ListChecks, title: 'Tasks & Workflows',
    desc: 'Integrated task management with assignments, priority levels, due dates, status tracking, and room-level task boards.',
    details: ['Task creation & assignment', 'Priority & due dates', 'Status workflow tracking', 'Room-level task boards']
  },
  {
    icon: Calendar, title: 'Events & Scheduling',
    desc: 'Schedule events with RSVP management, calendar integration, duration tracking, and location mapping for coordinated team activities.',
    details: ['Event creation & RSVP', 'Calendar integration', 'Location & duration tracking', 'Automated reminders']
  },
  {
    icon: Bookmark, title: 'Bookmarks & References',
    desc: 'Save important messages with personal notes, organize bookmarks into collections, and quickly retrieve referenced information.',
    details: ['Message bookmarking', 'Personal notes & annotations', 'Collection organization', 'Quick retrieval search']
  },
  {
    icon: FolderOpen, title: 'Chat Folder Management',
    desc: 'Organize rooms and conversations into custom folders with color coding and icons for efficient workspace management.',
    details: ['Custom folder creation', 'Color coding & icons', 'Drag-and-drop organization', 'Cross-folder search']
  },
  {
    icon: Palette, title: 'Customizable Themes',
    desc: 'Full theme customization with dark/light modes, custom color schemes, background patterns, and typography preferences.',
    details: ['Dark & light modes', 'Custom color schemes', 'Background patterns', 'Typography control']
  },
  {
    icon: Repeat, title: 'Message Forwarding',
    desc: 'Forward messages across rooms with attribution tracking, forward count visibility, and cross-room message sharing.',
    details: ['Cross-room forwarding', 'Attribution tracking', 'Forward count display', 'Bulk message forwarding']
  },
  {
    icon: Timer, title: 'Scheduled Messaging',
    desc: 'Schedule messages for future delivery with timezone support, recurring schedules, and draft management for planned communications.',
    details: ['Future-dated delivery', 'Timezone-aware scheduling', 'Recurring message patterns', 'Draft & edit management']
  },
  {
    icon: GitBranch, title: 'Message Editing History',
    desc: 'Full edit history tracking with version comparison, audit trail for compliance, and revert capability for message management.',
    details: ['Edit history tracking', 'Version comparison', 'Compliance audit trail', 'Revert capability']
  },
];

const securityFeatures = [
  { icon: Lock, title: 'AES-256-GCM Encryption', desc: 'Military-grade encryption for all messages at rest and in transit' },
  { icon: Fingerprint, title: 'WebAuthn Passkeys', desc: 'FIDO2/WebAuthn biometric and hardware key authentication' },
  { icon: Shield, title: 'TOTP Multi-Factor', desc: 'Time-based one-time passwords with backup codes' },
  { icon: Eye, title: 'Zero-Knowledge Architecture', desc: 'Server cannot read encrypted message contents' },
  { icon: RefreshCw, title: 'Perfect Forward Secrecy', desc: 'Ephemeral keys ensure past messages stay secure' },
  { icon: AlertTriangle, title: 'Brute Force Protection', desc: 'Rate limiting, account lockout, and IP blacklisting' },
  { icon: Server, title: 'Session Management', desc: 'View and revoke active sessions across all devices' },
  { icon: Key, title: 'JWT with Refresh Tokens', desc: 'Short-lived access tokens with secure refresh rotation' },
];

const stats = [
  { icon: MessageSquare, value: '10K+', label: 'Messages/Day' },
  { icon: Users, value: '500+', label: 'Active Users' },
  { icon: TrendingUp, value: '99.9%', label: 'Uptime SLA' },
  { icon: Lock, value: '256-bit', label: 'Encryption' },
];

const techStack = [
  { icon: Terminal, name: 'React 18 / TypeScript', desc: 'Frontend Framework', detail: 'Component-driven UI with hooks, suspense, and concurrent features' },
  { icon: Database, name: 'Supabase / PostgreSQL', desc: 'Database Layer', detail: 'Real-time subscriptions, row-level security, and managed infrastructure' },
  { icon: Server, name: 'Node.js / Express', desc: 'API Backend', detail: 'RESTful API with middleware pipeline, rate limiting, and security headers' },
  { icon: Wifi, name: 'WebSocket (WS)', desc: 'Real-Time Transport', detail: 'Persistent bidirectional connections with auto-reconnect and heartbeat' },
  { icon: Cloud, name: 'Docker / Kubernetes', desc: 'Orchestration', detail: 'Containerized deployment with auto-scaling and health checks' },
  { icon: Cpu, name: 'AI / ML Pipeline', desc: 'Intelligence Layer', detail: 'Sentiment analysis, smart replies, and contextual automation' },
  { icon: Shield, name: 'Passport.js / JWT', desc: 'Authentication', detail: 'OAuth 2.0, Google SSO, JWT access/refresh token rotation' },
  { icon: Lock, name: 'WebAuthn / TOTP', desc: 'Multi-Factor Auth', detail: 'FIDO2 passkeys, hardware security keys, and time-based OTP' },
  { icon: Code, name: 'Tailwind CSS', desc: 'Styling', detail: 'Utility-first CSS with custom design system and theme support' },
  { icon: Radio, name: 'WebRTC', desc: 'Peer-to-Peer', detail: 'Voice calls, video calls, and direct peer-to-peer file transfer' },
  { icon: Sliders, name: 'Redis / Cache', desc: 'Caching Layer', detail: 'Session store, rate limiting counters, and hot data caching' },
  { icon: HardDrive, name: 'S3 / Supabase Storage', desc: 'File Storage', detail: 'Scalable object storage for media, files, and backups' },
];

const useCases = [
  { icon: Building2, title: 'Enterprise Teams', desc: 'Secure internal communication with compliance, audit trails, and role-based access' },
  { icon: Rocket, title: 'Startups', desc: 'Fast-moving team collaboration with integrated task management and decision polls' },
  { icon: Headphones, title: 'Customer Support', desc: 'Real-time agent communication with broadcast lists and smart routing' },
  { icon: TowerControl, title: 'Remote Operations', desc: 'Distributed team coordination with live location and voice messaging' },
];

const testimonials = [
  { name: 'Alex Chen', role: 'CTO, TechFlow Inc.', content: 'Concierge transformed how our distributed team communicates. The AI-powered summaries alone save us 10+ hours per week.', avatar: 'AC' },
  { name: 'Sarah Mitchell', role: 'Security Lead, CyberSafe', content: 'Finally a messaging platform that takes security seriously. WebAuthn passkeys + E2EE gives us the compliance we need.', avatar: 'SM' },
  { name: 'James Rodriguez', role: 'Engineering Manager, DevStream', content: 'The analytics dashboard gives me real-time visibility into team communication patterns. Invaluable for agile retrospectives.', avatar: 'JR' },
];

const faqItems = [
  { q: 'How does end-to-end encryption work?', a: 'Messages are encrypted with AES-256-GCM on the client before transmission. Each conversation uses ephemeral keys via X3DH key agreement protocol, ensuring perfect forward secrecy. The server never has access to encryption keys.' },
  { q: 'What authentication methods are supported?', a: 'We support email/password with Supabase Auth, Google OAuth 2.0, TOTP (Google Authenticator, Authy), WebAuthn passkeys (Face ID, Touch ID, Windows Hello), and hardware security keys (YubiKey).' },
  { q: 'Is there a self-hosted option?', a: 'Yes. The entire stack is open-source and can be deployed via Docker Compose. You maintain full control over your data with your own Supabase instance and infrastructure.' },
  { q: 'How is data stored and protected?', a: 'Data is stored in PostgreSQL with encryption at rest. File attachments are stored in S3-compatible storage with server-side encryption. All database connections use TLS 1.3.' },
  { q: 'What is the message retention policy?', a: 'Messages are retained for 7 days by default with automatic cleanup. You can configure custom retention periods per room or globally, including indefinite retention for compliance.' },
  { q: 'Can I integrate with other tools?', a: 'The API is fully RESTful with webhook support. We provide SDKs for JavaScript, Python, and Go. Custom webhook integrations allow connecting with Slack, Teams, Discord, and more.' },
];

const pricingPlans = [
  {
    name: 'Starter', price: '$0', period: 'forever', cta: 'Get Started',
    features: ['Up to 10 team members', '1,000 messages/day', 'Basic encryption', 'Email support', 'Guest access']
  },
  {
    name: 'Professional', price: '$19', period: '/month', cta: 'Start Free Trial', popular: true,
    features: ['Unlimited team members', 'Unlimited messages', 'E2E encryption', 'Priority support', 'Advanced analytics', 'AI features', 'Custom retention']
  },
  {
    name: 'Enterprise', price: '$49', period: '/month', cta: 'Contact Sales',
    features: ['Everything in Professional', 'SSO/SAML', 'Audit logs', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations', '24/7 phone support']
  },
];

function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className={glitching ? 'relative' : ''}>
      {text}
      {glitching && (
        <span className="absolute inset-0 text-primary/50" style={{ clipPath: 'inset(20% 0 40% 0)', transform: 'translateX(2px)' }}>
          {text}
        </span>
      )}
    </span>
  );
}

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const target = parseInt(value.replace(/\D/g, ''));
        if (isNaN(target)) { setDisplay(value); return; }
        const steps = 30;
        const stepVal = Math.ceil(target / steps);
        let current = 0;
        const timer = setInterval(() => {
          current += stepVal;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setDisplay(current.toLocaleString() + suffix);
        }, 50);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>{display}</span>;
}

export function ChatWelcome({ onJoin, onGoogleLogin, onEmailAuth, onPasswordReset, isLoading, onUsernameChange, currentUser }: ChatWelcomeProps) {
  const [joinUsername, setJoinUsername] = useState(currentUser || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

        {/* === NAVIGATION === */}
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">Concierge</span>
              <span className="tech-label">v3.0</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'features', label: 'Features' },
                { id: 'security', label: 'Security' },
                { id: 'tech', label: 'Tech Stack' },
                { id: 'pricing', label: 'Pricing' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="tech-btn h-9 px-5 ml-2"
              >
                Get Started
              </Button>
            </div>

            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-6 py-4 space-y-3">
              {['Features', 'Security', 'Tech Stack', 'Pricing'].map(label => (
                <button
                  key={label}
                  onClick={() => {
                    document.getElementById(`section-${label.toLowerCase().replace(' ', '-')}`)?.scrollIntoView({ behavior: 'smooth' });
                    setMobileNavOpen(false);
                  }}
                  className="block w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider py-2"
                >
                  {label}
                </button>
              ))}
              <Button
                onClick={() => { document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' }); setMobileNavOpen(false); }}
                className="tech-btn w-full"
              >
                Get Started
              </Button>
            </div>
          )}
        </nav>

        {/* === HERO SECTION === */}
        <section className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-transparent to-transparent" />
          <div className="scan-line" />

          {/* Decorative grid elements */}
          <div className="absolute top-20 left-10 w-64 h-64 border border-primary/5 rounded-none rotate-45 opacity-20" />
          <div className="absolute bottom-20 right-10 w-48 h-48 border border-primary/10 rounded-none rotate-12 opacity-20" />
          <div className="absolute top-1/3 right-1/4 w-72 h-1 bg-primary/10 blur-xl" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-1 bg-primary/5 blur-xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-primary/20 bg-primary/5 mb-8 animate-tech-pulse">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">v3.0 — Next-Gen Communication Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground mb-6 leading-[0.9]">
              <GlitchText text="Connect." />
              <br />
              <span className="gradient-text"><GlitchText text="Collaborate." /></span>
              <br />
              <GlitchText text="Communicate." />
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Enterprise-grade real-time messaging platform with <span className="text-primary font-bold">end-to-end encryption</span>, 
              <span className="text-primary font-bold"> AI-powered assistance</span>, <span className="text-primary font-bold">multi-factor authentication</span>, 
              and <span className="text-primary font-bold">advanced analytics</span>. Built for teams that demand uncompromising security and performance.
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
                onClick={() => document.getElementById('section-features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-none transition-all"
              >
                Explore Features
              </button>
              <button
                onClick={() => document.getElementById('section-tech')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-none transition-all"
              >
                <Code className="h-3.5 w-3.5 inline mr-2" />
                Tech Stack
              </button>
            </div>

            {/* Hero Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="tech-card p-5 hover:border-primary/30 transition-all">
                  <stat.icon className="h-5 w-5 text-primary mb-2 mx-auto" />
                  <p className="text-2xl md:text-3xl font-black text-foreground font-mono">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Architecture Visual */}
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="tech-card p-6 md:p-8 border-primary/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-6">System Architecture</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 text-left">
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-none bg-primary/20 flex items-center justify-center">
                        <Monitor className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Client Layer</span>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="text-[9px] text-muted-foreground font-mono">React SPA (TypeScript)</li>
                      <li className="text-[9px] text-muted-foreground font-mono">WebSocket Client</li>
                      <li className="text-[9px] text-muted-foreground font-mono">E2E Encryption Engine</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-none bg-primary/20 flex items-center justify-center">
                        <Server className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">API Layer</span>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="text-[9px] text-muted-foreground font-mono">Express REST API</li>
                      <li className="text-[9px] text-muted-foreground font-mono">WebSocket Server</li>
                      <li className="text-[9px] text-muted-foreground font-mono">Rate Limiting / Auth</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-none bg-primary/20 flex items-center justify-center">
                        <Database className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Data Layer</span>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="text-[9px] text-muted-foreground font-mono">Supabase / PostgreSQL</li>
                      <li className="text-[9px] text-muted-foreground font-mono">S3 Object Storage</li>
                      <li className="text-[9px] text-muted-foreground font-mono">Redis Cache (Session)</li>
                    </ul>
                  </div>
                </div>
                {/* Connection arrows */}
                <div className="hidden md:flex justify-center gap-20 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-primary/30" />
                    <Cable className="h-3 w-3 text-primary/50 rotate-90" />
                    <div className="h-px w-8 bg-primary/30" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-primary/30" />
                    <Cable className="h-3 w-3 text-primary/50 rotate-90" />
                    <div className="h-px w-8 bg-primary/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === USE CASES === */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Use Cases</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Built for Every Team</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">From startups to enterprises, Concierge adapts to your workflow</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {useCases.map((uc, i) => {
                const Icon = uc.icon;
                return (
                  <div key={i} className="tech-card p-6 hover:border-primary/30 transition-all group">
                    <Icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-bold text-foreground mb-2">{uc.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* === FEATURES SECTION === */}
        <section id="section-features" className="py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <Star className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Platform Features</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                <span className="text-primary font-bold">18+ features</span> packed into a modern, secure, and intelligent communication platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="tech-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:shadow-primary/5 group"
                >
                  <div className="h-10 w-10 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{feature.desc}</p>
                  <ul className="space-y-1">
                    {feature.details.map((detail, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                        <CheckCircle2 className="h-3 w-3 text-primary/60" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === SECURITY SECTION === */}
        <section id="section-security" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
          <div className="scan-line" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-primary/20 bg-primary/5 mb-4">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Security Architecture</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Defense in Depth</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Multiple layers of security protecting every message, every session, every user
              </p>
            </div>

            {/* Security Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
              {[
                { value: 'AES-256', label: 'Encryption Standard', desc: 'Military grade' },
                { value: '99.99%', label: 'Security Uptime', desc: 'No breaches' },
                { value: '3+', label: 'Auth Factors', desc: 'Password + TOTP + Passkey' },
                { value: '100K+', label: 'Threats Blocked', desc: 'Daily rate limiting' },
              ].map((s, i) => (
                <div key={i} className="tech-card p-4 text-center">
                  <p className="text-xl font-black text-primary font-mono">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mt-1">{s.label}</p>
                  <p className="text-[8px] text-muted-foreground/60 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {securityFeatures.map((sf, i) => (
                <div key={i} className="tech-card p-5 hover:border-primary/30 transition-all group">
                  <div className="h-9 w-9 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-all">
                    <sf.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-1.5">{sf.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{sf.desc}</p>
                </div>
              ))}
            </div>

            {/* Security Compliance */}
            <div className="mt-12 tech-card p-8 border-primary/10">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-bold text-foreground">SOC 2 Compliant</p>
                  <p className="text-[10px] text-muted-foreground">Security, availability, and confidentiality controls</p>
                </div>
                <div className="text-center">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-bold text-foreground">GDPR Ready</p>
                  <p className="text-[10px] text-muted-foreground">Data protection, right to deletion, and portability</p>
                </div>
                <div className="text-center">
                  <Key className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-bold text-foreground">Zero-Trust Model</p>
                  <p className="text-[10px] text-muted-foreground">Never trust, always verify architecture</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === TECH STACK === */}
        <section id="section-tech" className="py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <Code className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Technology Stack</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Modern Architecture</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Industry-leading technologies powering every message</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techStack.map((tech, i) => (
                <div
                  key={i}
                  className="tech-card p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                      <tech.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{tech.name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-primary">{tech.desc}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{tech.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === PRICING === */}
        <section id="section-pricing" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Pricing</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">No hidden fees. No surprises. Scale as you grow.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`tech-card p-8 ${plan.popular ? 'border-primary/40 bg-primary/[0.03] relative' : ''} hover:border-primary/30 transition-all`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-[0.3em]">
                      Most Popular
                    </div>
                  )}
                  <p className="text-lg font-bold text-foreground mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-foreground font-mono">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${plan.popular ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full h-11 text-xs uppercase tracking-[0.2em] font-bold rounded-none ${plan.popular ? 'tech-btn' : 'border border-border bg-transparent text-foreground hover:bg-muted'}`}>
                    {plan.cta}
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === TESTIMONIALS === */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-10" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Testimonials</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Trusted by Engineering Teams</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <div key={i} className="tech-card p-6 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-none bg-primary/20 flex items-center justify-center text-xs font-black text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{t.content}"</p>
                  <div className="flex gap-1 mt-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="h-3 w-3 fill-primary/60 text-primary/60" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === FAQ === */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-border bg-muted/30 mb-4">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">FAQ</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <div key={i} className="tech-card overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-bold text-foreground pr-4">{item.q}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${activeFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {activeFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === AUTH SECTION === */}
        <section id="auth-section" className="min-h-screen flex items-center justify-center py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.05] via-transparent to-transparent" />

          <div className="relative z-10 w-full max-w-md mx-auto px-6">
            <div className="text-center mb-10">
              <div className="h-16 w-16 rounded-none bg-primary flex items-center justify-center mx-auto mb-6 shadow-sm shadow-primary/20 tech-glow">
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

                    <button
                      onClick={() => { setShowResetPassword(true); setResetEmail(email); setResetMessage(''); }}
                      className="text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary ml-auto -mt-2 mb-2 font-bold transition-colors"
                    >
                      Forgot password?
                    </button>

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

              {/* Password Reset Overlay */}
              {showResetPassword && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-10 p-6 flex flex-col justify-center">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Reset Password</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Enter your email to receive a password reset link.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="tech-input"
                      />
                    </div>
                    {resetMessage && (
                      <div className={cn(
                        "flex items-center gap-2 p-3 border",
                        resetMessage.includes('sent') ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"
                      )}>
                        {resetMessage.includes('sent') ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <p className={cn("text-xs", resetMessage.includes('sent') ? "text-emerald-500" : "text-destructive")}>{resetMessage}</p>
                      </div>
                    )}
                    <Button
                      onClick={async () => {
                        if (!resetEmail.trim()) { setResetMessage('Please enter your email'); return; }
                        setResetMessage('');
                        if (onPasswordReset) {
                          try {
                            await onPasswordReset(resetEmail);
                            setResetMessage('Reset link sent! Check your email.');
                          } catch (err: any) {
                            setResetMessage(err?.message || 'Failed to send reset link');
                          }
                        }
                      }}
                      className="tech-btn w-full h-12"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </Button>
                    <button
                      onClick={() => { setShowResetPassword(false); setResetMessage(''); }}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground w-full text-center font-bold transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              )}
            </Card>

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

        {/* === FINAL CTA === */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.05] to-transparent" />
          <div className="scan-line" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-primary/20 bg-primary/5 mb-6">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Ready to Get Started?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">
              Start Securing Your<br />
              <span className="gradient-text">Communications Today</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Join hundreds of teams already using Concierge for secure, intelligent, real-time communication.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="tech-btn h-12 px-10 text-xs gap-2"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={() => document.getElementById('section-features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-none transition-all"
              >
                View All Features
              </button>
            </div>
          </div>
        </section>

        {/* === FOOTER === */}
        <footer className="border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-none bg-primary flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Concierge</span>
                  <span className="tech-label">v3.0</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  Enterprise-grade real-time communication platform with end-to-end encryption and AI-powered intelligence.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-4">Product</p>
                <ul className="space-y-2">
                  {['Features', 'Security', 'Pricing', 'Changelog'].map(item => (
                    <li key={item}>
                      <button className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-4">Developers</p>
                <ul className="space-y-2">
                  {['Documentation', 'API Reference', 'SDKs', 'Status'].map(item => (
                    <li key={item}>
                      <button className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-4">Company</p>
                <ul className="space-y-2">
                  {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                    <li key={item}>
                      <button className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Concierge Communication Platform v3.0</span>
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


