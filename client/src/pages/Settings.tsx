import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Lock,
  Bell,
  Building2,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Euro,
  Globe,
  Clock,
  Plus,
  Trash2,
  Edit,
  BellRing,
  Check,
  X,
  MessageSquare,
  ListTodo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TASK_EXPLANATIONS } from "@/lib/task-explanations";
import { getTaskTemplates, formatDeadlineLabel } from "@/lib/task-templates";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  // Profile state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailMissionAssigned: true,
    emailMissionUpdated: true,
    emailNewDocument: true,
    emailWeeklyReport: false,
    emailReminders: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Company settings (admin only)
  const [companyForm, setCompanyForm] = useState({
    name: "Mon Organisme de Formation",
    siret: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    nda: "", // Numero de declaration d'activite
    tvaRate: "20",
    defaultPaymentTerms: "30",
    invoicePrefix: "FAC",
    missionPrefix: "MISS",
  });
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Task deadline defaults state (admin only)
  const [deadlineDefaults, setDeadlineDefaults] = useState<any[]>([]);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(false);
  const [isSavingDeadlines, setIsSavingDeadlines] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<number | null>(null);
  const [newDeadline, setNewDeadline] = useState({ taskTitle: "", daysBefore: 0, category: "" });
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);

  // Task template viewer state (admin only)
  const [templateTypology, setTemplateTypology] = useState("Intra");
  const [templateTrainerRole, setTemplateTrainerRole] = useState("prestataire");
  const [expandedTaskTitle, setExpandedTaskTitle] = useState<string | null>(null);

  // Reminder settings state (admin only)
  const [reminderSettings, setReminderSettings] = useState<any[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [editingReminderData, setEditingReminderData] = useState<any>(null);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: "",
    reminderType: "mission_start",
    daysBefore: 7,
    isActive: true,
    emailSubject: "",
    notifyAdmin: false,
    notifyTrainer: true,
    notifyClient: false,
  });

  // Task explanations (consignes) state (admin only)
  const [taskExplanationsDb, setTaskExplanationsDb] = useState<any[]>([]);
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(false);
  const [isSavingExplanation, setIsSavingExplanation] = useState(false);
  const [editingExplanationId, setEditingExplanationId] = useState<number | null>(null);
  const [editingExplanationText, setEditingExplanationText] = useState("");
  const [isAddingExplanation, setIsAddingExplanation] = useState(false);
  const [newExplanation, setNewExplanation] = useState({ taskName: "", explanation: "" });

  // Load deadline defaults and reminder settings
  useEffect(() => {
    if (isAdmin) {
      setIsLoadingDeadlines(true);
      fetch("/api/task-deadline-defaults", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setDeadlineDefaults(data))
        .catch(() => {})
        .finally(() => setIsLoadingDeadlines(false));

      setIsLoadingReminders(true);
      fetch("/api/reminder-settings", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setReminderSettings(data))
        .catch(() => {})
        .finally(() => setIsLoadingReminders(false));

      setIsLoadingExplanations(true);
      fetch("/api/task-explanations", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setTaskExplanationsDb(data))
        .catch(() => {})
        .finally(() => setIsLoadingExplanations(false));
    }
  }, [isAdmin]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          address: profileForm.address,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise a jour");

      toast({
        title: "Profil mis a jour",
        description: "Vos informations ont ete enregistrees.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour le profil.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch(`/api/users/${user?.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur lors du changement de mot de passe");
      }

      toast({
        title: "Mot de passe modifie",
        description: "Votre mot de passe a ete change avec succes.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      // TODO: Implement notification preferences API
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Preferences enregistrees",
        description: "Vos preferences de notification ont ete mises a jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      // TODO: Implement company settings API
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Parametres enregistres",
        description: "Les parametres de l'entreprise ont ete mis a jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les parametres.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleUpdateDeadline = async (id: number, daysBefore: number) => {
    try {
      const response = await fetch(`/api/task-deadline-defaults/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ daysBefore }),
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setDeadlineDefaults((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
      setEditingDeadlineId(null);
      toast({ title: "Deadline mise a jour" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddDeadline = async () => {
    if (!newDeadline.taskTitle.trim()) return;
    setIsSavingDeadlines(true);
    try {
      const response = await fetch("/api/task-deadline-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newDeadline),
      });
      if (!response.ok) throw new Error();
      const created = await response.json();
      setDeadlineDefaults((prev) => [...prev, created]);
      setNewDeadline({ taskTitle: "", daysBefore: 0, category: "" });
      setIsAddingDeadline(false);
      toast({ title: "Deadline par defaut ajoutee" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsSavingDeadlines(false);
    }
  };

  const handleDeleteDeadline = async (id: number) => {
    try {
      await fetch(`/api/task-deadline-defaults/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeadlineDefaults((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Deadline supprimee" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  // Task explanations (consignes) handlers
  const handleAddExplanation = async () => {
    if (!newExplanation.taskName.trim() || !newExplanation.explanation.trim()) return;
    setIsSavingExplanation(true);
    try {
      const response = await fetch("/api/task-explanations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newExplanation),
      });
      if (!response.ok) throw new Error();
      const created = await response.json();
      setTaskExplanationsDb((prev) => [...prev, created]);
      setNewExplanation({ taskName: "", explanation: "" });
      setIsAddingExplanation(false);
      toast({ title: "Consigne ajoutee" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsSavingExplanation(false);
    }
  };

  const handleUpdateExplanation = async (id: number, explanation: string) => {
    try {
      const response = await fetch(`/api/task-explanations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ explanation }),
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setTaskExplanationsDb((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
      setEditingExplanationId(null);
      setEditingExplanationText("");
      toast({ title: "Consigne mise a jour" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteExplanation = async (id: number) => {
    try {
      await fetch(`/api/task-explanations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setTaskExplanationsDb((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Consigne supprimee (retour au texte par defaut)" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleCustomizeExplanation = (taskName: string, explanation: string) => {
    setNewExplanation({ taskName, explanation });
    setIsAddingExplanation(true);
  };

  // Reminder settings handlers
  const handleCreateReminder = async () => {
    if (!newReminder.name.trim()) return;
    try {
      const response = await fetch("/api/reminder-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newReminder),
      });
      if (!response.ok) throw new Error();
      const created = await response.json();
      setReminderSettings((prev) => [...prev, created]);
      setNewReminder({
        name: "", reminderType: "mission_start", daysBefore: 7,
        isActive: true, emailSubject: "", notifyAdmin: false, notifyTrainer: true, notifyClient: false,
      });
      setIsAddingReminder(false);
      toast({ title: "Rappel cree" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleUpdateReminder = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/reminder-settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setReminderSettings((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditingReminderId(null);
      setEditingReminderData(null);
      toast({ title: "Rappel mis a jour" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await fetch(`/api/reminder-settings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setReminderSettings((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Rappel supprime" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleToggleReminderActive = async (id: number, isActive: boolean) => {
    await handleUpdateReminder(id, { isActive });
  };

  const reminderTypeLabels: Record<string, string> = {
    mission_start: "Debut formation",
    mission_end: "Fin formation",
    task_deadline: "Deadline tache",
    admin_summary: "Resume admin",
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Parametres" />

        <div className="flex-1 p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full max-w-4xl ${isAdmin ? 'grid-cols-8' : 'grid-cols-3'}`}>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Securite</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Entreprise</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="deadlines" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Deadlines</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="reminders" className="flex items-center gap-2">
                  <BellRing className="w-4 h-4" />
                  <span className="hidden sm:inline">Rappels</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="modeles" className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  <span className="hidden sm:inline">Modeles</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="google" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Google</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Gerez vos informations de profil visibles par les autres utilisateurs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prenom</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, firstName: e.target.value })
                        }
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, lastName: e.target.value })
                        }
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      L'email ne peut pas etre modifie. Contactez un administrateur si necessaire.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, address: e.target.value })
                        }
                        placeholder="123 rue de la Formation, 75001 Paris"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                      {isSavingProfile ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Assurez-vous d'utiliser un mot de passe fort et unique.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="********"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="********"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="********"
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={
                        isSavingPassword ||
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword
                      }
                    >
                      {isSavingPassword ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Changer le mot de passe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences de notification</CardTitle>
                  <CardDescription>
                    Choisissez quelles notifications vous souhaitez recevoir par email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mission assignee</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir un email quand une mission vous est assignee
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailMissionAssigned}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailMissionAssigned: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mise a jour de mission</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir un email quand une mission est modifiee
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailMissionUpdated}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailMissionUpdated: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Nouveau document</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir un email quand un document est ajoute
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNewDocument}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailNewDocument: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Rappels</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des rappels pour les taches en retard
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailReminders}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailReminders: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Rapport hebdomadaire</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir un resume de votre activite chaque semaine
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailWeeklyReport}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailWeeklyReport: checked })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                      {isSavingNotifications ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="company">
                <div className="space-y-6">
                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations de l'entreprise</CardTitle>
                      <CardDescription>
                        Ces informations apparaissent sur les documents officiels (factures, conventions, etc.)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Raison sociale</Label>
                          <Input
                            id="companyName"
                            value={companyForm.name}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, name: e.target.value })
                            }
                            placeholder="Mon Organisme de Formation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="siret">SIRET</Label>
                          <Input
                            id="siret"
                            value={companyForm.siret}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, siret: e.target.value })
                            }
                            placeholder="123 456 789 00012"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nda">Numero de declaration d'activite (NDA)</Label>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="nda"
                            value={companyForm.nda}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, nda: e.target.value })
                            }
                            placeholder="11 75 12345 67"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyAddress">Adresse</Label>
                        <Input
                          id="companyAddress"
                          value={companyForm.address}
                          onChange={(e) =>
                            setCompanyForm({ ...companyForm, address: e.target.value })
                          }
                          placeholder="123 rue de la Formation"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyCity">Ville</Label>
                          <Input
                            id="companyCity"
                            value={companyForm.city}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, city: e.target.value })
                            }
                            placeholder="Paris"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyPostalCode">Code postal</Label>
                          <Input
                            id="companyPostalCode"
                            value={companyForm.postalCode}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, postalCode: e.target.value })
                            }
                            placeholder="75001"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyPhone">Telephone</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <Input
                              id="companyPhone"
                              value={companyForm.phone}
                              onChange={(e) =>
                                setCompanyForm({ ...companyForm, phone: e.target.value })
                              }
                              placeholder="01 23 45 67 89"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyEmail">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <Input
                              id="companyEmail"
                              type="email"
                              value={companyForm.email}
                              onChange={(e) =>
                                setCompanyForm({ ...companyForm, email: e.target.value })
                              }
                              placeholder="contact@formation.fr"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite">Site web</Label>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="companyWebsite"
                            value={companyForm.website}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, website: e.target.value })
                            }
                            placeholder="https://www.formation.fr"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Parametres de facturation</CardTitle>
                      <CardDescription>
                        Configurez les valeurs par defaut pour vos factures et missions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tvaRate">Taux de TVA (%)</Label>
                          <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4 text-muted-foreground" />
                            <Input
                              id="tvaRate"
                              type="number"
                              value={companyForm.tvaRate}
                              onChange={(e) =>
                                setCompanyForm({ ...companyForm, tvaRate: e.target.value })
                              }
                              placeholder="20"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentTerms">Delai de paiement (jours)</Label>
                          <Input
                            id="paymentTerms"
                            type="number"
                            value={companyForm.defaultPaymentTerms}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, defaultPaymentTerms: e.target.value })
                            }
                            placeholder="30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoicePrefix">Prefixe des factures</Label>
                          <Input
                            id="invoicePrefix"
                            value={companyForm.invoicePrefix}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })
                            }
                            placeholder="FAC"
                          />
                          <p className="text-xs text-muted-foreground">
                            Ex: FAC-2024-001
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="missionPrefix">Prefixe des missions</Label>
                          <Input
                            id="missionPrefix"
                            value={companyForm.missionPrefix}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, missionPrefix: e.target.value })
                            }
                            placeholder="MISS"
                          />
                          <p className="text-xs text-muted-foreground">
                            Ex: MISS-2024-001
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end">
                        <Button onClick={handleSaveCompany} disabled={isSavingCompany}>
                          {isSavingCompany ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Enregistrer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Deadlines Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="deadlines">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Deadlines par defaut</CardTitle>
                        <CardDescription>
                          Configurez les deadlines automatiques des taches par rapport au 1er jour de formation.
                          J-X = X jours avant, Jour J = le jour meme, J+X = X jours apres.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsAddingDeadline(true)}
                        disabled={isAddingDeadline}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDeadlines ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {isAddingDeadline && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label>Nom de la tache</Label>
                                <Input
                                  value={newDeadline.taskTitle}
                                  onChange={(e) => setNewDeadline({ ...newDeadline, taskTitle: e.target.value })}
                                  placeholder="Ex: Envoyer la convocation"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Jours (positif = avant, negatif = apres)</Label>
                                <Input
                                  type="number"
                                  value={newDeadline.daysBefore}
                                  onChange={(e) => setNewDeadline({ ...newDeadline, daysBefore: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Categorie</Label>
                                <Input
                                  value={newDeadline.category}
                                  onChange={(e) => setNewDeadline({ ...newDeadline, category: e.target.value })}
                                  placeholder="Ex: Avant la formation"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setIsAddingDeadline(false)}>
                                Annuler
                              </Button>
                              <Button size="sm" onClick={handleAddDeadline} disabled={isSavingDeadlines}>
                                {isSavingDeadlines && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Ajouter
                              </Button>
                            </div>
                          </div>
                        )}

                        {["Avant la formation", "Pendant la formation", "Apres la formation"].map((cat) => {
                          const items = deadlineDefaults.filter((d) => d.category === cat);
                          if (items.length === 0) return null;
                          return (
                            <div key={cat}>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                                {cat}
                              </h3>
                              <div className="space-y-2">
                                {items.map((d: any) => (
                                  <div
                                    key={d.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <span className="text-sm font-medium flex-1">{d.taskTitle}</span>
                                      {editingDeadlineId === d.id ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            defaultValue={d.daysBefore}
                                            className="w-24 h-8"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleUpdateDeadline(d.id, parseInt((e.target as HTMLInputElement).value) || 0);
                                              }
                                              if (e.key === 'Escape') setEditingDeadlineId(null);
                                            }}
                                            autoFocus
                                          />
                                          <span className="text-xs text-muted-foreground">jours</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingDeadlineId(null)}
                                          >
                                            Annuler
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setEditingDeadlineId(d.id)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                                        >
                                          {formatDeadlineLabel(d.daysBefore)}
                                          <Edit className="w-3 h-3 ml-1" />
                                        </button>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive ml-2"
                                      onClick={() => handleDeleteDeadline(d.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Show uncategorized items */}
                        {deadlineDefaults.filter((d) => !d.category || !["Avant la formation", "Pendant la formation", "Apres la formation"].includes(d.category)).length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                              Autres
                            </h3>
                            <div className="space-y-2">
                              {deadlineDefaults
                                .filter((d) => !d.category || !["Avant la formation", "Pendant la formation", "Apres la formation"].includes(d.category))
                                .map((d: any) => (
                                  <div
                                    key={d.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <span className="text-sm font-medium flex-1">{d.taskTitle}</span>
                                      {editingDeadlineId === d.id ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            defaultValue={d.daysBefore}
                                            className="w-24 h-8"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleUpdateDeadline(d.id, parseInt((e.target as HTMLInputElement).value) || 0);
                                              }
                                              if (e.key === 'Escape') setEditingDeadlineId(null);
                                            }}
                                            autoFocus
                                          />
                                          <span className="text-xs text-muted-foreground">jours</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingDeadlineId(null)}
                                          >
                                            Annuler
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setEditingDeadlineId(d.id)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                                        >
                                          {formatDeadlineLabel(d.daysBefore)}
                                          <Edit className="w-3 h-3 ml-1" />
                                        </button>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive ml-2"
                                      onClick={() => handleDeleteDeadline(d.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Reminders Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="reminders">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Rappels automatiques par email</CardTitle>
                        <CardDescription>
                          Configurez les rappels envoyes automatiquement avant les echeances.
                          Les rappels sont generes par rapport a la date de debut/fin de formation.
                          Un rappel J-2 est toujours envoye a l'administrateur avant chaque formation.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsAddingReminder(true)}
                        disabled={isAddingReminder}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un rappel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingReminders ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Add new reminder form */}
                        {isAddingReminder && (
                          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                            <h4 className="font-medium">Nouveau rappel</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label>Nom du rappel</Label>
                                <Input
                                  value={newReminder.name}
                                  onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                                  placeholder="Ex: Rappel J-7"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Jours avant l'evenement</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={newReminder.daysBefore}
                                  onChange={(e) => setNewReminder({ ...newReminder, daysBefore: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Type de rappel</Label>
                                <select
                                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                  value={newReminder.reminderType}
                                  onChange={(e) => setNewReminder({ ...newReminder, reminderType: e.target.value })}
                                >
                                  <option value="mission_start">Debut de formation</option>
                                  <option value="mission_end">Fin de formation</option>
                                  <option value="task_deadline">Deadline de tache</option>
                                  <option value="admin_summary">Resume admin</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label>Sujet de l'email (optionnel)</Label>
                                <Input
                                  value={newReminder.emailSubject}
                                  onChange={(e) => setNewReminder({ ...newReminder, emailSubject: e.target.value })}
                                  placeholder="Sujet personnalise"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Destinataires</Label>
                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newReminder.notifyAdmin}
                                    onChange={(e) => setNewReminder({ ...newReminder, notifyAdmin: e.target.checked })}
                                    className="rounded"
                                  />
                                  Admin
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newReminder.notifyTrainer}
                                    onChange={(e) => setNewReminder({ ...newReminder, notifyTrainer: e.target.checked })}
                                    className="rounded"
                                  />
                                  Formateur
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newReminder.notifyClient}
                                    onChange={(e) => setNewReminder({ ...newReminder, notifyClient: e.target.checked })}
                                    className="rounded"
                                  />
                                  Client
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setIsAddingReminder(false)}>
                                Annuler
                              </Button>
                              <Button size="sm" onClick={handleCreateReminder}>
                                Ajouter
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Info banner about J-2 admin reminder */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                          <div className="flex items-center gap-2">
                            <BellRing className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Un rappel automatique J-2 est toujours envoye a l'administrateur avant chaque formation,
                              avec les details du formateur, client, lieu et dates. Ce rappel ne peut pas etre desactive.
                            </span>
                          </div>
                        </div>

                        {/* Existing reminder settings list */}
                        <div className="space-y-3">
                          {reminderSettings.map((setting: any) => (
                            <div
                              key={setting.id}
                              className={`border rounded-lg p-4 transition-colors ${setting.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'}`}
                            >
                              {editingReminderId === setting.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label>Nom</Label>
                                      <Input
                                        value={editingReminderData?.name || ""}
                                        onChange={(e) => setEditingReminderData({ ...editingReminderData, name: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Jours avant</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={editingReminderData?.daysBefore || 0}
                                        onChange={(e) => setEditingReminderData({ ...editingReminderData, daysBefore: parseInt(e.target.value) || 0 })}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Type</Label>
                                      <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={editingReminderData?.reminderType || "mission_start"}
                                        onChange={(e) => setEditingReminderData({ ...editingReminderData, reminderType: e.target.value })}
                                      >
                                        <option value="mission_start">Debut de formation</option>
                                        <option value="mission_end">Fin de formation</option>
                                        <option value="task_deadline">Deadline de tache</option>
                                        <option value="admin_summary">Resume admin</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Sujet email</Label>
                                      <Input
                                        value={editingReminderData?.emailSubject || ""}
                                        onChange={(e) => setEditingReminderData({ ...editingReminderData, emailSubject: e.target.value })}
                                        placeholder="Sujet personnalise"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Destinataires</Label>
                                    <div className="flex flex-wrap gap-4">
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={editingReminderData?.notifyAdmin || false}
                                          onChange={(e) => setEditingReminderData({ ...editingReminderData, notifyAdmin: e.target.checked })}
                                          className="rounded"
                                        />
                                        Admin
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={editingReminderData?.notifyTrainer || false}
                                          onChange={(e) => setEditingReminderData({ ...editingReminderData, notifyTrainer: e.target.checked })}
                                          className="rounded"
                                        />
                                        Formateur
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={editingReminderData?.notifyClient || false}
                                          onChange={(e) => setEditingReminderData({ ...editingReminderData, notifyClient: e.target.checked })}
                                          className="rounded"
                                        />
                                        Client
                                      </label>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => { setEditingReminderId(null); setEditingReminderData(null); }}>
                                      <X className="w-3 h-3 mr-1" /> Annuler
                                    </Button>
                                    <Button size="sm" onClick={() => handleUpdateReminder(setting.id, editingReminderData)}>
                                      <Check className="w-3 h-3 mr-1" /> Enregistrer
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <Switch
                                      checked={setting.isActive}
                                      onCheckedChange={(checked) => handleToggleReminderActive(setting.id, checked)}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{setting.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                          J-{setting.daysBefore}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                          {reminderTypeLabels[setting.reminderType] || setting.reminderType}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                        {setting.emailSubject && (
                                          <span>Sujet: {setting.emailSubject}</span>
                                        )}
                                        <span className="flex items-center gap-1">
                                          Destinataires:
                                          {setting.notifyAdmin && " Admin"}
                                          {setting.notifyTrainer && " Formateur"}
                                          {setting.notifyClient && " Client"}
                                          {!setting.notifyAdmin && !setting.notifyTrainer && !setting.notifyClient && " Aucun"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingReminderId(setting.id);
                                        setEditingReminderData({
                                          name: setting.name,
                                          reminderType: setting.reminderType,
                                          daysBefore: setting.daysBefore,
                                          emailSubject: setting.emailSubject || "",
                                          notifyAdmin: setting.notifyAdmin,
                                          notifyTrainer: setting.notifyTrainer,
                                          notifyClient: setting.notifyClient,
                                        });
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteReminder(setting.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {reminderSettings.length === 0 && !isAddingReminder && (
                            <div className="text-center py-8 text-muted-foreground">
                              Aucun rappel configure. Cliquez sur "Ajouter un rappel" pour commencer.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* Task Templates & Consignes Tab */}
            {isAdmin && (
              <TabsContent value="modeles">
                <Card>
                  <CardHeader>
                    <CardTitle>Modeles de taches & Consignes</CardTitle>
                    <CardDescription>
                      Visualisez les taches predefinies par typologie et role formateur. Cliquez sur une tache pour voir ou modifier sa consigne.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <div className="space-y-2">
                        <Label>Typologie</Label>
                        <Select value={templateTypology} onValueChange={(v) => { setTemplateTypology(v); setExpandedTaskTitle(null); }}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intra">Intra</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Conseil">Conseil</SelectItem>
                            <SelectItem value="Conférence">Conference</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Role formateur</Label>
                        <Select value={templateTrainerRole} onValueChange={(v) => { setTemplateTrainerRole(v); setExpandedTaskTitle(null); }}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prestataire">Prestataire</SelectItem>
                            <SelectItem value="formateur">Salarie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {getTaskTemplates(templateTypology, templateTrainerRole).length} taches pour{" "}
                      <strong>{templateTypology}</strong> / <strong>{templateTrainerRole === "prestataire" ? "Prestataire" : "Salarie"}</strong>
                    </div>

                    {isLoadingExplanations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Tache</TableHead>
                              <TableHead className="w-32">Prioritaire</TableHead>
                              <TableHead className="w-32">Retard</TableHead>
                              <TableHead className="w-28">Assigne</TableHead>
                              <TableHead className="w-24">Consigne</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTaskTemplates(templateTypology, templateTrainerRole).map((task, index) => {
                              const isExpanded = expandedTaskTitle === task.title;
                              const dbEntry = taskExplanationsDb.find((d: any) => d.taskName === task.title);
                              const defaultEntry = TASK_EXPLANATIONS.find((d) => d.taskName === task.title);
                              const hasConsigne = !!dbEntry || !!defaultEntry;
                              const isEditing = isExpanded && editingExplanationId === dbEntry?.id;

                              return (
                                <React.Fragment key={index}>
                                  <TableRow
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setExpandedTaskTitle(isExpanded ? null : task.title)}
                                  >
                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>
                                      <Badge variant={task.priorityDaysBefore > 0 ? "default" : "destructive"} className="text-xs">
                                        {formatDeadlineLabel(task.priorityDaysBefore)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={task.lateDaysBefore > 0 ? "outline" : "destructive"} className="text-xs">
                                        {formatDeadlineLabel(task.lateDaysBefore)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={task.assigneeType === "admin" ? "secondary" : "default"} className="text-xs">
                                        {task.assigneeType === "admin" ? "Admin" : "Formateur"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {hasConsigne ? (
                                        <Badge variant={dbEntry ? "default" : "outline"} className="text-xs">
                                          {dbEntry ? "Perso." : "Defaut"}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow>
                                      <TableCell colSpan={6} className="bg-muted/30 p-0">
                                        <div className="p-4 space-y-3">
                                          {dbEntry ? (
                                            <>
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase text-muted-foreground">Consigne personnalisee</span>
                                                {editingExplanationId !== dbEntry.id && (
                                                  <div className="flex gap-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={(e) => { e.stopPropagation(); setEditingExplanationId(dbEntry.id); setEditingExplanationText(dbEntry.explanation); }}
                                                    >
                                                      <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-destructive hover:text-destructive"
                                                      onClick={(e) => { e.stopPropagation(); handleDeleteExplanation(dbEntry.id); }}
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                              {isEditing ? (
                                                <div className="space-y-2">
                                                  <Textarea
                                                    value={editingExplanationText}
                                                    onChange={(e) => setEditingExplanationText(e.target.value)}
                                                    rows={6}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingExplanationId(null); setEditingExplanationText(""); }}>
                                                      Annuler
                                                    </Button>
                                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateExplanation(dbEntry.id, editingExplanationText); }}>
                                                      Sauvegarder
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="text-sm text-muted-foreground whitespace-pre-line">{dbEntry.explanation}</p>
                                              )}
                                            </>
                                          ) : defaultEntry ? (
                                            <>
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase text-muted-foreground">Consigne par defaut</span>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={(e) => { e.stopPropagation(); handleCustomizeExplanation(task.title, defaultEntry.explanation); }}
                                                >
                                                  <Edit className="w-4 h-4 mr-1" />
                                                  Personnaliser
                                                </Button>
                                              </div>
                                              <p className="text-sm text-muted-foreground whitespace-pre-line">{defaultEntry.explanation}</p>
                                            </>
                                          ) : (
                                            <>
                                              <p className="text-sm text-muted-foreground italic">Aucune consigne pour cette tache.</p>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setNewExplanation({ taskName: task.title, explanation: "" }); setIsAddingExplanation(true); }}
                                              >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Ajouter une consigne
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Add new explanation form */}
                    {isAddingExplanation && (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <h3 className="text-sm font-semibold">Ajouter / Personnaliser une consigne</h3>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label>Nom de la tache</Label>
                            <Input
                              value={newExplanation.taskName}
                              onChange={(e) => setNewExplanation({ ...newExplanation, taskName: e.target.value })}
                              placeholder="Ex: Envoi compte-rendu entretien cadrage"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Consigne</Label>
                            <Textarea
                              value={newExplanation.explanation}
                              onChange={(e) => setNewExplanation({ ...newExplanation, explanation: e.target.value })}
                              placeholder="Texte de la consigne..."
                              rows={6}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => { setIsAddingExplanation(false); setNewExplanation({ taskName: "", explanation: "" }); }}>
                            Annuler
                          </Button>
                          <Button size="sm" onClick={handleAddExplanation} disabled={isSavingExplanation}>
                            {isSavingExplanation && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* Google Integration Tab */}
            {isAdmin && (
              <TabsContent value="google">
                <GoogleIntegrationTab />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Google Integration Tab Component
function GoogleIntegrationTab() {
  const { toast } = useToast();
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/google/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setGoogleStatus(data))
      .catch(() => setGoogleStatus({ connected: false }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/google/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setGoogleStatus({ connected: false });
        toast({ title: "Compte Google deconnecte" });
      }
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync-all", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Synchronisation terminee",
          description: `${data.synced} missions synchronisees, ${data.failed} echouees sur ${data.total} au total.`,
        });
      } else {
        toast({ title: "Erreur", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur de synchronisation", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Compte Google
          </CardTitle>
          <CardDescription>
            Connectez votre compte Google pour activer l'envoi d'emails via Gmail API et la synchronisation Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Compte connecte</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{googleStatus.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Deconnecter le compte Google
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Aucun compte connecte</p>
                  <p className="text-sm text-gray-500">Connectez votre compte Google pour activer les integrations.</p>
                </div>
              </div>
              <Button
                onClick={() => { window.location.href = "/api/auth/google"; }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Connecter avec Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Synchronisez vos missions avec Google Calendar. Les missions sont automatiquement ajoutees, mises a jour et supprimees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                La synchronisation automatique est active lorsqu'un compte Google est connecte. Les missions sont synchronisees lors de leur creation, modification et suppression.
              </p>
            </div>
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing || !googleStatus?.connected}
              variant="outline"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Synchroniser toutes les missions
                </>
              )}
            </Button>
            {!googleStatus?.connected && (
              <p className="text-sm text-muted-foreground">
                Connectez un compte Google pour activer la synchronisation calendrier.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
