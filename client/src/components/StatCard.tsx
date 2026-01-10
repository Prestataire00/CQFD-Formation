import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground tracking-tight">{value}</h3>
        </div>
        <div className="p-3 bg-primary/5 rounded-xl text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
          <span className={cn(
            "px-2 py-1 rounded-full",
            trendUp ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            {trend}
          </span>
          <span className="text-muted-foreground">par rapport au mois dernier</span>
        </div>
      )}
    </div>
  );
}
