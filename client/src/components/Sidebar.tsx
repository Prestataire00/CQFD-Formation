import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Home, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Bot, 
  Settings, 
  HelpCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Home, label: "Accueil", href: "/home" },
  { icon: Briefcase, label: "Projets", href: "/projects" },
  { icon: CheckSquare, label: "Tâches", href: "/tasks" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: MessageSquare, label: "Communication", href: "/messages" },
  { icon: Bot, label: "Site IA Infinity", href: "/ai-assistant" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
  { icon: HelpCircle, label: "Aide", href: "/help" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden lg:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          CRM Infinity
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
