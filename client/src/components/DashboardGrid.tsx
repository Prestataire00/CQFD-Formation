import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface GridCardProps {
  title: string;
  actionLabel: string;
  actionLink: string;
  children: ReactNode;
  colSpan?: "col-span-1" | "col-span-2";
  className?: string;
}

export function GridCard({ title, actionLabel, actionLink, children, colSpan = "col-span-1", className = "" }: GridCardProps) {
  return (
    <div className={`bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col ${colSpan} overflow-hidden hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
      <div className="p-4 bg-muted/30 border-t border-border/50">
        <Link href={actionLink}>
          <Button variant="ghost" className="w-full justify-between text-primary hover:text-primary hover:bg-primary/5 group">
            {actionLabel}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
