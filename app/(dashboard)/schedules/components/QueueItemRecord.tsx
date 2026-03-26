import React, { useEffect, useState } from "react"
import { Copy, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { QueueItemRecordProps } from "./types"

export const QueueItemRecord: React.FC<QueueItemRecordProps> = ({ item, type, onCopy }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isFailed = (item.failCount ?? 0) > 0;
  
  let color = "emerald"; 
  let intensity = 1;
  let statusLabel = "";
  const scheduleTime = type === 'social' ? (item.scheduleAt ?? now) : new Date(item.createdAt).getTime();

  if (type === 'social') {
    const diffMs = scheduleTime - now;
    const isEssentiallyOverdue = diffMs < -300000;
    
    if (isFailed || isEssentiallyOverdue) {
      color = "purple";
      intensity = 1;
      statusLabel = isFailed ? "Error" : "Overdue";
    } else if (diffMs < 5 * 60 * 60 * 1000) {
      color = "emerald";
      const ratio = 1 - Math.max(0, diffMs) / (5 * 60 * 60 * 1000);
      intensity = 0.4 + (0.6 * ratio);
      statusLabel = diffMs < 0 ? "Posting" : "Queued";
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      color = "yellow";
      intensity = 0.4 + (0.6 * (diffMs - 5 * 60 * 60 * 1000) / (19 * 60 * 60 * 1000));
      statusLabel = "Queued";
    } else {
      color = "rose";
      intensity = 0.4 + (0.6 * Math.min(1, (diffMs - 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)));
      statusLabel = "Queued";
    }
  } else {
    color = isFailed ? "purple" : "emerald";
    intensity = 1;
    statusLabel = isFailed ? "Error" : (item.status || "Pending");
  }

  const statusColorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    rose: "text-rose-600 dark:text-rose-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  const formattedCreated = new Date(item.createdAt).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  
  const formattedUpdated = item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }) : null;

  const formattedDisplayTime = type === 'social' ? new Date(scheduleTime ?? now).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }) : formattedCreated;

  const getCountdown = (ms: number) => {
    if (ms < 0) {
      if (ms > -300000) return "Posting now...";
      return "Overdue";
    }
    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (24 * 3600 * 1000));
    const hours = Math.floor((absMs % (24 * 3600 * 1000)) / (3600 * 1000));
    const mins = Math.floor((absMs % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((absMs % (60 * 1000)) / 1000);
    
    const sign = "-";
    if (days > 0) return `${sign}${days}h ${hours}h`;
    if (hours > 0) return `${sign}${hours}h ${mins}m`;
    return `${sign}${mins}m ${secs}s`;
  };

  return (
    <div 
      className={`relative flex flex-col gap-2.5 p-3.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-l-[3px] group hover:shadow-md transition-all duration-300 text-black`}
      style={{ borderLeftColor: `rgba(${color === 'emerald' ? '16,185,129' : color === 'yellow' ? '250,204,21' : color === 'rose' ? '244,63,94' : '168,85,247'}, ${intensity})` }}
    >
      <div className="flex flex-col gap-2 text-black">
        {/* Row 1: ID and Created info (Aligned) */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 group/id min-w-0">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={item.itemId}>
              {item.itemId.slice(0, 15)}...
            </span>
            <button 
              onClick={onCopy} 
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100 group-hover/id:opacity-100 cursor-pointer"
            >
              <Copy className="size-3" />
            </button>
          </div>
          {type === 'social' && (
             <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 opacity-70 shrink-0 italic">
               Created: <span className="font-black text-slate-600 dark:text-slate-400 ml-0.5">{formattedCreated}</span>
             </p>
          )}
        </div>

        {/* Row 2: Scheduled Time/Status and Countdown (Aligned) */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                {formattedDisplayTime}
              </span>
              {type === 'social' && (
                <>
                  <div className="size-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <span className={`text-[10px] font-bold ${statusColorMap[color]}`}>
                    {statusLabel}
                  </span>
                </>
              )}
            </div>

            {type !== 'social' && (
              <>
                {formattedUpdated && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    Updated: {formattedUpdated}
                  </span>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold ${statusColorMap[color]}`}>
                    {statusLabel}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {type === 'social' && (
             <p className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100 shrink-0">{getCountdown((scheduleTime ?? now) - now)}</p>
          )}
        </div>
      </div>

      {(type === 'social' && item.page) && (
        <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-slate-100/50 dark:border-slate-800/30">
           <div className="flex items-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity">
              <Share2 className="size-2.5" />
              <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{item.page}</span>
           </div>
           
           {isFailed && (
             <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-none text-[8px] px-1.5 py-0 font-black uppercase tracking-widest h-3.5">
               Fail
             </Badge>
           )}
        </div>
      )}
    </div>
  )
}
