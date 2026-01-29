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
  FileSpreadsheet,
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
      <div className="h-20 flex items-center px-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* CQFD Formation Logo - 4 Petal Flower with CQFD in center */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              {/* Top Left Petal - Dark Blue */}
              <rect x="8" y="8" width="38" height="38" rx="10" fill="#0055a4" transform="rotate(-8 27 27)" />
              {/* Top Right Petal - Cyan */}
              <rect x="54" y="8" width="38" height="38" rx="10" fill="#22d3ee" transform="rotate(8 73 27)" />
              {/* Bottom Left Petal - Green */}
              <rect x="8" y="54" width="38" height="38" rx="10" fill="#10b981" transform="rotate(8 27 73)" />
              {/* Bottom Right Petal - Teal */}
              <rect x="54" y="54" width="38" height="38" rx="10" fill="#14b8a6" transform="rotate(-8 73 73)" />
              {/* Center Text "CQFD" in white */}
              <text x="50" y="52" fontFamily="Arial" fontSize="15" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="middle">CQFD</text>
            </svg>
          </div>
          
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-extrabold tracking-tight text-white">CQFD</span>
            <span className="text-[11px] font-semibold tracking-[0.15em] text-cyan-400 uppercase">Formation</span>
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
