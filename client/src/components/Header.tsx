import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              className="pl-9 pr-4 py-2 w-64 rounded-full bg-secondary/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-sm outline-none"
              placeholder="Rechercher..."
            />
          </div>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </Button>
        </div>
      </div>
    </header>
  );
}
