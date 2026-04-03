import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './card';
import { 
  BarChart3, 
  MessageSquare, 
  Clock, 
  Star, 
  Users,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  MoreHorizontal,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

export const AnalyticsDashboard: React.FC<{ data?: any, messagesCount?: number, activeUsers?: number }> = ({ data, messagesCount = 0, activeUsers = 0 }) => {
  const stats = [
    { label: 'Session Messages', value: messagesCount.toLocaleString(), trend: '+100%', color: 'text-blue-500', bg: 'bg-blue-50', icon: MessageSquare },
    { label: 'Network Activity', value: `${activeUsers} Nodes`, trend: 'Active', color: 'text-green-500', bg: 'bg-green-50', icon: BarChart3 },
    { label: 'Latency Node', value: '24ms', trend: 'Stable', color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock },
    { label: 'Uptime', value: '99.9%', trend: null, color: '', bg: 'bg-slate-50', icon: Shield },
  ];

  const agents = [
    { name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/100?img=1', status: 'Active', resolved: 482, time: '4m 12s', csat: 4.9, trend: 'up' },
    { name: 'Marcus Bennett', avatar: 'https://i.pravatar.cc/100?img=2', status: 'Active', resolved: 415, time: '5m 04s', csat: 4.7, trend: 'up' },
    { name: 'Elena Lopez', avatar: 'https://i.pravatar.cc/100?img=3', status: 'Offline', resolved: 398, time: '3m 45s', csat: 4.8, trend: 'neutral' },
    { name: 'David Wu', avatar: 'https://i.pravatar.cc/100?img=4', status: 'Active', resolved: 356, time: '6m 22s', csat: 4.5, trend: 'down' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <header className="p-8 pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-6">
           <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Search reports..." className="pl-9 h-10 w-64 bg-white border-slate-200 rounded-xl text-sm" />
           </div>
           <div className="flex items-center gap-4 border-l border-slate-200 pl-6 text-slate-400">
              <Bell className="h-5 w-5 hover:text-blue-600 cursor-pointer transition-colors" />
              <Avatar className="h-8 w-8 border border-slate-200">
                 <AvatarImage src="https://i.pravatar.cc/100?img=12" />
                 <AvatarFallback>M</AvatarFallback>
              </Avatar>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 pt-4 space-y-8 scrollbar-hide">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
             <Card key={i} className="rounded-3xl border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-blue-600 bg-blue-50")}>
                      <stat.icon className="h-6 w-6" />
                   </div>
                   {stat.trend && (
                      <Badge variant="outline" className={cn("text-[10px] font-bold border-none", stat.bg, stat.color)}>
                         {stat.trend}
                      </Badge>
                   )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black">{stat.value}</h3>
                </div>
             </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden p-8">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-bold">Chat Volume</h3>
                 <p className="text-xs font-medium text-slate-400">Daily interactions over the last 30 days</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button className="px-4 py-1.5 rounded-lg bg-white text-xs font-bold shadow-sm">30 Days</button>
                 <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500">90 Days</button>
              </div>
           </div>
           
           <div className="h-64 w-full flex items-end gap-2 px-2 relative group">
              {/* Fake Line Chart Representation */}
              <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 1000 200" preserveAspectRatio="none">
                 <path 
                   d="M0,150 Q100,160 200,140 T400,120 T600,160 T800,100 T1000,130" 
                   fill="none" 
                   stroke="#0066cc" 
                   strokeWidth="3" 
                   className="animate-fade-up"
                 />
                 <path 
                   d="M0,150 Q100,160 200,140 T400,120 T600,160 T800,100 T1000,130 L1000,200 L0,200 Z" 
                   fill="url(#gradient)" 
                   className="opacity-10"
                 />
                 <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#0066cc" />
                     <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                 </defs>
              </svg>
              <div className="absolute bottom-0 left-0 w-full flex justify-between px-8 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4">
                 <span>Oct 01</span>
                 <span>Oct 08</span>
                 <span>Oct 15</span>
                 <span>Oct 22</span>
                 <span>Oct 30</span>
              </div>
           </div>
        </Card>

        {/* Agent Table */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-xl font-bold">Agent Performance Breakdown</h3>
                 <p className="text-xs font-medium text-slate-400">Key metrics sorted by resolution rate</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 text-slate-500 text-xs font-bold gap-2">
                 <ArrowUpRight className="h-4 w-4" />
                 Export Report
              </Button>
           </div>

           <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Name</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Resolved</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Handle Time</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CSAT Score</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trend</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {agents.map((agent, i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-slate-100">
                                   <AvatarImage src={agent.avatar} />
                                   <AvatarFallback>{agent.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-bold text-slate-700">{agent.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <Badge className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 border-none",
                                agent.status === 'Active' ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"
                             )}>
                                {agent.status}
                             </Badge>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{agent.resolved}</td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{agent.time}</td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-slate-700">{agent.csat}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             {agent.trend === 'up' && <ArrowUpRight className="h-5 w-5 text-green-500" />}
                             {agent.trend === 'neutral' && <ArrowRight className="h-5 w-5 text-slate-300" />}
                             {agent.trend === 'down' && <ArrowDownRight className="h-5 w-5 text-red-500" />}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </Card>
        </div>
      </main>
    </div>
  );
};
