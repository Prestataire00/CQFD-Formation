import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { GridCard } from "@/components/DashboardGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStats, useMissions, useClients, useAllSessions } from "@/hooks/use-missions";
import { useAuth } from "@/hooks/use-auth";
import {
  useUnreadInAppNotifications,
  useMarkInAppNotificationRead,
  useMarkAllInAppNotificationsRead,
  useTaskAlerts,
  useMissionTasksProgress,
} from "@/hooks/use-notifications";
import type { TaskAlertItem, MissingDocumentAlert, MissionTaskProgress } from "@/hooks/use-notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MissionCalendar, type CalendarView } from "@/components/MissionCalendar";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  CalendarDays,
  MapPin,
  ArrowRight,
  AlertTriangle,
  FileX,
  Bell,
  CheckCheck,
  Flag,
  ListChecks,
  Building2,
  ListTodo,
  Mail,
  Phone,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionStatus, MissionSession, MissionStep, Client, InAppNotification } from "@shared/schema";

function getMissionStatusLabel(status: MissionStatus): { label: string; color: string } {
  const styles: Record<MissionStatus, { label: string; color: string }> = {
    draft: { label: "En option", color: "bg-gray-100 text-gray-700" },
    confirmed: { label: "Confirmee", color: "bg-blue-100 text-blue-700" },
    in_progress: { label: "En cours", color: "bg-green-100 text-green-700" },
    completed: { label: "Terminee", color: "bg-purple-100 text-purple-700" },
    cancelled: { label: "Annulee", color: "bg-red-100 text-red-700" },
  };
  return styles[status] || styles.draft;
}

function getRoleBadge(role: string): { label: string; className: string } {
  switch (role) {
    case "admin":
      return { label: "Admin", className: "bg-purple-100 text-purple-700 border-purple-300" };
    case "formateur":
      return { label: "Formateur", className: "bg-blue-100 text-blue-700 border-blue-300" };
    case "prestataire":
      return { label: "Prestataire", className: "bg-teal-100 text-teal-700 border-teal-300" };
    default:
      return { label: role, className: "bg-gray-100 text-gray-700 border-gray-300" };
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats } = useStats();
  const { data: missions } = useMissions();
  const { data: allSessions } = useAllSessions();
  const { data: allClients } = useClients();

  const isAdmin = user?.role === "admin";

  // Calendar state (trainer)
  const [calView, setCalView] = useState<CalendarView>("month");
  const [calDate, setCalDate] = useState(new Date());

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
  const markAllAsRead = useMarkAllInAppNotificationsRead();

  const { data: taskAlerts } = useTaskAlerts(isAdmin);
  const { data: missionTasksProgress } = useMissionTasksProgress(isAdmin);

  // Get recent notifications
  const recentNotifications = (inAppNotifications || []).slice(0, 5);

  // Handle notification click
  const handleNotificationClick = async (notification: InAppNotification) => {
    await markInAppAsRead.mutateAsync(notification.id);
    if (notification.missionId) {
      setLocation(`/missions/${notification.missionId}`);
    }
  };

  // Get upcoming missions (next 5) - admin view
  const upcomingMissions = missions
    ?.filter((m: Mission) => m.status === "draft" || m.status === "confirmed" || m.status === "in_progress")
    .sort((a: Mission, b: Mission) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 5) || [];

  // Task alerts data (admin)
  const lateTasks = taskAlerts?.lateTasks || [];
  const adminPriorityTasks = taskAlerts?.priorityTasks || [];
  const missingDocuments = taskAlerts?.missingDocuments || [];
  const hasAlerts = lateTasks.length > 0 || adminPriorityTasks.length > 0 || missingDocuments.length > 0;

  // ===== TRAINER-SPECIFIC DATA =====
  const trainerMissions = useMemo(() => {
    if (isAdmin || !missions || !user) return [];
    return missions.filter((m: Mission) => m.trainerId === user.id);
  }, [missions, user, isAdmin]);

  const trainerClients = useMemo(() => {
    if (isAdmin || !allClients || !user) return [];
    return allClients.filter((c: Client) => c.assignedTrainerId === user.id);
  }, [allClients, user, isAdmin]);

  const trainerStats = useMemo(() => {
    if (isAdmin) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const inProgress = trainerMissions.filter((m: Mission) => m.status === "in_progress").length;
    const confirmed = trainerMissions.filter((m: Mission) => m.status === "confirmed").length;
    const completed = trainerMissions.filter((m: Mission) => m.status === "completed").length;
    const upcoming = trainerMissions.filter((m: Mission) => {
      if (m.status !== "confirmed" && m.status !== "in_progress") return false;
      const sessions = sessionsByMission[m.id];
      if (sessions && sessions.length > 0) {
        return sessions.some((s) => { const d = new Date(s.sessionDate); d.setHours(0, 0, 0, 0); return d > now; });
      }
      if (!m.startDate) return false;
      return new Date(m.startDate) > now;
    }).length;
    return { inProgress, confirmed, completed, upcoming, total: trainerMissions.length };
  }, [trainerMissions, sessionsByMission, isAdmin]);

  // Upcoming missions for trainer (14 days)
  const trainerUpcomingMissions = useMemo(() => {
    if (isAdmin) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in14Days = addDays(now, 14);
    return trainerMissions
      .filter((m: Mission) => {
        if (m.status !== "confirmed" && m.status !== "in_progress") return false;
        const sessions = sessionsByMission[m.id];
        if (sessions && sessions.length > 0) {
          return sessions.some((s) => { const d = new Date(s.sessionDate); d.setHours(0, 0, 0, 0); return d >= now && d <= in14Days; });
        }
        if (!m.startDate) return false;
        const startDate = new Date(m.startDate);
        return startDate >= now && startDate <= in14Days;
      })
      .sort((a: Mission, b: Mission) => {
        const getNextDate = (m: Mission) => {
          const sessions = sessionsByMission[m.id];
          if (sessions && sessions.length > 0) {
            const future = sessions.map((s) => new Date(s.sessionDate)).filter((d) => d >= now).sort((a, b) => a.getTime() - b.getTime());
            if (future.length > 0) return future[0].getTime();
          }
          return m.startDate ? new Date(m.startDate).getTime() : 0;
        };
        return getNextDate(a) - getNextDate(b);
      })
      .slice(0, 5);
  }, [trainerMissions, sessionsByMission, isAdmin]);

  // Trainer steps (tasks) for "État des tâches"
  const { data: allSteps } = useQuery({
    queryKey: ["/api/trainer-steps", user?.id],
    queryFn: async () => {
      if (!trainerMissions.length) return [];
      const results = await Promise.all(
        trainerMissions.map(async (mission: Mission) => {
          try {
            const res = await fetch(`/api/missions/${mission.id}/steps`, { credentials: "include" });
            if (!res.ok) return [];
            const steps = await res.json();
            return steps.map((step: MissionStep) => ({ ...step, mission }));
          } catch { return []; }
        })
      );
      return results.flat();
    },
    enabled: !isAdmin && trainerMissions.length > 0,
  });

  // Trainer priority tasks
  const trainerPriorityTasks = useMemo(() => {
    if (!allSteps) return [];
    const now = new Date();
    return allSteps
      .filter((step: MissionStep & { mission: Mission }) => {
        if (step.isCompleted) return false;
        if (step.status === "done" || step.status === "na") return false;
        if (step.status === "priority" || step.status === "late") return true;
        if (step.dueDate) {
          return differenceInDays(new Date(step.dueDate), now) <= 7;
        }
        return false;
      })
      .sort((a: MissionStep & { mission: Mission }, b: MissionStep & { mission: Mission }) => {
        const order: Record<string, number> = { late: 0, priority: 1, todo: 2 };
        const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (diff !== 0) return diff;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return 0;
      })
      .slice(0, 8);
  }, [allSteps]);

  // Trainer: all tasks grouped by status for "État des tâches"
  const taskStatusSummary = useMemo(() => {
    if (!allSteps) return { total: 0, done: 0, inProgress: 0, late: 0, priority: 0, todo: 0 };
    const total = allSteps.length;
    const done = allSteps.filter((s: any) => s.isCompleted || s.status === "done").length;
    const late = allSteps.filter((s: any) => !s.isCompleted && s.status === "late").length;
    const priority = allSteps.filter((s: any) => !s.isCompleted && s.status === "priority").length;
    const inProgress = allSteps.filter((s: any) => !s.isCompleted && s.status === "in_progress").length;
    const todo = total - done - late - priority - inProgress;
    return { total, done, inProgress, late, priority, todo };
  }, [allSteps]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title={isAdmin ? "Tableau de bord Admin" : "Mon Espace Formateur"} />

        <div className="p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-r from-primary/10 to-violet-100/50 rounded-2xl p-6 border border-primary/10">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Bienvenue{user?.firstName ? `, ${user.firstName}` : ""} !
              </h2>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Gerez vos missions, formateurs et clients depuis votre tableau de bord."
                  : "Consultez vos missions assignees et suivez votre activite."}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          {isAdmin ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Missions Totales"
                value={stats?.totalMissions || 0}
                icon={Briefcase}
                href="/missions"
              />
              <StatCard
                label="Missions Actives"
                value={stats?.activeMissions || 0}
                icon={Clock}
                trend={stats?.activeMissions > 0 ? "En cours" : undefined}
                trendUp={true}
                href="/missions"
              />
              <StatCard
                label="Missions Terminees"
                value={stats?.completedMissions || 0}
                icon={CheckCircle2}
                href="/missions"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="En cours" value={trainerStats?.inProgress || 0} icon={Clock} href="/missions" />
              <StatCard label="Confirmees" value={trainerStats?.confirmed || 0} icon={Briefcase} href="/missions" />
              <StatCard label="A venir" value={trainerStats?.upcoming || 0} icon={CalendarDays} href="/missions" />
              <StatCard label="Terminees" value={trainerStats?.completed || 0} icon={CheckCircle2} href="/missions" />
              <StatCard label="Mes clients" value={trainerClients.length} icon={Building2} />
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* ===== ADMIN SECTIONS ===== */}

            {/* Suivi des Taches - checklist style */}
            {isAdmin && (missionTasksProgress || []).length > 0 && (
              <GridCard
                title="Suivi des Taches"
                actionLabel="Voir les missions"
                actionLink="/missions"
                className="xl:col-span-2"
              >
                <div className="divide-y divide-border">
                  {(missionTasksProgress || []).map((task: MissionTaskProgress) => {
                    const initials = `${(task.assigneeFirstName || "?")[0]}${(task.assigneeLastName || "?")[0]}`.toUpperCase();
                    const fullName = `${task.assigneeFirstName || ""} ${task.assigneeLastName || ""}`.trim() || "Non assigne";
                    const progressColor = task.progress === 100
                      ? "bg-green-500"
                      : task.progress >= 50
                        ? "bg-primary"
                        : "bg-sky-400";
                    return (
                      <div
                        key={`task-${task.missionId}`}
                        data-testid={`task-row-${task.missionId}`}
                        className="flex items-center gap-4 py-3 px-2 hover-elevate cursor-pointer rounded-md"
                        onClick={() => setLocation(`/missions/${task.missionId}`)}
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ListChecks className="w-4 h-4 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" data-testid={`task-title-${task.missionId}`}>
                            {task.missionTitle}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.completedSteps}/{task.totalSteps} taches
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground hidden sm:block max-w-[120px] truncate" data-testid={`task-assignee-${task.missionId}`}>
                            {fullName}
                          </span>
                        </div>

                        <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground min-w-[130px]">
                          <Clock className="w-3 h-3" />
                          {task.updatedAt
                            ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: fr })
                            : "---"}
                        </div>

                        <div className="w-24 lg:w-32 flex-shrink-0" data-testid={`task-progress-${task.missionId}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GridCard>
            )}

            {/* Alertes (late + priority + missing docs) - admin only */}
            {isAdmin && hasAlerts && (
              <GridCard
                title="Alertes"
                actionLabel=""
                actionLink=""
              >
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lateTasks.map((task: TaskAlertItem) => (
                    <div
                      key={`late-${task.stepId}`}
                      className="flex items-center gap-3 p-2 rounded-md bg-red-50 dark:bg-red-950/30 cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/missions/${task.missionId}`)}
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.stepTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.missionTitle} - {task.assigneeFirstName} {task.assigneeLastName}</p>
                      </div>
                      <Badge variant="destructive" className="text-[10px] flex-shrink-0">J+{task.daysOverdue}</Badge>
                    </div>
                  ))}
                  {adminPriorityTasks.map((task: TaskAlertItem) => (
                    <div
                      key={`priority-${task.stepId}`}
                      className="flex items-center gap-3 p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/missions/${task.missionId}`)}
                    >
                      <Flag className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.stepTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.missionTitle} - {task.assigneeFirstName} {task.assigneeLastName}</p>
                      </div>
                      <Badge className="text-[10px] flex-shrink-0 bg-orange-100 text-orange-700 border-orange-300">Prioritaire</Badge>
                    </div>
                  ))}
                  {missingDocuments.map((doc: MissingDocumentAlert) => (
                    <div
                      key={`doc-${doc.documentId}`}
                      className="flex items-center gap-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/missions/${doc.missionId}`)}
                    >
                      <FileX className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.documentTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.missionTitle} - {doc.trainerFirstName} {doc.trainerLastName}</p>
                      </div>
                      <Badge className="text-[10px] flex-shrink-0 bg-amber-100 text-amber-700 border-amber-300">Non depose</Badge>
                    </div>
                  ))}
                </div>
              </GridCard>
            )}

            {/* Historique des modifications (in-app notifications) - admin only */}
            {isAdmin && (
              <GridCard
                title="Historique des modifications"
                actionLabel=""
                actionLink=""
              >
                <div className="space-y-3">
                  {(inAppNotifications || []).length > 0 ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                          onClick={() => markAllAsRead.mutate()}
                          disabled={markAllAsRead.isPending}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tout marquer comme lu
                        </Button>
                      </div>
                      {(inAppNotifications || []).slice(0, 8).map((notification: InAppNotification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {notification.type === 'admin_alert' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Bell className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              {notification.metadata?.trainerName && (
                                <span className="bg-muted px-1.5 py-0.5 rounded">
                                  {notification.metadata.trainerName}
                                </span>
                              )}
                              {notification.metadata?.clientName && (
                                <span className="bg-muted px-1.5 py-0.5 rounded">
                                  {notification.metadata.clientName}
                                </span>
                              )}
                              {notification.metadata?.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(notification.metadata.startDate), "d MMM", { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Aucune notification non lue
                    </div>
                  )}
                </div>
              </GridCard>
            )}

            {/* Prochaines Missions */}
            <GridCard
              title="Prochaines Missions"
              actionLabel="Voir toutes les missions"
              actionLink="/missions"
              className="xl:col-span-2"
            >
              <div className="space-y-4">
                {upcomingMissions.length > 0 ? (
                  upcomingMissions.map((mission: Mission) => {
                    const { label, color } = getMissionStatusLabel(mission.status as MissionStatus);
                    return (
                      <Link key={mission.id} href={`/missions/${mission.id}`}>
                        <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {mission.title}
                                </h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                                  {label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {(() => {
                                  const sessions = sessionsByMission[mission.id];
                                  if (sessions && sessions.length > 0) {
                                    return (
                                      <span className="flex items-center gap-1 flex-wrap">
                                        <Calendar className="w-3 h-3" />
                                        {sessions.map((s: MissionSession, i: number) => (
                                          <span key={i} className="inline-flex bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                                            {format(new Date(s.sessionDate), "d MMM yyyy", { locale: fr })}
                                          </span>
                                        ))}
                                      </span>
                                    );
                                  }
                                  if (mission.startDate) {
                                    return (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                {mission.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {mission.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucune mission planifiee
                  </div>
                )}
              </div>
            </GridCard>

            {/* Actions Rapides - admin only */}
            {isAdmin && (
              <GridCard
                title="Actions Rapides"
                actionLabel=""
                actionLink=""
              >
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/missions">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <span className="text-xs">Nouvelle Mission</span>
                    </Button>
                  </Link>
                  <Link href="/clients">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-xs">Nouveau Client</span>
                    </Button>
                  </Link>
                </div>
              </GridCard>
            )}

            {/* ===== TRAINER/PRESTATAIRE SECTIONS ===== */}

            {/* État des tâches - trainer */}
            {!isAdmin && (allSteps || []).length > 0 && (
              <GridCard
                title="Etat des taches"
                actionLabel=""
                actionLink=""
                className="xl:col-span-2"
              >
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                      <p className="text-2xl font-bold text-green-700">{taskStatusSummary.done}</p>
                      <p className="text-xs text-green-600">Terminees</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                      <p className="text-2xl font-bold text-blue-700">{taskStatusSummary.inProgress + taskStatusSummary.todo}</p>
                      <p className="text-xs text-blue-600">A faire</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                      <p className="text-2xl font-bold text-amber-700">{taskStatusSummary.priority}</p>
                      <p className="text-xs text-amber-600">Prioritaires</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                      <p className="text-2xl font-bold text-red-700">{taskStatusSummary.late}</p>
                      <p className="text-xs text-red-600">En retard</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {taskStatusSummary.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progression globale</span>
                        <span>{Math.round((taskStatusSummary.done / taskStatusSummary.total) * 100)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(taskStatusSummary.done / taskStatusSummary.total) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {/* Priority/late task list */}
                  {trainerPriorityTasks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Taches prioritaires & en retard</p>
                      {trainerPriorityTasks.map((step: MissionStep & { mission: Mission }) => {
                        const isLate = step.status === "late" || (step.dueDate && new Date(step.dueDate) < new Date());
                        return (
                          <div
                            key={step.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${isLate ? "bg-red-50 border-red-200 hover:bg-red-100" : "bg-amber-50 border-amber-200 hover:bg-amber-100"}`}
                            onClick={() => setLocation(`/missions/${step.missionId}`)}
                          >
                            <div className={`p-2 rounded-lg ${isLate ? "bg-red-100" : "bg-amber-100"}`}>
                              {isLate ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{step.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{step.mission.title}</p>
                              {step.dueDate && (
                                <p className={`text-xs mt-1 ${isLate ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                  Echeance: {format(new Date(step.dueDate), "d MMM yyyy", { locale: fr })}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className={isLate ? "bg-red-100 text-red-700 border-red-300" : "bg-amber-100 text-amber-700 border-amber-300"}>
                              {isLate ? "En retard" : "Prioritaire"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GridCard>
            )}

            {/* Notifications for trainers/prestataires */}
            {!isAdmin && recentNotifications.length > 0 && (
              <GridCard
                title="Mes Rappels"
                actionLabel=""
                actionLink=""
              >
                <div className="space-y-3">
                  {recentNotifications.map((notification: InAppNotification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {notification.message}
                        </p>
                        {notification.metadata?.startDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                            <CalendarDays className="w-3 h-3" />
                            {format(new Date(notification.metadata.startDate), "d MMMM yyyy", { locale: fr })}
                          </span>
                        )}
                        {notification.metadata?.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {notification.metadata.location}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </GridCard>
            )}
          </div>

          {/* Trainer: Prochaines missions (14 jours) */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                    Prochaines missions (14 jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trainerUpcomingMissions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Aucune mission prevue dans les 14 prochains jours
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {trainerUpcomingMissions.map((mission: Mission) => {
                        const client = allClients?.find((c: Client) => c.id === mission.clientId);
                        const sessions = sessionsByMission[mission.id];
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const nextSessionDate = sessions && sessions.length > 0
                          ? sessions.map((s) => new Date(s.sessionDate)).filter((d) => { d.setHours(0, 0, 0, 0); return d >= now; }).sort((a, b) => a.getTime() - b.getTime())[0]
                          : mission.startDate ? new Date(mission.startDate) : null;
                        const daysUntil = nextSessionDate ? differenceInDays(nextSessionDate, new Date()) : 0;

                        return (
                          <div
                            key={mission.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            onClick={() => setLocation(`/missions/${mission.id}`)}
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-lg flex flex-col items-center justify-center">
                              {nextSessionDate ? (
                                <>
                                  <span className="text-xs font-medium">{format(nextSessionDate, "MMM", { locale: fr }).toUpperCase()}</span>
                                  <span className="text-lg font-bold leading-none">{format(nextSessionDate, "d")}</span>
                                </>
                              ) : (
                                <CalendarDays className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{mission.title}</p>
                              <p className="text-xs text-muted-foreground">{client?.name || "Client non defini"}</p>
                              {sessions && sessions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sessions.map((s: MissionSession, i: number) => (
                                    <span key={i} className="inline-flex bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">
                                      {format(new Date(s.sessionDate), "d MMM", { locale: fr })}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {mission.location && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {mission.location}
                                </span>
                              )}
                            </div>
                            <Badge variant="outline" className={daysUntil === 0 ? "bg-red-100 text-red-700 border-red-300" : daysUntil <= 3 ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-blue-100 text-blue-700 border-blue-300"}>
                              {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? "Demain" : `J-${daysUntil}`}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mes Clients */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    Mes Clients ({trainerClients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trainerClients.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Aucun client assigne</p>
                  ) : (
                    <div className="space-y-3">
                      {trainerClients.map((client: Client) => (
                        <div key={client.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{client.name}</p>
                            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {client.contactName && <p>{client.contactName}</p>}
                              {client.contactEmail && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.contactEmail}</p>}
                              {client.contactPhone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.contactPhone}</p>}
                            </div>
                          </div>
                          <Badge variant="outline" className={client.contractStatus === "client" ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-100 text-blue-700 border-blue-300"}>
                            {client.contractStatus === "client" ? "Client" : client.contractStatus === "negotiation" ? "Negociation" : client.contractStatus === "lost" ? "Perdu" : "Prospect"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trainer: Calendar */}
          {!isAdmin && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Mon Calendrier
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[calc(100vh-420px)] min-h-[500px]">
                  <MissionCalendar
                    missions={trainerMissions}
                    sessions={allSessions || []}
                    view={calView}
                    onViewChange={setCalView}
                    selectedDate={calDate}
                    onDateChange={setCalDate}
                  />
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
