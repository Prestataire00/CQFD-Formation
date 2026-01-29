import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Mail,
  Phone,
  UserCog,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useUsers } from "@/hooks/use-users";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  phone?: string | null;
  specialties?: string[] | null;
}

function UserCard({ user }: { user: User }) {
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";

  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email || "Utilisateur";

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fullName}</p>
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
            >
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </a>
          )}
          {user.phone && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {user.phone}
            </p>
          )}
          {user.specialties && user.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.specialties.slice(0, 2).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {user.specialties.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{user.specialties.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Participants() {
  const { data: users, isLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search term
  const filteredUsers = users?.filter((user: User) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Separate users by role
  const prestataires = filteredUsers.filter((u: User) => u.role === "prestataire");
  const formateurs = filteredUsers.filter((u: User) => u.role === "formateur");
  const admins = filteredUsers.filter((u: User) => u.role === "admin");

  const roleConfig = {
    prestataire: {
      title: "Prestataires",
      icon: Briefcase,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      users: prestataires,
    },
    formateur: {
      title: "Formateurs Salaries",
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      users: formateurs,
    },
    admin: {
      title: "Administrateurs",
      icon: UserCog,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      users: admins,
    },
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Equipe" />

        <div className="flex-1 p-6 space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun membre trouve</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Essayez avec un autre terme de recherche." : "Aucun utilisateur enregistre."}
              </p>
            </div>
          ) : (
            /* Users by role columns */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(roleConfig).map(([role, config]) => {
                const Icon = config.icon;
                return (
                  <Card key={role} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {config.title}
                        <Badge variant="secondary" className="ml-auto">
                          {config.users.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {config.users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                          <Icon className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">Aucun {config.title.toLowerCase()}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {config.users.map((user: User) => (
                            <UserCard key={user.id} user={user} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
