import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Bell, Menu, FileText, CheckCheck, Clock, AlertTriangle, Briefcase, ListTodo, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  useTemplateNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-templates";
import {
  useUnreadInAppNotifications,
  useMarkInAppNotificationRead,
  useMarkAllInAppNotificationsRead,
} from "@/hooks/use-notifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { InAppNotification } from "@shared/schema";

// Helper to get icon based on notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'reminder':
      return <Clock className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />;
    case 'admin_alert':
      return <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />;
    case 'mission_assignment':
      return <Briefcase className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />;
    case 'mission_update':
      return <Briefcase className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />;
    case 'template_update':
    default:
      return <FileText className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />;
  }
}

function NotificationItem({ notification, onMarkRead, onClickBody }: { notification: InAppNotification; onMarkRead: () => void; onClickBody: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
      <button
        onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
        title="Marquer comme lu"
      >
        <Check className="w-3 h-3 text-transparent hover:text-primary" />
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClickBody}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{notification.title}</p>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">Nouveau</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            {notification.metadata && (
              <div className="flex flex-wrap gap-2 mt-2">
                {notification.metadata.location && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {notification.metadata.location}
                  </span>
                )}
                {notification.metadata.trainerName && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {notification.metadata.trainerName}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {notification.createdAt && format(new Date(notification.createdAt), "PPP a HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ title }: { title: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Template notifications (existing)
  const { data: templateNotifications } = useTemplateNotifications();
  const markTemplateAsRead = useMarkNotificationRead();
  const markAllTemplatesAsRead = useMarkAllNotificationsRead();

  // In-app notifications (new)
  const { data: inAppNotifications } = useUnreadInAppNotifications();
  const markInAppAsRead = useMarkInAppNotificationRead();
  const markAllInAppAsRead = useMarkAllInAppNotificationsRead();

  const [isOpen, setIsOpen] = useState(false);

  // Combine both types of notifications
  const templateUnreadCount = templateNotifications?.filter((n: any) => !n.isRead).length || 0;
  const inAppUnreadCount = inAppNotifications?.length || 0;
  const totalUnreadCount = templateUnreadCount + inAppUnreadCount;

  const handleMarkTemplateAsRead = async (notificationId: number) => {
    await markTemplateAsRead.mutateAsync(notificationId);
  };

  const handleMarkInAppAsRead = async (notificationId: number) => {
    await markInAppAsRead.mutateAsync(notificationId);
  };

  const handleInAppNotificationClick = async (notification: InAppNotification) => {
    await markInAppAsRead.mutateAsync(notification.id);
    if (notification.missionId) {
      setLocation(`/missions/${notification.missionId}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Mark both types as read
    if (templateUnreadCount > 0) {
      await markAllTemplatesAsRead.mutateAsync();
    }
    if (inAppUnreadCount > 0) {
      await markAllInAppAsRead.mutateAsync();
    }
  };

  // Show notifications for all authenticated users
  const showNotifications = !!user;

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

          {showNotifications && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                  <Bell className="h-5 w-5" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background px-1">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px] sm:w-[450px] p-0">
                <SheetHeader className="p-6 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl">Notifications</SheetTitle>
                    {totalUnreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs h-8"
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Tout lire
                      </Button>
                    )}
                  </div>
                  {totalUnreadCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {totalUnreadCount} notification{totalUnreadCount > 1 ? 's' : ''} non lue{totalUnreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)]">
                  {totalUnreadCount === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    <div>
                      {/* Group: Admin alerts (urgent) */}
                      {(() => {
                        const alerts = inAppNotifications?.filter((n: InAppNotification) => n.type === 'admin_alert') || [];
                        if (alerts.length === 0) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b sticky top-0">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Alertes urgentes</span>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">{alerts.length}</Badge>
                            </div>
                            <div className="divide-y">
                              {alerts.map((notification: InAppNotification) => (
                                <NotificationItem key={`in-app-${notification.id}`} notification={notification} onMarkRead={() => handleMarkInAppAsRead(notification.id)} onClickBody={() => handleInAppNotificationClick(notification)} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Group: Mission reminders */}
                      {(() => {
                        const reminders = inAppNotifications?.filter((n: InAppNotification) => n.type === 'reminder') || [];
                        if (reminders.length === 0) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b sticky top-0">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Rappels missions</span>
                              <Badge className="text-[10px] px-1.5 py-0 ml-auto bg-orange-500 text-white">{reminders.length}</Badge>
                            </div>
                            <div className="divide-y">
                              {reminders.map((notification: InAppNotification) => (
                                <NotificationItem key={`in-app-${notification.id}`} notification={notification} onMarkRead={() => handleMarkInAppAsRead(notification.id)} onClickBody={() => handleInAppNotificationClick(notification)} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Group: Mission assignments */}
                      {(() => {
                        const assignments = inAppNotifications?.filter((n: InAppNotification) => n.type === 'mission_assignment') || [];
                        if (assignments.length === 0) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b sticky top-0">
                              <Briefcase className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Missions assignees</span>
                              <Badge className="text-[10px] px-1.5 py-0 ml-auto bg-blue-500 text-white">{assignments.length}</Badge>
                            </div>
                            <div className="divide-y">
                              {assignments.map((notification: InAppNotification) => (
                                <NotificationItem key={`in-app-${notification.id}`} notification={notification} onMarkRead={() => handleMarkInAppAsRead(notification.id)} onClickBody={() => handleInAppNotificationClick(notification)} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Group: Mission updates */}
                      {(() => {
                        const updates = inAppNotifications?.filter((n: InAppNotification) => n.type === 'mission_update') || [];
                        if (updates.length === 0) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b sticky top-0">
                              <ListTodo className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Mises a jour missions</span>
                              <Badge className="text-[10px] px-1.5 py-0 ml-auto bg-green-500 text-white">{updates.length}</Badge>
                            </div>
                            <div className="divide-y">
                              {updates.map((notification: InAppNotification) => (
                                <NotificationItem key={`in-app-${notification.id}`} notification={notification} onMarkRead={() => handleMarkInAppAsRead(notification.id)} onClickBody={() => handleInAppNotificationClick(notification)} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Group: Template updates */}
                      {(() => {
                        const templateUpdates = [
                          ...(inAppNotifications?.filter((n: InAppNotification) => n.type === 'template_update') || []).map((n: InAppNotification) => ({ kind: 'inapp' as const, data: n })),
                          ...(templateNotifications?.filter((n: any) => !n.isRead) || []).map((n: any) => ({ kind: 'template' as const, data: n })),
                        ];
                        if (templateUpdates.length === 0) return null;
                        return (
                          <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-b sticky top-0">
                              <FileText className="w-4 h-4 text-violet-500" />
                              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Documents & templates</span>
                              <Badge className="text-[10px] px-1.5 py-0 ml-auto bg-violet-500 text-white">{templateUpdates.length}</Badge>
                            </div>
                            <div className="divide-y">
                              {templateUpdates.map((item) => {
                                if (item.kind === 'inapp') {
                                  const notification = item.data as InAppNotification;
                                  return <NotificationItem key={`in-app-${notification.id}`} notification={notification} onMarkRead={() => handleMarkInAppAsRead(notification.id)} onClickBody={() => handleInAppNotificationClick(notification)} />;
                                }
                                const notification = item.data;
                                return (
                                  <div
                                    key={`template-${notification.id}`}
                                    className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                                  >
                                    <button
                                      onClick={() => handleMarkTemplateAsRead(notification.id)}
                                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                                      title="Marquer comme lu"
                                    >
                                      <Check className="w-3 h-3 text-transparent hover:text-primary" />
                                    </button>
                                    <FileText className="w-4 h-4 mt-0.5 text-violet-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium">Mise a jour du template</p>
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">Nouveau</Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">Un template de document a ete mis a jour</p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {format(new Date(notification.createdAt), "PPP a HH:mm", { locale: fr })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
