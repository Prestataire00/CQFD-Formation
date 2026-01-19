import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Bell, Menu, FileText, CheckCheck, Clock, AlertTriangle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    case 'template_update':
    default:
      return <FileText className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />;
  }
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

  const handleMarkInAppAsRead = async (notification: InAppNotification) => {
    await markInAppAsRead.mutateAsync(notification.id);
    // Navigate to mission if there's a missionId
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
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                  <Bell className="h-5 w-5" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background px-1">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="flex items-center justify-between px-2 py-1">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  {totalUnreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-7"
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Tout lire
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {totalUnreadCount === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {/* In-App Notifications (reminders, alerts, etc.) */}
                    {inAppNotifications?.map((notification: InAppNotification) => (
                      <DropdownMenuItem
                        key={`in-app-${notification.id}`}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleMarkInAppAsRead(notification)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                Nouveau
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.metadata && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {notification.metadata.location && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {notification.metadata.location}
                                  </span>
                                )}
                                {notification.metadata.trainerName && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {notification.metadata.trainerName}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.createdAt && format(new Date(notification.createdAt), "PPP à HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}

                    {/* Template Notifications */}
                    {templateNotifications?.filter((n: any) => !n.isRead).map((notification: any) => (
                      <DropdownMenuItem
                        key={`template-${notification.id}`}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleMarkTemplateAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <FileText className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">
                                Mise à jour du template
                              </p>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                Nouveau
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Un template de document a été mis à jour
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(notification.createdAt), "PPP à HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
