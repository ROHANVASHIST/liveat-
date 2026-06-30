import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Clock, 
  Users,
  Search,
  Activity,
  ArrowUpRight,
  Shield,
  Terminal,
  Cpu,
  Database
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export const AnalyticsDashboard: React.FC<{ data?: any, messagesCount?: number, activeUsers?: number, users?: any[] }> = ({ messagesCount = 0, activeUsers = 0, users = [] }) => {
  const stats = [
    { label: 'Session_Packets', value: messagesCount.toLocaleString(), trend: '+12.4%', color: 'text-primary', icon: MessageSquare },
    { label: 'Active_Nodes', value: `${activeUsers}`, trend: 'Stable', color: 'text-green-500', icon: Activity },
    { label: 'Thread_Latency', value: '24ms', trend: 'Low', color: 'text-primary/70', icon: Clock },
    { label: 'System_Uptime', value: '99.98%', trend: 'Nominal', color: 'text-primary', icon: Shield },
  ];

  const agents = users.map(u => ({
     name: u.name,
     avatar: u.avatar,
     status: u.status === 'online' ? 'Active' : 'Offline',
     id: u.id?.toString().substring(0, 8) || 'UNKNOWN',
     load: Math.floor(Math.random() * 40) + 10 + '%',
     health: '98%'
  }));

  return (
    <div className="flex flex-col h-full bg-background font-mono text-foreground overflow-hidden">
      {/* Header - Technical Control */}
      <header className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={20} className="text-primary" />
          <h1 className="text-sm font-bold uppercase tracking-[0.3em]">System_Monitor::Analytics</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input placeholder="SCAN_LOGS..." className="bg-muted/30 border border-border focus:border-primary/50 h-9 pl-9 pr-4 text-[10px] uppercase tracking-widest outline-none w-48" />
           </div>
           <div className="h-4 w-[1px] bg-border mx-2" />
           <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Encrypted Connection</span>
              <Shield size={12} className="text-primary" />
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {/* Real-time Matrix Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
             <div key={i} className="tech-card p-4 flex flex-col justify-between border-primary/10 hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <div className="h-10 w-10 border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <stat.icon size={18} />
                   </div>
                   <span className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-primary/20 bg-primary/5", stat.color)}>
                      {stat.trend}
                   </span>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">{stat.label}</p>
                   <h3 className="text-xl font-bold tracking-tighter">{stat.value}</h3>
                </div>
             </div>
          ))}
        </div>

        {/* Neural Network Pulse (Chart) */}
        <div className="tech-card p-6 overflow-hidden border-primary/10">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest">Network_Throughput::Matrix</h3>
                 <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Packet density over time-series data</p>
              </div>
              <div className="flex border border-border bg-muted/20">
                 <button className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-primary text-primary-foreground">Live</button>
                 <button className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground">History</button>
              </div>
           </div>
           
           <div className="h-48 w-full flex items-end gap-1 relative overflow-hidden">
              {/* Technical Grid/Pulse Lines */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 opacity-10 pointer-events-none">
                 {Array.from({length: 48}).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-primary/20" />
                 ))}
              </div>
              
              {/* Simulated Data Points */}
              {Array.from({length: 40}).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-primary/40 w-full hover:bg-primary transition-colors cursor-crosshair mt-auto" 
                  style={{ height: `${Math.random() * 80 + 10}%` }}
                />
              ))}
              
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/30" />
           </div>
           
           <div className="flex justify-between mt-4 text-[8px] uppercase tracking-[0.3em] text-muted-foreground opacity-50">
              <span>0% LOAD</span>
              <span>BUFFER STATUS: NOMINAL</span>
              <span>100% LOAD</span>
           </div>
        </div>

        {/* Node Performance Matrix (Table) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest">Operator_Node::Sync_Index</h3>
                 <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Active synchronization status for all assigned operators</p>
              </div>
              <button className="h-8 px-4 border border-border hover:border-primary text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all">
                 <Database size={10} />
                 Dump Registry
              </button>
           </div>

           <div className="tech-card overflow-hidden border-primary/10">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-muted/20 border-b border-border">
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Node Identity</th>
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Node ID</th>
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Current Load</th>
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Stability</th>
                       <th className="px-6 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {agents.map((agent, i) => (
                       <tr key={i} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7 border rounded-none border-border group-hover:border-primary/50 transition-colors overflow-hidden">
                                   <AvatarImage src={agent.avatar} className="grayscale" />
                                   <AvatarFallback className="text-[8px] rounded-none flex items-center justify-center h-full w-full">{agent.name ? agent.name[0] : 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">{agent.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                   "h-1.5 w-1.5 rounded-full",
                                   agent.status === 'Active' ? "bg-primary animate-tech-pulse" : "bg-muted-foreground opacity-30"
                                )} />
                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">{agent.status}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-muted-foreground font-mono">{agent.id}</td>
                          <td className="px-6 py-4">
                             <div className="w-24 h-1.5 bg-muted/50 border border-border overflow-hidden">
                                <div className="h-full bg-primary/40" style={{ width: agent.load }} />
                             </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-primary">{agent.health}</td>
                          <td className="px-6 py-4">
                             <button className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                <Cpu size={10} /> Sync
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
};
