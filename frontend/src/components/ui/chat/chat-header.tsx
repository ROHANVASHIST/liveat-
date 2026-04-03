import React from 'react';
import { Button } from '../button';
import { Badge } from '../badge';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  Menu, 
  Settings, 
  UserPlus, 
  Info, 
  Phone, 
  Video,
  Search,
  MoreVertical
} from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onlineCount?: number;
  onBack?: () => void;
  onSettings?: () => void;
  onAddContact?: () => void;
  onToggleSidebar?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  onlineCount,
  onBack,
  onSettings,
  onAddContact,
  onToggleSidebar,
}) => {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl z-40 relative">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden h-10 w-10 border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">{title}</h2>
            {onlineCount !== undefined && onlineCount > 0 && (
               <div className="flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{onlineCount} Online</span>
               </div>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 mr-4 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 group focus-within:border-blue-600/30 transition-all">
           <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600" />
           <input placeholder="Search messages..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300 w-32" />
        </div>
        
        <div className="flex items-center gap-1.5">
           <Button variant="outline" size="icon" className="h-10 w-10">
              <Phone className="h-4 w-4 text-slate-400" />
           </Button>
           <Button variant="outline" size="icon" className="h-10 w-10">
              <Video className="h-4 w-4 text-slate-400" />
           </Button>
           <div className="w-[1px] h-6 bg-slate-100 mx-1" />
           <Button onClick={onSettings} variant="outline" size="icon" className="h-10 w-10">
              <Info className="h-4 w-4 text-slate-400" />
           </Button>
           <Button variant="ghost" size="icon" className="h-10 w-10">
              <MoreVertical className="h-5 w-5 text-slate-400" />
           </Button>
        </div>
      </div>
    </header>
  );
};
