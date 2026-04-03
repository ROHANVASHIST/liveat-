import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  LogOut, 
  Check, 
  Camera, 
  Smartphone, 
  Globe, 
  Mail, 
  Lock,
  Layout,
  MessageSquare,
  ChevronRight,
  Monitor,
  Volume2,
  ArrowRight
} from 'lucide-react';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from './avatar';
import { Button } from './button';
import { Input } from './input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    bio?: string;
  };
  onUpdate: (data: any) => void;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  
  const [themeColor, setThemeColor] = useState('#0066cc');
  const [roundness, setRoundness] = useState('modern');
  const [position, setPosition] = useState('right');

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'widget', label: 'Widget Customization', icon: Layout },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <header className="p-8 pb-0">
        <div className="flex items-center justify-between mb-2">
           <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                 <Bell className="h-5 w-5 text-slate-400" />
              </Button>
              <Avatar className="h-10 w-10 border border-slate-200">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
           </div>
        </div>
        <p className="text-slate-500 font-medium">Personalize your concierge experience and interface behavior.</p>
      </header>

      <div className="flex-1 flex gap-8 p-8 overflow-hidden">
        {/* Sub Navigation */}
        <aside className="w-64 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 h-auto group",
                activeTab === item.id 
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                  : "text-slate-400 hover:bg-slate-200/50 hover:text-slate-600"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight className="h-3 w-3" />}
            </Button>
          ))}
          <div className="pt-8 mt-8 border-t border-slate-200">
             <Button onClick={onLogout} variant="ghost" className="w-full flex items-center gap-3 px-4 py-3 h-auto text-red-500 hover:bg-red-50 hover:text-red-600 bg-transparent">
                <LogOut className="h-4 w-4" />
                Sign Out
             </Button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <Card className="rounded-[2.5rem] border-slate-200 shadow-sm p-8">
                <div className="flex items-start justify-between mb-8">
                   <div className="flex items-center gap-6">
                      <div className="relative group">
                         <div className="h-24 w-24 rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
                            <img src={user.avatar || `https://i.pravatar.cc/200?u=${user.name}`} alt="profile" className="w-full h-full object-cover" />
                         </div>
                         <Button variant="default" size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white group-hover:scale-110">
                            <Camera className="h-4 w-4" />
                         </Button>
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold">{user.name}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-slate-400">Concierge Admin • Joined Oct 2023</span>
                         </div>
                         <Badge variant="outline" className="mt-3 bg-slate-100 text-[10px] font-black border-slate-200 text-slate-500 uppercase tracking-widest px-2 py-0.5">Premium Tier</Badge>
                      </div>
                   </div>
                   <Button onClick={() => onUpdate({ name, email })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-6">Save Changes</Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Display Name</label>
                      <Input value={name} onChange={e => setName(e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl font-medium" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                      <Input value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl font-medium" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Current Password</label>
                      <Input type="password" value="********" readOnly className="h-12 bg-white border-slate-200 rounded-xl font-medium" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">New Password</label>
                      <Input type="password" placeholder="Leave blank to keep current" className="h-12 bg-white border-slate-200 rounded-xl font-medium" />
                   </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'widget' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <Card className="rounded-[2.5rem] border-slate-200 shadow-sm p-8">
                  <div className="flex flex-col lg:flex-row gap-12">
                     <div className="flex-1 space-y-8">
                        <div>
                           <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Theme Color</h4>
                           <div className="flex gap-4">
                              {['#0066cc', '#10b981', '#8b5cf6', '#f59e0b', '#1e293b'].map(c => (
                                 <Button
                                   key={c}
                                   variant="ghost"
                                   onClick={() => setThemeColor(c)}
                                   className={cn(
                                     "h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-200 shadow-sm group relative p-0",
                                     themeColor === c && "ring-blue-600"
                                   )}
                                   style={{ backgroundColor: c }}
                                 >
                                    {themeColor === c && <Check className="absolute inset-0 m-auto h-3 w-3 text-white" />}
                                 </Button>
                              ))}
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-dashed border-slate-300 text-slate-400">+</Button>
                           </div>
                        </div>

                        <div>
                           <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Border Roundness</h4>
                           <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                              {['sharp', 'modern', 'playful'].map(r => (
                            <Button
                               key={r}
                               variant={roundness === r ? "default" : "ghost"}
                               onClick={() => setRoundness(r)}
                               className={cn(
                                  "px-6 py-2 h-auto text-xs font-bold capitalize transition-all",
                                  roundness === r ? "shadow-lg" : "text-slate-500 hover:text-slate-700"
                               )}
                            >
                               {r}
                            </Button>
                              ))}
                           </div>
                        </div>

                        <div>
                           <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Positioning</h4>
                           <div className="flex items-center gap-8">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                 <div className={cn("h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-600", position === 'right' && "border-blue-600")}>
                                    {position === 'right' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                                 </div>
                                 <input type="radio" value="right" checked={position === 'right'} onChange={() => setPosition('right')} className="hidden" />
                                 <span className="text-sm font-bold text-slate-600">Bottom Right</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer group">
                                 <div className={cn("h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-600", position === 'left' && "border-blue-600")}>
                                    {position === 'left' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                                 </div>
                                 <input type="radio" value="left" checked={position === 'left'} onChange={() => setPosition('left')} className="hidden" />
                                 <span className="text-sm font-bold text-slate-600">Bottom Left</span>
                              </label>
                           </div>
                        </div>
                     </div>

                     <div className="lg:w-1/3">
                        <div className="h-full min-h-[300px] rounded-3xl bg-slate-50 border border-slate-200 border-dashed p-6 flex flex-col items-center justify-center relative overflow-hidden">
                           <span className="text-[10px] font-black uppercase text-slate-300 absolute top-4 left-6">Live Preview</span>
                           <div className="w-full max-w-[240px] rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-fade-up">
                              <div className="p-3 bg-blue-600 text-white flex items-center justify-between" style={{ backgroundColor: themeColor }}>
                                 <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-400" />
                                    <span className="text-[10px] font-bold">Concierge Live</span>
                                 </div>
                                 <div className="h-3 w-3 bg-white/20 rounded-full" />
                              </div>
                              <div className="p-4 space-y-3">
                                 <div className="bg-slate-100 p-2 rounded-lg rounded-tl-none w-3/4 text-[9px] font-medium leading-tight">
                                    Hello! How can I assist you today?
                                 </div>
                                 <div className="bg-blue-100 p-2 rounded-lg rounded-tr-none w-3/4 ml-auto text-[9px] font-medium leading-tight text-blue-600" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
                                    I need to track my order.
                                 </div>
                              </div>
                              <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                                 <div className="flex-1 h-6 bg-slate-50 rounded-full" />
                                 <div className="h-4 w-4 text-blue-600" style={{ color: themeColor }}>
                                    <ArrowRight className="h-4 w-4" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               {[
                 { id: 'desktop', title: 'Desktop Alerts', desc: 'Receive push notifications even when Concierge is in the background.', icon: Monitor, defaultChecked: true },
                 { id: 'email', title: 'Email Summaries', desc: 'Get a daily digest of missed chats and engagement metrics.', icon: Mail, defaultChecked: false },
                 { id: 'sound', title: 'Sound Notifications', desc: 'Play a subtle alert sound for incoming messages.', icon: Volume2, defaultChecked: true },
               ].map((pref) => (
                 <Card key={pref.id} className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center justify-between group hover:border-blue-600/30 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <pref.icon className="h-6 w-6" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{pref.title}</p>
                          <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">{pref.desc}</p>
                       </div>
                    </div>
                    <div className={cn(
                       "h-6 w-11 rounded-full p-1 cursor-pointer transition-all duration-300",
                       pref.defaultChecked ? "bg-blue-600" : "bg-slate-200"
                    )}>
                       <div className={cn(
                         "h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                         pref.defaultChecked ? "translate-x-5" : "translate-x-0"
                       )} />
                    </div>
                 </Card>
               ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer Branding */}
      <footer className="p-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
         <div className="flex items-center gap-2">
            <span className="text-slate-900">Concierge.</span>
            <span>Powered by Digital Concierge AI</span>
         </div>
         <div className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">System Status</a>
         </div>
      </footer>
    </div>
  );
};
