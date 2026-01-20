import { useState } from "react";
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
  Palette,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Euro,
  Globe,
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Parametres" />

        <div className="flex-1 p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
                      placeholder="••••••••"
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
                      placeholder="••••••••"
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
                      placeholder="••••••••"
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
          </Tabs>
        </div>
      </main>
    </div>
  );
}
