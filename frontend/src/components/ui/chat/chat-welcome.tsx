import React, { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Card, CardContent } from '../card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { 
  ArrowRight,
  Search,
  Bell,
  MessageSquare,
  Sparkles,
  BarChart3,
  MonitorSmartphone,
  Check,
  Layout as AppIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWelcomeProps {
  onJoin: (name: string) => void;
  currentUser: string;
  onUsernameChange: (username: string) => void;
  isLoading?: boolean;
  onGoogleLogin?: () => void;
  onEmailAuth?: (email: string, password: string, name: string, isSignup: boolean) => Promise<void>;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  onJoin,
  currentUser,
  onUsernameChange,
  isLoading,
  onGoogleLogin,
  onEmailAuth,
}) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [infoPage, setInfoPage] = useState<null | 'product' | 'features' | 'pricing' | 'about' | 'support'>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');

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
    setInfoPage(null);
    setTimeout(() => {
      document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderInfoPage = () => {
    switch (infoPage) {
      case 'features':
        return (
          <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <Button variant="ghost" onClick={() => setInfoPage(null)} className="mb-8 text-slate-400 hover:text-blue-600 gap-2"><ArrowRight className="h-4 w-4 rotate-180" /> Back to Home</Button>
             <h2 className="text-5xl font-black mb-8 tracking-tight">Concierge <span className="text-blue-600">Features.</span></h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'AI Routing', desc: 'Automatically route tickets to the best agent based on sentiment and complexity.', icon: Sparkles },
                  { title: 'Live Analytics', desc: 'Monitor your support health in real-time with granular dashboard views.', icon: BarChart3 },
                  { title: 'Omnichannel', desc: 'Support users across mobile, desktop, and tablet with a unified identity.', icon: MonitorSmartphone },
                  { title: 'Smart Previews', desc: 'See what users are typing before they hit send for faster resolutions.', icon: MessageSquare },
                  { title: 'Automated Status', desc: 'Real-time infrastructure monitoring displayed to every visitor.', icon: Check },
                  { title: 'Agent Directory', desc: 'Unified view of all active support nodes and their current load.', icon: AppIcon },
                ].map((f, i) => (
                  <Card key={i} className="p-8 rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all border">
                     <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <f.icon className="h-7 w-7" />
                     </div>
                     <h4 className="text-xl font-bold mb-3">{f.title}</h4>
                     <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                  </Card>
                ))}
             </div>
          </div>
        );
      case 'pricing':
        return (
          <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <Button variant="ghost" onClick={() => setInfoPage(null)} className="mb-8 text-slate-400 hover:text-blue-600 gap-2"><ArrowRight className="h-4 w-4 rotate-180" /> Back to Home</Button>
             <div className="text-center mb-16">
                <h2 className="text-5xl font-black mb-4 tracking-tight">Simple, Transparent <span className="text-blue-600">Pricing.</span></h2>
                <p className="text-slate-500 font-medium text-lg">Scale your support from solo projects to global enterprises.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <Card className="p-10 rounded-[2.5rem] border-slate-100 shadow-sm border opacity-80">
                   <h4 className="text-xl font-black mb-2 uppercase tracking-widest text-slate-400">Starter</h4>
                   <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black">$0</span>
                      <span className="text-slate-400 font-bold">/forever</span>
                   </div>
                   <ul className="space-y-4 mb-10">
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> 1 Room</li>
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> 24h Message History</li>
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> Basic Analytics</li>
                   </ul>
                   <Button onClick={scrollToAuth} className="w-full rounded-2xl h-12 border-slate-200" variant="outline">Current Plan</Button>
                </Card>
                <Card className="p-10 rounded-[3rem] border-blue-100 shadow-2xl border-2 relative overflow-hidden bg-slate-900 text-white transform scale-105">
                   <div className="absolute top-0 right-0 py-2 px-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rotate-6 translate-x-2 translate-y-2">Popular</div>
                   <h4 className="text-xl font-black mb-2 uppercase tracking-widest text-blue-400">Pro</h4>
                   <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black">$49</span>
                      <span className="text-slate-400 font-bold">/mo</span>
                   </div>
                   <ul className="space-y-4 mb-10 text-slate-300">
                      <li className="flex items-center gap-3 text-sm font-bold"><Check className="h-4 w-4 text-blue-500" /> Unlimited Rooms</li>
                      <li className="flex items-center gap-3 text-sm font-bold"><Check className="h-4 w-4 text-blue-500" /> 7-day Retention</li>
                      <li className="flex items-center gap-3 text-sm font-bold"><Check className="h-4 w-4 text-blue-500" /> Advanced Analytics</li>
                      <li className="flex items-center gap-3 text-sm font-bold"><Check className="h-4 w-4 text-blue-500" /> Custom Branding</li>
                   </ul>
                   <Button onClick={scrollToAuth} className="w-full rounded-2xl h-12 bg-blue-600 hover:bg-blue-700 border-none shadow-xl shadow-blue-500/20 text-white">Upgrade Now</Button>
                </Card>
                <Card className="p-10 rounded-[2.5rem] border-slate-100 shadow-sm border opacity-80">
                   <h4 className="text-xl font-black mb-2 uppercase tracking-widest text-slate-400">Enterprise</h4>
                   <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black">Custom</span>
                   </div>
                   <ul className="space-y-4 mb-10">
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> Self-Hosted Nodes</li>
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> Infinite Data Retention</li>
                      <li className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-green-500" /> Dedicated Account Manager</li>
                   </ul>
                   <Button onClick={scrollToAuth} className="w-full rounded-2xl h-12 border-slate-200" variant="outline">Contact Sales</Button>
                </Card>
             </div>
          </div>
        );
      case 'product':
      case 'about':
        return (
          <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <Button variant="ghost" onClick={() => setInfoPage(null)} className="mb-8 text-slate-400 hover:text-blue-600 gap-2"><ArrowRight className="h-4 w-4 rotate-180" /> Back to Home</Button>
             <div className="max-w-3xl">
                <h2 className="text-5xl font-black mb-8 tracking-tight">The <span className="text-blue-600">Concierge</span> Vision.</h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed mb-6">
                   Modern customer support is broken. It's often too fast, too generic, and lacks the personal touch that builds true brand loyalty.
                </p>
                <p className="text-lg text-slate-500 font-normal leading-relaxed mb-12">
                   Concierge was built to restore the "Human Element" to digital transactions. Our platform creates a high-touch, quiet, and expansive space where every interaction is an opportunity to wow. From real-time infrastructure status to AI-driven ticket sentiment routing, we provide the tools you need to treat every user like a VIP.
                </p>
                <div className="grid grid-cols-2 gap-12">
                   <div>
                      <h4 className="font-black uppercase tracking-widest text-xs text-blue-600 mb-4">Our Mission</h4>
                      <p className="text-sm font-bold text-slate-700">To make every digital chat feel as comfortable and high-end as a five-star hotel concierge lobby.</p>
                   </div>
                   <div>
                      <h4 className="font-black uppercase tracking-widest text-xs text-blue-600 mb-4">Our Tech</h4>
                      <p className="text-sm font-bold text-slate-700">Built on state-of-the-art real-time WebSockets and secure Supabase isolation nodes.</p>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'support':
        return (
          <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-center">
             <Button variant="ghost" onClick={() => setInfoPage(null)} className="mb-8 text-slate-400 hover:text-blue-600 gap-2"><ArrowRight className="h-4 w-4 rotate-180" /> Back to Home</Button>
             <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-8">
                <AppIcon className="h-10 w-10" />
             </div>
             <h2 className="text-4xl font-black mb-4 tracking-tight">Concierge Help Center.</h2>
             <p className="text-slate-500 font-medium text-lg mb-12 max-w-xl mx-auto">Our support nodes are currently scaling. For urgent inquiries, please sign in and join the #Support room.</p>
             <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
                <Button className="h-16 rounded-2xl text-lg font-bold bg-slate-900 border-none shadow-xl hover:bg-slate-800 text-white">Browse API Docs</Button>
                <Button variant="outline" className="h-16 rounded-2xl text-lg font-bold border-slate-200">Contact Human Lead</Button>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/[0.03] bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setInfoPage(null)}>
                <span className="text-xl font-bold tracking-tight text-blue-600">Concierge</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => setInfoPage('about')} className={cn("text-sm font-medium transition-colors hover:text-blue-600", infoPage === 'about' ? "text-blue-600" : "text-slate-500")}>Product</button>
                <button onClick={() => setInfoPage('features')} className={cn("text-sm font-medium transition-colors hover:text-blue-600", infoPage === 'features' ? "text-blue-600" : "text-slate-500")}>Features</button>
                <button onClick={() => setInfoPage('pricing')} className={cn("text-sm font-medium transition-colors hover:text-blue-600", infoPage === 'pricing' ? "text-blue-600" : "text-slate-500")}>Pricing</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex relative items-center">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <Input placeholder="Search resources..." className="pl-9 h-9 w-64 bg-slate-100 border-none rounded-full text-sm" />
              </div>
              <button className="p-2 text-slate-400 hover:text-blue-600">
                <Bell className="h-5 w-5" />
              </button>
              <Button onClick={scrollToAuth} size="sm" className="rounded-full px-6">Sign In</Button>
            </div>
          </div>
        </div>
      </nav>

      {infoPage ? (
        renderInfoPage()
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Support your<br />customers,<br />
                <span className="text-blue-600">better</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                 The most intuitive live chat for modern teams. Experience a quiet, expansive, and high-touch environment that treats your users like VIPs.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                <Button onClick={scrollToAuth} className="rounded-full px-10 h-14 text-white font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-blue-500/20">Initialize Contact</Button>
                <Button variant="ghost" onClick={() => setInfoPage('features')} className="rounded-full px-10 h-14 text-slate-500 font-bold text-lg gap-2">Exploration Portal <ArrowRight className="h-5 w-5" /></Button>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 opacity-40">
                 <div className="flex items-center gap-2 grayscale grayscale-1"><Sparkles className="h-6 w-6" /><span className="font-black uppercase tracking-widest text-xs">Innovation Partner</span></div>
                 <div className="flex items-center gap-2 grayscale grayscale-1"><BarChart3 className="h-6 w-6" /><span className="font-black uppercase tracking-widest text-xs">ISO Certified</span></div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-2xl">
                <div className="relative p-2 rounded-[2.5rem] bg-slate-100 border border-slate-200 shadow-2xl">
                  <div className="rounded-[2rem] overflow-hidden border border-black/5 aspect-[4/3] bg-slate-900 flex items-center justify-center">
                     <div className="w-full h-full p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                           <div className="h-6 w-32 bg-white/10 rounded-full" />
                           <div className="h-6 w-6 bg-white/10 rounded-full" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                           <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
                              <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                              <div className="h-8 w-1/2 bg-white/20 rounded-full" />
                           </div>
                           <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
                              <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                              <div className="h-8 w-1/2 bg-white/20 rounded-full" />
                           </div>
                        </div>
                        <div className="h-32 bg-white/5 rounded-3xl" />
                     </div>
                  </div>
                  <div className="absolute -left-6 bottom-1/4 p-4 rounded-2xl bg-white shadow-2xl border border-slate-100 max-w-[200px] animate-bounce duration-[3000ms]">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-2 w-2 rounded-full bg-orange-400" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Live Activity</span>
                    </div>
                    <p className="text-[11px] font-bold leading-snug">New ticket from Sarah J.<br /><span className="text-slate-400 font-medium">"This concierge experience is flawless!"</span></p>
                 </div>
                 
                 <div className="absolute -right-10 top-1/2 p-4 rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-500/30 text-white flex items-center gap-3 animate-pulse duration-[4000ms]">
                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                       <AppIcon size={16} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Active Leads</p>
                       <p className="text-sm font-bold">1.2k Nodes Online</p>
                    </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Features Grid (Main Landing) */}
          <section className="py-24 px-4 max-w-7xl mx-auto bg-slate-50 rounded-[3rem] border border-slate-100 mb-20 animate-in fade-in duration-1000">
             <div className="text-center mb-16">
                <h2 className="text-4xl font-black mb-4 tracking-tight">Precision-engineered for support</h2>
                <p className="text-slate-500 font-medium text-lg">We've stripped away the clutter to focus on what matters most.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-10 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all">
                   <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                      <MessageSquare className="h-6 w-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-4">Fluid Conversations</h4>
                   <p className="text-slate-500 font-medium leading-relaxed italic opacity-80">"The fastest chat interface I've ever used. My team was on-boarded in minutes."</p>
                </Card>
                <Card className="p-10 rounded-[2.5rem] bg-blue-600 text-white border-none shadow-2xl shadow-blue-500/20 transform -rotate-1">
                   <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                      <Sparkles className="h-6 w-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-4">AI Triage</h4>
                   <p className="text-blue-100 font-medium leading-relaxed">Automated sentiment analysis and ticket routing systems active on every node.</p>
                </Card>
                <Card className="p-10 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all">
                   <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-6">
                      <MonitorSmartphone className="h-6 w-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-4">Device Agnostic</h4>
                   <p className="text-slate-500 font-medium leading-relaxed opacity-80">Full PWA support for seamless handoffs between desktop and mobile agents.</p>
                </Card>
             </div>
          </section>

          {/* Auth Section */}
          <section id="auth-section" className="py-24 px-4 max-w-xl mx-auto">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden p-10 bg-white border relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-50 p-1 rounded-2xl h-14">
                       <TabsTrigger value="signin" className="rounded-xl font-bold text-sm">Access Node</TabsTrigger>
                       <TabsTrigger value="signup" className="rounded-xl font-bold text-sm">Register</TabsTrigger>
                    </TabsList>
                    
                    <form onSubmit={handleEmailAuth} className="space-y-6">
                       {activeTab === 'signup' && (
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Identity</label>
                             <Input 
                                placeholder="Enter your full name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-medium" 
                                required
                             />
                          </div>
                       )}
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-Mail Address</label>
                          <Input 
                             type="email" 
                             placeholder="name@company.com" 
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-medium" 
                             required
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Secure Key</label>
                          <Input 
                             type="password" 
                             placeholder="••••••••" 
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-medium" 
                             required
                          />
                       </div>
                       
                       {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                       
                       <Button type="submit" disabled={emailLoading} className="w-full h-14 rounded-2xl text-lg font-bold bg-slate-900 border-none shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-white">
                          {emailLoading ? 'Authenticating...' : (activeTab === 'signup' ? 'Initialize Workspace' : 'Authorize Access')}
                          {!emailLoading && <ArrowRight className="h-5 w-5" />}
                       </Button>
                    </form>
                 </Tabs>
                 
                 <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <Button onClick={onGoogleLogin} variant="outline" className="w-full h-12 rounded-2xl border-slate-200 font-bold gap-3 hover:bg-slate-50">
                       <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                       </svg>
                       Continue with Google
                    </Button>
                 </div>
              </Card>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-slate-100 py-20 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <span className="text-xl font-bold text-blue-600 mb-6 block cursor-pointer" onClick={() => setInfoPage(null)}>Concierge</span>
            <p className="text-slate-500 max-w-xs font-medium leading-relaxed mb-8">
              The digital concierge for modern commerce. Elevate your brand with premium customer support experiences.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-50">Product</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><button onClick={() => setInfoPage('features')} className="hover:text-blue-600 transition-colors">Features</button></li>
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">Integrations</button></li>
              <li><button onClick={() => setInfoPage('pricing')} className="hover:text-blue-600 transition-colors">Pricing</button></li>
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">Changelog</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-50">Company</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">About Us</button></li>
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">Careers</button></li>
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">Blog</button></li>
              <li><button onClick={() => setInfoPage('about')} className="hover:text-blue-600 transition-colors">Press Kit</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-50">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><button onClick={() => setInfoPage('support')} className="hover:text-blue-600 transition-colors">Help Center</button></li>
              <li><button onClick={() => setInfoPage('support')} className="hover:text-blue-600 transition-colors">API Docs</button></li>
              <li><button onClick={() => setInfoPage('support')} className="hover:text-blue-600 transition-colors">Security</button></li>
              <li><button onClick={() => setInfoPage('support')} className="hover:text-blue-600 transition-colors">Contact</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400">
           <span>© 2026 Concierge. All rights reserved.</span>
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Systems Operational</span>
           </div>
        </div>
      </footer>
    </div>
  );
};
