import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MissionCalendar, type CalendarView } from "@/components/MissionCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMissions, useClients } from "@/hooks/use-missions";
import { useAuth } from "@/hooks/use-auth";
import { useGamificationProfile } from "@/hooks/use-gamification";
import { GamificationWidget, BadgeGallery, AchievementUnlockedModal, StreakIndicator, AnimatedCounter } from "@/components/gamification";
import {
  Loader2,
  UserCircle,
  Briefcase,
  Clock,
  CheckCircle2,
  CalendarDays,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import type { Mission, MissionStatus, Client } from "@shared/schema";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrainerSpace() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: allMissions, isLoading: missionsLoading } = useMissions();
  const { data: allClients, isLoading: clientsLoading } = useClients();
  const { data: gamificationProfile } = useGamificationProfile();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter missions assigned to the current trainer
  const trainerMissions = useMemo(() => {
    if (!allMissions || !user) return [];
    return allMissions.filter(
      (mission: Mission) => mission.trainerId === user.id
    );
  }, [allMissions, user]);

  // Filter clients assigned to the current trainer
  const trainerClients = useMemo(() => {
    if (!allClients || !user) return [];
    return allClients.filter(
      (client: Client) => client.assignedTrainerId === user.id
    );
  }, [allClients, user]);

  const isLoading = missionsLoading || clientsLoading;

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const inProgress = trainerMissions.filter(
      (m: Mission) => m.status === "in_progress"
    ).length;
    const confirmed = trainerMissions.filter(
      (m: Mission) => m.status === "confirmed"
    ).length;
    const completed = trainerMissions.filter(
      (m: Mission) => m.status === "completed"
    ).length;
    const upcoming = trainerMissions.filter((m: Mission) => {
      if (!m.startDate) return false;
      return (
        new Date(m.startDate) > now &&
        (m.status === "confirmed" || m.status === "in_progress")
      );
    }).length;

    return { inProgress, confirmed, completed, upcoming, total: trainerMissions.length };
  }, [trainerMissions]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Mon Espace" />
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCircle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Mon Espace</h1>
            </div>
            <p className="text-muted-foreground">
              Bienvenue{user?.firstName ? `, ${user.firstName}` : ""} ! Gerez vos
              missions et consultez votre calendrier.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Gamification Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <GamificationWidget className="lg:col-span-2" />
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Statistiques Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gamificationProfile && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-muted-foreground">XP Total</span>
                          </div>
                          <AnimatedCounter value={gamificationProfile.totalXP} className="text-lg text-emerald-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-muted-foreground">Missions terminees</span>
                          </div>
                          <AnimatedCounter value={gamificationProfile.stats.completedMissions} className="text-lg text-blue-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-purple-500" />
                            <span className="text-sm text-muted-foreground">Badges obtenus</span>
                          </div>
                          <AnimatedCounter value={gamificationProfile.badges.length} className="text-lg text-purple-600" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard
                  title="Missions en cours"
                  value={stats.inProgress}
                  icon={Clock}
                  color="bg-violet-100 text-violet-600"
                />
                <StatCard
                  title="Missions confirmees"
                  value={stats.confirmed}
                  icon={Briefcase}
                  color="bg-blue-100 text-blue-600"
                />
                <StatCard
                  title="A venir"
                  value={stats.upcoming}
                  icon={CalendarDays}
                  color="bg-orange-100 text-orange-600"
                />
                <StatCard
                  title="Terminees"
                  value={stats.completed}
                  icon={CheckCircle2}
                  color="bg-green-100 text-green-600"
                />
                <StatCard
                  title="Mes clients"
                  value={trainerClients.length}
                  icon={Building2}
                  color="bg-indigo-100 text-indigo-600"
                />
              </div>

              {/* My Clients */}
              {trainerClients.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Mes Clients ({trainerClients.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trainerClients.map((client: Client) => (
                        <Card
                          key={client.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setLocation(`/clients`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{client.name}</h3>
                                <Badge
                                  variant="outline"
                                  className={
                                    client.contractStatus === "acquired"
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : "bg-amber-100 text-amber-700 border-amber-300"
                                  }
                                >
                                  {client.contractStatus === "acquired" ? "Acquis" : "En negociation"}
                                </Badge>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                              {client.contactName && (
                                <p>{client.contactName}</p>
                              )}
                              {client.contactEmail && (
                                <p className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {client.contactEmail}
                                </p>
                              )}
                              {client.contactPhone && (
                                <p className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {client.contactPhone}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Badges Gallery */}
              <Card className="mb-6 border-violet-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Mes Succes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgeGallery showLocked />
                </CardContent>
              </Card>

              {/* Calendar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Mes Missions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[calc(100vh-420px)] min-h-[500px]">
                    <MissionCalendar
                      missions={trainerMissions}
                      view={view}
                      onViewChange={setView}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      {/* Gamification celebration modals */}
      <AchievementUnlockedModal />
    </div>
  );
}
