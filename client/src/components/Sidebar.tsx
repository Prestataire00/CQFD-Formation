import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  GraduationCap,
  Users,
  MessageSquareText,
  UserCog,
  FileText,
  Settings,
  LogOut,
  Calendar,
  UserCircle,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@shared/models/auth";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles: UserRole[];
}

// Navigation items with role-based access
// Admin CQFD: vue globale, crée utilisateurs, crée/supprime missions, paramètre rappels
// Formateur/Prestataire: accès uniquement à SES missions, dépôt documents, suivi étapes
const NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Tableau de bord",
    href: "/",
    roles: ["admin", "formateur", "prestataire"],
  },
  {
    icon: Briefcase,
    label: "Missions",
    href: "/missions",
    roles: ["admin", "formateur", "prestataire"],
  },
  {
    icon: Calendar,
    label: "Calendrier",
    href: "/calendar",
    roles: ["admin"],
  },
  {
    icon: UserCircle,
    label: "Mon Espace",
    href: "/my-space",
    roles: ["formateur", "prestataire"],
  },
  {
    icon: StickyNote,
    label: "Mes notes",
    href: "/my-notes",
    roles: ["admin", "formateur", "prestataire"],
  },
  {
    icon: Building2,
    label: "Clients",
    href: "/clients",
    roles: ["admin"],
  },
  {
    icon: Users,
    label: "Participants",
    href: "/participants",
    roles: ["admin"],
  },
  {
    icon: MessageSquareText,
    label: "Feedback",
    href: "/feedback",
    roles: ["admin"],
  },
  {
    icon: UserCog,
    label: "Utilisateurs",
    href: "/users",
    roles: ["admin"],
  },
  {
    icon: FileText,
    label: "Templates",
    href: "/document-templates",
    roles: ["admin"],
  },
  {
    icon: Settings,
    label: "Paramètres",
    href: "/settings",
    roles: ["admin"],
  },
];

function getRoleBadge(role: UserRole): { label: string; color: string } {
  switch (role) {
    case "admin":
      return { label: "Admin", color: "bg-red-100 text-red-700" };
    case "formateur":
      return { label: "Formateur", color: "bg-blue-100 text-blue-700" };
    case "prestataire":
      return { label: "Prestataire", color: "bg-green-100 text-green-700" };
    default:
      return { label: "Utilisateur", color: "bg-gray-100 text-gray-700" };
  }
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  // Default to showing all items if not authenticated (for demo purposes)
  const userRole = (user?.role as UserRole) || "admin";

  // Filter nav items based on user role
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  const roleBadge = getRoleBadge(userRole);

  // Get user initials
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          {/* Custom SVG Flower Logo */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              {/* Top Left Leaf - Blue */}
              <rect x="15" y="15" width="32" height="32" rx="12" fill="#3b82f6" transform="rotate(-5 31 31)" />
              {/* Top Right Leaf - Green */}
              <rect x="53" y="15" width="32" height="32" rx="12" fill="#10b981" transform="rotate(5 69 31)" />
              {/* Bottom Left Leaf - Cyan */}
              <rect x="15" y="53" width="32" height="32" rx="12" fill="#22d3ee" transform="rotate(5 31 69)" />
              {/* Bottom Right Leaf - Lime */}
              <rect x="53" y="53" width="32" height="32" rx="12" fill="#84cc16" transform="rotate(-5 69 69)" />
              {/* Center Text "CQ" */}
              <text x="50" y="52" fontFamily="Arial" fontSize="22" fontWeight="900" fill="black" textAnchor="middle" dominantBaseline="middle">CQ</text>
            </svg>
          </div>
          
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-black italic tracking-tighter text-slate-800 dark:text-white uppercase">CQFD</span>
            <span className="text-[12px] font-bold tracking-[0.2em] text-primary uppercase">Formation</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
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
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              getInitials()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "Utilisateur"}
            </p>
            <span
              className={cn(
                "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
                roleBadge.color
              )}
            >
              {roleBadge.label}
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
          </button>
        )}
      </div>
    </aside>
  );
}
