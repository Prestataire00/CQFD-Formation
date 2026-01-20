import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, className, href }: StatCardProps) {
  const content = (
    <>
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
      {href && (
        <div className="mt-4 flex items-center justify-end text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Voir details</span>
          <ArrowUpRight className="w-3 h-3 ml-1" />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <div className={cn(
          "bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer group",
          className
        )}>
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      {content}
    </div>
  );
}
