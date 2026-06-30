import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, MessageSquare, Users, Settings, Zap, Sparkles, Terminal, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const actions = [
    { id: 'new_chat', label: 'Initialize_New_Session', icon: MessageSquare, category: 'General' },
    { id: 'view_nodes', label: 'Query_Agent_Nodes', icon: Zap, category: 'Neural' },
    { id: 'system_status', label: 'Diagnostic_System_Health', icon: Sparkles, category: 'Kernel' },
    { id: 'settings', label: 'Modify_Subsystem_Config', icon: Settings, category: 'Settings' },
    { id: 'members', label: 'Monitor_Active_Nodes', icon: Users, category: 'General' },
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none font-mono">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
           initial={{ scale: 0.98, opacity: 0, y: 10 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           exit={{ scale: 0.98, opacity: 0, y: 10 }}
           className="w-full max-w-2xl bg-background border border-primary/20 shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden pointer-events-auto relative z-10"
        >
           {/* Terminal Input */}
           <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-4">
              <div className="h-10 w-10 border border-border flex items-center justify-center text-primary">
                 <Terminal size={18} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                 <div className="flex items-center gap-2 opacity-40">
                   <span className="text-[8px] uppercase tracking-[0.3em] font-bold">System_Override v4.0.1</span>
                   <span className="h-[1px] flex-1 bg-border" />
                 </div>
                 <input 
                   autoFocus
                   placeholder="EXECUTE_CMD >_"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/30 uppercase tracking-[0.2em]"
                 />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                 <span className="text-[9px] border border-border px-1.5 py-0.5 text-muted-foreground uppercase font-bold tracking-widest bg-muted/20">ESC_ABORT</span>
              </div>
           </div>

           {/* Command Feed */}
           <div className="max-h-[450px] overflow-y-auto p-2 scrollbar-hide">
              {filtered.length === 0 ? (
                 <div className="py-20 text-center border border-dashed border-border m-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Result_Null: No matching protocols found.</p>
                 </div>
              ) : (
                 <div className="space-y-4 p-2">
                    {['General', 'Neural', 'Kernel', 'Settings'].map(cat => {
                       const catActions = filtered.filter(a => a.category === cat);
                       if (catActions.length === 0) return null;
                       return (
                          <div key={cat} className="space-y-2">
                             <div className="flex items-center gap-3 px-2">
                               <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary whitespace-nowrap">{cat}</h4>
                               <div className="h-[1px] w-full bg-primary/10" />
                             </div>
                             <div className="grid grid-cols-1 gap-1">
                                {catActions.map(action => (
                                   <button
                                      key={action.id}
                                      onClick={() => {
                                         onSelect(action.id);
                                         onClose();
                                      }}
                                      className="w-full flex items-center gap-4 px-4 py-3 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                                   >
                                      <div className="h-9 w-9 border border-border group-hover:border-primary/50 flex items-center justify-center transition-colors">
                                         <action.icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                      <div className="flex-1 flex flex-col gap-0.5">
                                         <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80 group-hover:text-foreground">{action.label}</span>
                                         <span className="text-[8px] uppercase tracking-widest text-muted-foreground opacity-40 group-hover:opacity-70 transition-opacity">Path: /root/exec/{action.id}</span>
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                         <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Execute</span>
                                         <Zap size={10} className="text-primary fill-primary/20" />
                                      </div>
                                   </button>
                                ))}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>

           {/* Feedback Subsystem */}
           <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                    <span className="opacity-40">NAV:</span>
                    <span className="border border-border px-1 text-foreground">↑↓</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="opacity-40">SELECT:</span>
                    <span className="border border-border px-1 text-foreground">ENTER</span>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-primary animate-tech-pulse" />
                    <span>Secure_Link_Active</span>
                 </div>
                 <Activity size={10} className="text-primary" />
              </div>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
