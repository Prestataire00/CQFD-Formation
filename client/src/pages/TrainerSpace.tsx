import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MissionCalendar, type CalendarView } from "@/components/MissionCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMissions, useClients, useAllSessions } from "@/hooks/use-missions";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadInAppNotifications, useMarkInAppNotificationRead } from "@/hooks/use-notifications";
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
  Bell,
  MapPin,
  Download,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import type { Mission, MissionSession, MissionStatus, Client, InAppNotification, MissionStep } from "@shared/schema";

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
  const { data: allSessions } = useAllSessions();

  // Build a map of missionId -> session dates
  const sessionsByMission = useMemo(() => {
    const map: Record<number, MissionSession[]> = {};
    if (allSessions) {
      for (const s of allSessions) {
        if (!map[s.missionId]) map[s.missionId] = [];
        map[s.missionId].push(s);
      }
    }
    return map;
  }, [allSessions]);
  const { data: inAppNotifications } = useUnreadInAppNotifications();
  const markInAppAsRead = useMarkInAppNotificationRead();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Handle notification click
  const handleNotificationClick = async (notification: InAppNotification) => {
    await markInAppAsRead.mutateAsync(notification.id);
    if (notification.missionId) {
      setLocation(`/missions/${notification.missionId}`);
    }
  };

  // Get the 5 most recent unread notifications
  const recentNotifications = useMemo(() => {
    return (inAppNotifications || []).slice(0, 5);
  }, [inAppNotifications]);

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
    now.setHours(0, 0, 0, 0);
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
      if (m.status !== "confirmed" && m.status !== "in_progress") return false;
      // Check session dates first
      const sessions = sessionsByMission[m.id];
      if (sessions && sessions.length > 0) {
        return sessions.some((s) => {
          const d = new Date(s.sessionDate);
          d.setHours(0, 0, 0, 0);
          return d > now;
        });
      }
      if (!m.startDate) return false;
      return new Date(m.startDate) > now;
    }).length;

    return { inProgress, confirmed, completed, upcoming, total: trainerMissions.length };
  }, [trainerMissions, sessionsByMission]);

  // Prochaines missions (14 prochains jours) - basé sur les dates de session
  const upcomingMissions = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in14Days = addDays(now, 14);

    return trainerMissions
      .filter((m: Mission) => {
        if (m.status !== "confirmed" && m.status !== "in_progress") return false;
        // Check session dates first
        const sessions = sessionsByMission[m.id];
        if (sessions && sessions.length > 0) {
          return sessions.some((s) => {
            const d = new Date(s.sessionDate);
            d.setHours(0, 0, 0, 0);
            return d >= now && d <= in14Days;
          });
        }
        // Fallback to startDate
        if (!m.startDate) return false;
        const startDate = new Date(m.startDate);
        return startDate >= now && startDate <= in14Days;
      })
      .sort((a: Mission, b: Mission) => {
        // Sort by next upcoming session date
        const getNextDate = (m: Mission) => {
          const sessions = sessionsByMission[m.id];
          if (sessions && sessions.length > 0) {
            const futureSessions = sessions
              .map((s) => new Date(s.sessionDate))
              .filter((d) => d >= now)
              .sort((a, b) => a.getTime() - b.getTime());
            if (futureSessions.length > 0) return futureSessions[0].getTime();
          }
          return m.startDate ? new Date(m.startDate).getTime() : 0;
        };
        return getNextDate(a) - getNextDate(b);
      })
      .slice(0, 5);
  }, [trainerMissions, sessionsByMission]);

  // Récupérer les étapes de toutes les missions du formateur
  const { data: allSteps } = useQuery({
    queryKey: ["/api/trainer-steps", user?.id],
    queryFn: async () => {
      if (!trainerMissions.length) return [];
      const stepsPromises = trainerMissions.map(async (mission: Mission) => {
        try {
          const response = await fetch(`/api/missions/${mission.id}/steps`, {
            credentials: "include",
          });
          if (!response.ok) return [];
          const steps = await response.json();
          return steps.map((step: MissionStep) => ({ ...step, mission }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(stepsPromises);
      return results.flat();
    },
    enabled: trainerMissions.length > 0,
  });

  // Tâches prioritaires et en retard
  const priorityTasks = useMemo(() => {
    if (!allSteps) return [];

    const now = new Date();
    return allSteps
      .filter((step: MissionStep & { mission: Mission }) => {
        // Filtrer les tâches non terminées qui sont prioritaires ou en retard
        if (step.isCompleted) return false;
        if (step.status === "done" || step.status === "na") return false;

        // Prioritaires ou en retard
        if (step.status === "priority" || step.status === "late") return true;

        // Ou avec une date d'échéance proche (7 jours) ou dépassée
        if (step.dueDate) {
          const dueDate = new Date(step.dueDate);
          const daysUntilDue = differenceInDays(dueDate, now);
          return daysUntilDue <= 7;
        }

        return false;
      })
      .sort((a: MissionStep & { mission: Mission }, b: MissionStep & { mission: Mission }) => {
        // Trier par statut (late > priority > todo) puis par date
        const statusOrder: Record<string, number> = { late: 0, priority: 1, todo: 2 };
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        if (orderA !== orderB) return orderA - orderB;

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 5);
  }, [allSteps]);

  // Fonction pour générer et télécharger le fichier iCal
  const exportToIcal = () => {
    const formatDateToIcal = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const escapeIcalText = (text: string) => {
      return text.replace(/[\\;,\n]/g, (match) => {
        if (match === "\n") return "\\n";
        return "\\" + match;
      });
    };

    // Filtrer les missions actives (confirmées ou en cours)
    const activeMissions = trainerMissions.filter(
      (m: Mission) => m.status === "confirmed" || m.status === "in_progress"
    );

    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Formation CRM//Missions//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Mes Missions de Formation",
    ];

    activeMissions.forEach((mission: Mission) => {
      if (!mission.startDate) return;

      const startDate = new Date(mission.startDate);

      // Ajouter 1 jour à la date de début pour les événements "toute la journée"
      const endDatePlusOne = new Date(startDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

      const client = allClients?.find((c: Client) => c.id === mission.clientId);
      const clientName = client?.name || "Client non défini";

      const description = [
        `Client: ${clientName}`,
        mission.typology ? `Type: ${mission.typology}` : "",
        mission.totalHours ? `Durée: ${mission.totalHours}h` : "",
      ]
        .filter(Boolean)
        .join("\\n");

      icalContent.push(
        "BEGIN:VEVENT",
        `UID:mission-${mission.id}@formation-crm`,
        `DTSTAMP:${formatDateToIcal(new Date())}`,
        `DTSTART;VALUE=DATE:${startDate.toISOString().split("T")[0].replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${endDatePlusOne.toISOString().split("T")[0].replace(/-/g, "")}`,
        `SUMMARY:${escapeIcalText(mission.title)}`,
        mission.location ? `LOCATION:${escapeIcalText(mission.location)}` : "",
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      );
    });

    icalContent.push("END:VCALENDAR");

    // Filtrer les lignes vides
    const icalString = icalContent.filter(Boolean).join("\r\n");

    // Créer et télécharger le fichier
    const blob = new Blob([icalString], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mes-missions-${format(new Date(), "yyyy-MM-dd")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

              {/* Notifications */}
              {recentNotifications.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-500" />
                      Notifications ({recentNotifications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentNotifications.map((notification: InAppNotification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                Nouveau
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {notification.metadata?.startDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {format(new Date(notification.metadata.startDate), "d MMMM yyyy", { locale: fr })}
                                </span>
                              )}
                              {notification.metadata?.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {notification.metadata.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prochaines missions & Tâches prioritaires */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Prochaines missions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-500" />
                      Prochaines missions (14 jours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingMissions.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Aucune mission prevue dans les 14 prochains jours
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingMissions.map((mission: Mission) => {
                          const client = allClients?.find((c: Client) => c.id === mission.clientId);
                          const sessions = sessionsByMission[mission.id];
                          // Get the next upcoming session date
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const nextSessionDate = sessions && sessions.length > 0
                            ? sessions
                                .map((s) => new Date(s.sessionDate))
                                .filter((d) => { d.setHours(0, 0, 0, 0); return d >= now; })
                                .sort((a, b) => a.getTime() - b.getTime())[0]
                            : mission.startDate ? new Date(mission.startDate) : null;
                          const daysUntil = nextSessionDate ? differenceInDays(nextSessionDate, new Date()) : 0;

                          const missionSteps = allSteps?.filter((s: MissionStep & { mission: Mission }) => s.missionId === mission.id) || [];
                          const doneSteps = missionSteps.filter((s: MissionStep) => s.status === "done" || s.isCompleted).length;
                          const totalMissionSteps = missionSteps.length;
                          const missionProgress = totalMissionSteps > 0 ? Math.round((doneSteps / totalMissionSteps) * 100) : 0;

                          return (
                            <div
                              key={mission.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                              onClick={() => setLocation(`/missions/${mission.id}`)}
                            >
                              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-lg flex flex-col items-center justify-center">
                                {nextSessionDate ? (
                                  <>
                                    <span className="text-xs font-medium">
                                      {format(nextSessionDate, "MMM", { locale: fr }).toUpperCase()}
                                    </span>
                                    <span className="text-lg font-bold leading-none">
                                      {format(nextSessionDate, "d")}
                                    </span>
                                  </>
                                ) : (
                                  <CalendarDays className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{mission.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {client?.name || "Client non defini"}
                                </p>
                                {sessions && sessions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sessions.map((s: MissionSession, i: number) => (
                                      <span key={i} className="inline-flex bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">
                                        {format(new Date(s.sessionDate), "d MMM", { locale: fr })}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {mission.location && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {mission.location}
                                    </span>
                                  )}
                                </div>
                                {totalMissionSteps > 0 && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] text-muted-foreground">Avancement</span>
                                      <span className="text-[10px] font-medium">{doneSteps}/{totalMissionSteps} ({missionProgress}%)</span>
                                    </div>
                                    <Progress value={missionProgress} className="h-1.5" />
                                  </div>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  daysUntil === 0
                                    ? "bg-red-100 text-red-700 border-red-300"
                                    : daysUntil <= 3
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "bg-blue-100 text-blue-700 border-blue-300"
                                }
                              >
                                {daysUntil === 0
                                  ? "Aujourd'hui"
                                  : daysUntil === 1
                                  ? "Demain"
                                  : `J-${daysUntil}`}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tâches prioritaires */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ListTodo className="w-5 h-5 text-amber-500" />
                      Taches prioritaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {priorityTasks.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Aucune tache prioritaire en attente
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {priorityTasks.map((step: MissionStep & { mission: Mission }) => {
                          const isLate = step.lateDate
                            ? new Date(step.lateDate) <= new Date()
                            : (step.dueDate && new Date(step.dueDate) < new Date());

                          return (
                            <div
                              key={step.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                isLate
                                  ? "bg-red-50 border-red-200 hover:bg-red-100"
                                  : "bg-amber-50 border-amber-200 hover:bg-amber-100"
                              }`}
                              onClick={() => setLocation(`/missions/${step.missionId}`)}
                            >
                              <div className={`p-2 rounded-lg ${isLate ? "bg-red-100" : "bg-amber-100"}`}>
                                {isLate ? (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-amber-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{step.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {step.mission.title}
                                </p>
                                {step.dueDate && (
                                  <p className={`text-xs mt-1 ${isLate ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                    Echeance: {format(new Date(step.dueDate), "d MMM yyyy", { locale: fr })}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  isLate
                                    ? "bg-red-100 text-red-700 border-red-300"
                                    : step.status === "priority"
                                    ? "bg-amber-100 text-amber-700 border-amber-300"
                                    : "bg-slate-100 text-slate-700 border-slate-300"
                                }
                              >
                                {isLate ? "En retard" : step.status === "priority" ? "Prioritaire" : "A faire"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                          className="transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{client.name}</h3>
                                <Badge
                                  variant="outline"
                                  className={
                                    client.contractStatus === "client"
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : client.contractStatus === "lost"
                                      ? "bg-red-100 text-red-700 border-red-300"
                                      : client.contractStatus === "negotiation"
                                      ? "bg-amber-100 text-amber-700 border-amber-300"
                                      : "bg-blue-100 text-blue-700 border-blue-300"
                                  }
                                >
                                  {client.contractStatus === "client" ? "Client"
                                    : client.contractStatus === "lost" ? "Perdu"
                                    : client.contractStatus === "negotiation" ? "En negociation"
                                    : "Prospect"}
                                </Badge>
                              </div>
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
                      sessions={allSessions || []}
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
    </div>
  );
}
