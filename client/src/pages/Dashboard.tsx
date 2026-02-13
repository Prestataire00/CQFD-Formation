import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { GridCard } from "@/components/DashboardGrid";
import { Badge } from "@/components/ui/badge";
import { useStats, useMissions, useAllSessions } from "@/hooks/use-missions";
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
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Calendar,
  MapPin,
  ArrowRight,
  AlertTriangle,
  FileX,
  Bell,
  CheckCheck,
  Flag,
  ListChecks,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import type { Mission, MissionStatus, MissionSession, InAppNotification } from "@shared/schema";

function getMissionStatusLabel(status: MissionStatus): { label: string; color: string } {
  const styles: Record<MissionStatus, { label: string; color: string }> = {
    draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
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

  const isAdmin = user?.role === "admin";
  const { data: taskAlerts } = useTaskAlerts(isAdmin);
  const { data: missionTasksProgress } = useMissionTasksProgress(isAdmin);

  // Get 4 most recent notifications (for trainer view)
  const recentNotifications = (inAppNotifications || []).slice(0, 4);

  // Handle notification click
  const handleNotificationClick = async (notification: InAppNotification) => {
    await markInAppAsRead.mutateAsync(notification.id);
    if (notification.missionId) {
      setLocation(`/missions/${notification.missionId}`);
    }
  };

  // Get upcoming missions (next 5)
  const upcomingMissions = missions
    ?.filter((m: Mission) => m.status === "draft" || m.status === "confirmed" || m.status === "in_progress")
    .sort((a: Mission, b: Mission) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 5) || [];

  // Task alerts data
  const lateTasks = taskAlerts?.lateTasks || [];
  const priorityTasks = taskAlerts?.priorityTasks || [];
  const missingDocuments = taskAlerts?.missingDocuments || [];
  const hasAlerts = lateTasks.length > 0 || priorityTasks.length > 0 || missingDocuments.length > 0;

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
            {!isAdmin && (
              <StatCard
                label="Note Moyenne"
                value={stats?.averageRating ? `${stats.averageRating}/5` : "N/A"}
                icon={Star}
              />
            )}
          </div>

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
                  {priorityTasks.map((task: TaskAlertItem) => (
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

            {/* For trainers/prestataires */}
            {!isAdmin && (
              <GridCard
                title="Mon Activite"
                actionLabel=""
                actionLink=""
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Missions en cours</span>
                    <span className="font-bold text-lg text-primary">{stats?.activeMissions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Missions terminees</span>
                    <span className="font-bold text-lg">{stats?.completedMissions || 0}</span>
                  </div>
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
                            <Calendar className="w-3 h-3" />
                            {format(new Date(notification.metadata.startDate), "d MMMM yyyy", { locale: fr })}
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

        </div>
      </main>
    </div>
  );
}
