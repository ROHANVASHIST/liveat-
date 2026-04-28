import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  LogOut, 
  Camera, 
  Globe, 
  Mail, 
  ChevronRight,
  Monitor,
  Volume2,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';
import { AvatarImage } from './avatar';
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
  theme: string;
  onThemeChange: (theme: 'black' | 'light') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onLogout, theme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Operator_Identity', icon: User },
    { id: 'widget', label: 'Theme_Config', icon: Palette },
    { id: 'notifications', label: 'Signal_Rules', icon: Bell },
    { id: 'integrations', label: 'External_Mesh', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full bg-background font-mono text-foreground animate-in fade-in duration-500 overflow-hidden">
      {/* Header - System Protocol */}
      <header className="p-8 pb-4 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
              <Terminal size={24} className="text-primary" />
              <h1 className="text-sm font-bold uppercase tracking-[0.4em]">Protocol::Configuration_Node</h1>
           </div>
           <div className="flex items-center gap-4 border border-border px-3 py-1.5 bg-background">
              <Activity size={12} className="text-primary animate-tech-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status: Read/Write</span>
           </div>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Authorized change-set for operator environmental variables.</p>
      </header>

      <div className="flex-1 flex gap-8 p-8 overflow-hidden">
        {/* Navigation Matrix */}
        <aside className="w-64 space-y-1">
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4 opacity-50 px-2 font-bold">Subsystem Index</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 transition-all border",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "text-muted-foreground border-transparent hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold">
                <item.icon size={14} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight size={12} />}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-border">
             <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                <LogOut size={14} />
                Terminate_Session
             </button>
          </div>
        </aside>

        {/* Configuration Matrix Area */}
        <main className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="tech-card p-8 bg-muted/10 border-primary/10 transition-all">
                <div className="flex items-start justify-between mb-8 pb-8 border-b border-border">
                   <div className="flex items-center gap-8">
                      <div className="relative group">
                         <div className="h-24 w-24 border border-primary/20 overflow-hidden bg-background flex items-center justify-center text-3xl font-bold group-hover:border-primary transition-all">
                            {avatar ? (
                               <img src={avatar} alt="identity" className="w-full h-full object-cover grayscale brightness-125" />
                            ) : (
                               <span className="text-primary">{user.name?.[0] || 'O'}</span>
                            )}
                         </div>
                         <input 
                           type="file" 
                           id="avatarUpload" 
                           className="hidden" 
                           onChange={handleAvatarChange} 
                         />
                         <label htmlFor="avatarUpload" className="absolute -bottom-2 -right-2 h-7 w-7 border border-primary bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg">
                            <Camera size={14} />
                         </label>
                      </div>
                      <div>
                         <h3 className="text-lg font-bold uppercase tracking-widest">{user.name}</h3>
                         <div className="flex flex-col gap-1.5 mt-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">ID: {user.email || 'operator_001'}</span>
                            <span className="text-[10px] text-primary uppercase tracking-widest font-bold">Role: Node_Administrator</span>
                         </div>
                         <div className="mt-4 flex gap-2">
                           <span className="text-[8px] border border-primary/20 bg-primary/5 px-2 py-0.5 text-primary uppercase tracking-widest font-bold">Tier_Access v3.0</span>
                           <span className="text-[8px] border border-border bg-muted/20 px-2 py-0.5 text-muted-foreground uppercase tracking-widest font-bold">Kernel_Core</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => onUpdate({ name, email, avatar })} className="tech-btn h-10 px-8 text-[10px] uppercase tracking-widest font-bold">Compile Changes</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Identity Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} className="w-full h-11 bg-background border border-border focus:border-primary/50 px-4 text-[11px] uppercase tracking-widest outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Primary Routing E-Mail</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 bg-background border border-border focus:border-primary/50 px-4 text-[11px] uppercase tracking-widest outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Access_Key (Current)</label>
                      <input type="password" value="********" readOnly className="w-full h-11 bg-muted/20 border border-border px-4 text-[11px] uppercase tracking-widest outline-none opacity-50" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Access_Key (New)</label>
                      <input type="password" placeholder="LEAVE BLANK TO RETAIN" className="w-full h-11 bg-background border border-border focus:border-primary/50 px-4 text-[11px] uppercase tracking-widest outline-none transition-all" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'widget' && (
             <div className="space-y-8">
               <div className="tech-card p-8 bg-muted/10 border-primary/10 transition-all">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] mb-6">Monochrome Overlay Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                     <button
                       onClick={() => onThemeChange('black')}
                       className={cn(
                         "h-auto p-4 border transition-all flex flex-col items-start gap-4 relative group",
                         theme === 'black' ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]" : "border-border hover:border-primary/20 bg-background"
                       )}
                     >
                        <div className="flex items-center justify-between w-full">
                           <div className="h-6 w-6 border-2 border-white/10 bg-[#0a0a0a]" />
                           {theme === 'black' && <Activity size={12} className="text-primary animate-tech-pulse" />}
                        </div>
                        <div className="text-left mt-2">
                           <p className="text-[11px] font-bold uppercase tracking-widest">Dark Protocol</p>
                        </div>
                     </button>
                     <button
                       onClick={() => onThemeChange('light')}
                       className={cn(
                         "h-auto p-4 border transition-all flex flex-col items-start gap-4 relative group",
                         theme === 'light' ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]" : "border-border hover:border-primary/20 bg-background"
                       )}
                     >
                        <div className="flex items-center justify-between w-full">
                           <div className="h-6 w-6 border-2 border-black/10 bg-white" />
                           {theme === 'light' && <Activity size={12} className="text-primary animate-tech-pulse" />}
                        </div>
                        <div className="text-left mt-2">
                           <p className="text-[11px] font-bold uppercase tracking-widest">Light Protocol</p>
                        </div>
                     </button>
                  </div>
               </div>
             </div>
           )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
               {[
                 { id: 'desktop', title: 'Desktop_Relay', desc: 'Push priority signal alerts to secondary hardware nodes.', icon: Monitor },
                 { id: 'email', title: 'Digest_Snapshot', icon: Mail, desc: 'Temporal analysis report delivered to operator inbox.' },
                 { id: 'sound', title: 'Acoustic_Signals', desc: 'Synthesized audio cues for critical event detection.', icon: Volume2 },
               ].map((pref) => (
                 <div key={pref.id} className="tech-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all border-primary/10">
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <pref.icon size={20} />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">{pref.title}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-50 mt-1.5 max-w-sm">{pref.desc}</p>
                       </div>
                    </div>
                    <button className={cn(
                       "h-5 w-10 border transition-all relative",
                       pref.id === 'desktop' || pref.id === 'sound' ? "border-primary bg-primary/10" : "border-border bg-muted/20"
                    )}>
                       <div className={cn(
                         "h-full w-5 transition-transform",
                         pref.id === 'desktop' || pref.id === 'sound' ? "bg-primary translate-x-full" : "bg-muted-foreground translate-x-0 opacity-30"
                       )} />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </main>
      </div>

      {/* Persistence Ledger Footer */}
      <footer className="p-6 border-t border-border bg-muted/10 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
         <div className="flex items-center gap-3">
            <span className="text-foreground">Concierge_OS.</span>
            <span className="opacity-30">|</span>
            <span>Kernel_Persistence_Ledger</span>
         </div>
         <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">Log_Registry</a>
            <a href="#" className="hover:text-primary transition-colors">Security_Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Core_Status</a>
         </div>
      </footer>
    </div>
  );
};
