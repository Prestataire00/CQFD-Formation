import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  GraduationCap,
  Users,
  UserCog,
  FileText,
  FileSpreadsheet,
  Settings,
  LogOut,
  Calendar,
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
    label: "Equipe",
    href: "/equipe",
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
    label: "Documents",
    href: "/document-templates",
    roles: ["admin"],
  },
  {
    icon: FileSpreadsheet,
    label: "Exports Excel",
    href: "/exports",
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-800 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative w-[52px] h-[52px] flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <defs>
                <clipPath id="p1"><path d="M10,22 C10,14 16,8 24,8 L42,8 C42,8 44,28 38,34 C32,40 28,42 28,42 L8,42 C8,34 10,28 10,22Z" /></clipPath>
                <clipPath id="p2"><path d="M52,8 L72,8 C80,8 86,14 86,22 C86,28 86,34 86,42 L66,42 C66,42 62,40 56,34 C50,28 52,8 52,8Z" /></clipPath>
                <clipPath id="p3"><path d="M8,52 L28,52 C28,52 32,54 38,60 C44,66 42,86 42,86 L24,86 C16,86 10,80 10,72 L10,52Z" /></clipPath>
                <clipPath id="p4"><path d="M66,52 L86,52 L86,72 C86,80 80,86 72,86 L52,86 C52,86 50,66 56,60 C62,54 66,52 66,52Z" /></clipPath>
                <clipPath id="p5"><path d="M30,36 C36,30 40,28 46,32 C52,36 54,40 60,34 C66,28 64,36 64,42 C64,48 66,52 60,58 C54,64 52,66 46,62 C40,58 38,54 32,60 C26,66 28,58 28,52 C28,46 24,42 30,36Z" /></clipPath>
              </defs>
              <rect clipPath="url(#p1)" x="0" y="0" width="50" height="50" fill="#0055a4" />
              <rect clipPath="url(#p2)" x="45" y="0" width="50" height="50" fill="#22a7c4" />
              <rect clipPath="url(#p3)" x="0" y="45" width="50" height="50" fill="#10b981" />
              <rect clipPath="url(#p4)" x="45" y="45" width="50" height="50" fill="#0e9a7a" />
              <rect clipPath="url(#p5)" x="20" y="25" width="55" height="55" fill="#1a8fd0" />
              <rect x="5" y="5" width="85" height="85" rx="12" fill="none" opacity="0" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: "'Georgia', serif" }}>CQFD</span>
            <span className="text-[10px] font-semibold tracking-[0.15em] text-cyan-400 uppercase">Formation</span>
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
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-700/50 border border-slate-600">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-blue-400 font-bold">
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
            <p className="text-sm font-semibold truncate text-white">
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
          </button>
        )}
      </div>
    </aside>
  );
}
