import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Clock,
  Mail,
  User,
  Building2,
  GraduationCap,
  Check,
  X,
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Hooks for reminder settings
function useReminderSettings() {
  return useQuery({
    queryKey: [api.reminderSettings.list.path],
    queryFn: async () => {
      const res = await fetch(api.reminderSettings.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch reminder settings");
      return res.json();
    },
  });
}

function useCreateReminderSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.reminderSettings.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminderSettings.list.path] });
    },
  });
}

function useUpdateReminderSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const url = buildUrl(api.reminderSettings.update.path, { id });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminderSettings.list.path] });
    },
  });
}

function useDeleteReminderSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reminderSettings.delete.path, { id });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminderSettings.list.path] });
    },
  });
}

// Pending reminders hook
function usePendingReminders() {
  return useQuery({
    queryKey: [api.reminders.pending.path],
    queryFn: async () => {
      const res = await fetch(api.reminders.pending.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch pending reminders");
      return res.json();
    },
  });
}

// Generate all reminders
function useGenerateAllReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reminders/generate-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to generate reminders");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.pending.path] });
    },
  });
}

// Process pending reminders (send emails)
function useProcessReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.reminders.process.path, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to process reminders");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.pending.path] });
    },
  });
}

const reminderTypeLabels: Record<string, string> = {
  mission_start: "Debut de formation",
  task_deadline: "Deadline de tache",
  admin_summary: "Resume admin",
};

const reminderTypeColors: Record<string, string> = {
  mission_start: "bg-blue-100 text-blue-700",
  task_deadline: "bg-orange-100 text-orange-700",
  admin_summary: "bg-purple-100 text-purple-700",
};

export default function ReminderSettings() {
  const { data: settings, isLoading } = useReminderSettings();
  const { data: pendingReminders } = usePendingReminders();
  const createSetting = useCreateReminderSetting();
  const updateSetting = useUpdateReminderSetting();
  const deleteSetting = useDeleteReminderSetting();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    reminderType: "mission_start",
    daysBefore: 7,
    emailSubject: "",
    notifyAdmin: false,
    notifyTrainer: false,
    notifyClient: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      reminderType: "mission_start",
      daysBefore: 7,
      emailSubject: "",
      notifyAdmin: false,
      notifyTrainer: false,
      notifyClient: false,
    });
    setEditingId(null);
  };

  const openEditDialog = (setting: any) => {
    setEditingId(setting.id);
    setFormData({
      name: setting.name,
      reminderType: setting.reminderType,
      daysBefore: setting.daysBefore,
      emailSubject: setting.emailSubject || "",
      notifyAdmin: setting.notifyAdmin,
      notifyTrainer: setting.notifyTrainer,
      notifyClient: setting.notifyClient,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateSetting.mutateAsync({ id: editingId, data: formData });
      } else {
        await createSetting.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    await updateSetting.mutateAsync({ id, data: { isActive: !isActive } });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Etes-vous sur de vouloir supprimer ce parametre ?")) {
      await deleteSetting.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <Header title="Parametres des rappels" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Parametres des rappels" />

        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Rappels automatiques</h1>
              <p className="text-muted-foreground">
                Configurez les rappels envoyes automatiquement avant les formations
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau rappel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Modifier le rappel" : "Nouveau rappel"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les parametres du rappel automatique
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom du rappel</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Rappel J-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type de rappel</Label>
                    <Select
                      value={formData.reminderType}
                      onValueChange={(value) => setFormData({ ...formData, reminderType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mission_start">Debut de formation</SelectItem>
                        <SelectItem value="task_deadline">Deadline de tache</SelectItem>
                        <SelectItem value="admin_summary">Resume admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Jours avant l'evenement</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.daysBefore}
                      onChange={(e) => setFormData({ ...formData, daysBefore: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le rappel sera envoye {formData.daysBefore} jour(s) avant la date de l'evenement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sujet de l'email (optionnel)</Label>
                    <Input
                      value={formData.emailSubject}
                      onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      placeholder="Ex: Rappel: Formation dans X jours"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Destinataires</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          <span>Administrateur</span>
                        </div>
                        <Switch
                          checked={formData.notifyAdmin}
                          onCheckedChange={(checked) => setFormData({ ...formData, notifyAdmin: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          <span>Formateur</span>
                        </div>
                        <Switch
                          checked={formData.notifyTrainer}
                          onCheckedChange={(checked) => setFormData({ ...formData, notifyTrainer: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-500" />
                          <span>Client</span>
                        </div>
                        <Switch
                          checked={formData.notifyClient}
                          onCheckedChange={(checked) => setFormData({ ...formData, notifyClient: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.name || createSetting.isPending || updateSetting.isPending}>
                    {editingId ? "Enregistrer" : "Creer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rappels configures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rappels actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {settings?.filter((s: any) => s.isActive).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente d'envoi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingReminders?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Parametres des rappels
              </CardTitle>
              <CardDescription>
                Definissez quand et a qui envoyer les rappels automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings && settings.length > 0 ? (
                <div className="space-y-4">
                  {settings.map((setting: any) => (
                    <div
                      key={setting.id}
                      className={`p-4 border rounded-lg ${setting.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{setting.name}</h3>
                            <Badge className={reminderTypeColors[setting.reminderType]}>
                              {reminderTypeLabels[setting.reminderType]}
                            </Badge>
                            {setting.isActive ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Inactif
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              J-{setting.daysBefore}
                            </span>
                            {setting.emailSubject && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {setting.emailSubject}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">Destinataires:</span>
                            {setting.notifyAdmin && (
                              <Badge variant="outline" className="text-purple-600 bg-purple-50">
                                <User className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {setting.notifyTrainer && (
                              <Badge variant="outline" className="text-blue-600 bg-blue-50">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Formateur
                              </Badge>
                            )}
                            {setting.notifyClient && (
                              <Badge variant="outline" className="text-green-600 bg-green-50">
                                <Building2 className="w-3 h-3 mr-1" />
                                Client
                              </Badge>
                            )}
                            {!setting.notifyAdmin && !setting.notifyTrainer && !setting.notifyClient && (
                              <span className="text-xs text-muted-foreground italic">Aucun destinataire</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={setting.isActive}
                            onCheckedChange={() => handleToggleActive(setting.id, setting.isActive)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(setting)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rappel configure</p>
                  <p className="text-sm">Cliquez sur "Nouveau rappel" pour commencer</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending reminders preview */}
          {pendingReminders && pendingReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Prochains rappels a envoyer
                </CardTitle>
                <CardDescription>
                  Rappels programmes en attente d'envoi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingReminders.slice(0, 10).map((reminder: any) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{reminder.recipientName}</p>
                          <p className="text-xs text-muted-foreground">{reminder.recipientEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(reminder.scheduledDate), "d MMM yyyy", { locale: fr })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {reminder.recipientType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {pendingReminders.length > 10 && (
                    <p className="text-sm text-center text-muted-foreground pt-2">
                      ... et {pendingReminders.length - 10} autres rappels
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
