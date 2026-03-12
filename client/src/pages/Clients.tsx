import { useState, useMemo, useEffect } from "react";
import { 
  useClients, 
  useMissions, 
  useInvoices, 
} from "@/hooks/use-missions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { 
  Plus, Search, Building2, Mail, Phone, MapPin, 
  ExternalLink, Briefcase, X, Check, Loader2, Trash2,
  Users, Euro, ClipboardCheck,
  Star, Calendar, UserCircle, Edit3, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Client, Mission, Invoice, User } from "@shared/schema";

// Helper functions
function getTypeBadge(type: string) {
  const styles: Record<string, { label: string; color: string }> = {
    "privé": { label: "Privé", color: "bg-blue-100 text-blue-700" },
    "public": { label: "Public", color: "bg-purple-100 text-purple-700" },
    "particulier": { label: "Particulier", color: "bg-green-100 text-green-700" },
  };
  const { label, color } = styles[type] || { label: type, color: "bg-gray-100 text-gray-700" };
  return <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${color}`}>{label}</span>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

interface ClientStats {
  completedMissions: number;
  upcomingMissions: number;
  totalRevenue: number;
  avgSatisfaction: number | null;
  missions: Mission[];
  invoices: Invoice[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
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
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Client Form Component
function ClientForm({
  client,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  isAdmin = false,
}: {
  client: any;
  onChange: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex flex-col max-h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom de l'entreprise *</Label>
          <Input
            value={client.name}
            onChange={(e) => onChange({ ...client, name: e.target.value })}
            placeholder="Nom du client"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={client.type}
            onValueChange={(v) => onChange({ ...client, type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent className="bg-violet-100 border-violet-300">
              <SelectItem value="particulier" className="focus:bg-violet-200">Particulier</SelectItem>
              <SelectItem value="privé" className="focus:bg-violet-200">Privé</SelectItem>
              <SelectItem value="public" className="focus:bg-violet-200">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact (Nom)</Label>
          <Input
            value={client.contactName}
            onChange={(e) => onChange({ ...client, contactName: e.target.value })}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="space-y-2">
          <Label>Contact (Email)</Label>
          <Input
            type="email"
            value={client.contactEmail}
            onChange={(e) => onChange({ ...client, contactEmail: e.target.value })}
            placeholder="jean@entreprise.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact (Téléphone)</Label>
          <Input
            value={client.contactPhone}
            onChange={(e) => onChange({ ...client, contactPhone: e.target.value })}
            placeholder="01 23 45 67 89"
          />
        </div>
        <div className="space-y-2">
          <Label>SIRET</Label>
          <Input
            value={client.siret}
            onChange={(e) => onChange({ ...client, siret: e.target.value })}
            placeholder="14 chiffres"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email entreprise</Label>
          <Input
            type="email"
            value={client.email}
            onChange={(e) => onChange({ ...client, email: e.target.value })}
            placeholder="contact@entreprise.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Téléphone entreprise</Label>
          <Input
            value={client.phone}
            onChange={(e) => onChange({ ...client, phone: e.target.value })}
            placeholder="01 23 45 67 89"
          />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adresse client</p>
        <div className="space-y-2">
          <Label>Adresse</Label>
          <Input
            value={client.address}
            onChange={(e) => onChange({ ...client, address: e.target.value })}
            placeholder="12 rue des Fleurs"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code Postal</Label>
            <Input
              value={client.postalCode}
              onChange={(e) => onChange({ ...client, postalCode: e.target.value })}
              placeholder="75001"
            />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input
              value={client.city}
              onChange={(e) => onChange({ ...client, city: e.target.value })}
              placeholder="Paris"
            />
          </div>
        </div>
      </div>


      <div className="border rounded-lg p-4 space-y-3 bg-amber-50/50">
        <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Lieu de facturation</p>
        <div className="space-y-2">
          <Label>Adresse</Label>
          <Input
            value={client.billingAddress}
            onChange={(e) => onChange({ ...client, billingAddress: e.target.value })}
            placeholder="Adresse de facturation"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code Postal</Label>
            <Input
              value={client.billingPostalCode}
              onChange={(e) => onChange({ ...client, billingPostalCode: e.target.value })}
              placeholder="75001"
            />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input
              value={client.billingCity}
              onChange={(e) => onChange({ ...client, billingCity: e.target.value })}
              placeholder="Paris"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Origine</Label>
        <Input
          value={client.origine}
          onChange={(e) => onChange({ ...client, origine: e.target.value })}
          placeholder="Ex: Bouche à oreille, Salon professionnel..."
        />
      </div>

      <div className="space-y-2">
        <Label>Réseaux sociaux</Label>
        <Input
          value={client.socialMedia}
          onChange={(e) => onChange({ ...client, socialMedia: e.target.value })}
          placeholder="Ex: LinkedIn, Instagram, site web..."
        />
      </div>

      {isAdmin && (
      <div className="space-y-2">
        <Label>Précisions</Label>
        <Input
          value={client.demand}
          onChange={(e) => onChange({ ...client, demand: e.target.value })}
          placeholder="Détails..."
        />
      </div>
      )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// Client Detail Dialog
function ClientDetailDialog({
  client,
  stats,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isAdmin = false,
}: {
  client: Client;
  stats: ClientStats;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isAdmin?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const buildEditState = (c: Client) => ({
    name: c.name,
    type: c.type,
    siret: c.siret || "",
    email: (c as any).email || "",
    phone: (c as any).phone || "",
    address: c.address || "",
    city: c.city || "",
    postalCode: c.postalCode || "",
    contactName: c.contactName || "",
    contactEmail: c.contactEmail || "",
    contactPhone: c.contactPhone || "",
    billingAddress: (c as any).billingAddress || "",
    billingPostalCode: (c as any).billingPostalCode || "",
    billingCity: (c as any).billingCity || "",
    trainingAddress: (c as any).trainingAddress || "",
    trainingPostalCode: (c as any).trainingPostalCode || "",
    trainingCity: (c as any).trainingCity || "",
    origine: (c as any).origine || "",
    socialMedia: (c as any).socialMedia || "",
    demand: c.demand || "",
  });

  const [editedClient, setEditedClient] = useState(buildEditState(client));

  useEffect(() => {
    setEditedClient(buildEditState(client));
    setIsEditing(false);
  }, [client]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedClient);
      setIsEditing(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div>
                <DialogTitle className="text-2xl">{client.name}</DialogTitle>
                <DialogDescription>ID: {client.id}</DialogDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Annuler</Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <ClientForm
            client={editedClient}
            onChange={setEditedClient}
            onSubmit={handleSave}
            onCancel={() => { setEditedClient(buildEditState(client)); setIsEditing(false); }}
            isSubmitting={isSaving}
            submitLabel="Enregistrer"
            isAdmin={isAdmin}
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Type</span>
                <div>{getTypeBadge(client.type || "")}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">SIRET</span>
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-muted-foreground" />
                  <span>{client.siret || "-"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Email entreprise</span>
                <div>{(client as any).email || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Téléphone entreprise</span>
                <div>{(client as any).phone || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Origine</span>
                <div>{client.origine || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Réseaux sociaux</span>
                <div>{client.socialMedia || "-"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Coordonnées
              </h3>
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/30 rounded-xl border text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <div className="font-medium">Contact: {client.contactName || "-"}</div>
                    <div className="text-primary underline">{client.contactEmail || "-"}</div>
                    <div className="text-muted-foreground">{client.contactPhone || "-"}</div>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Adresse client</div>
                      <div>{client.address || "-"}</div>
                      <div className="text-muted-foreground">{client.postalCode} {client.city}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                    <MapPin className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Lieu de facturation</div>
                      <div>{(client as any).billingAddress || "-"}</div>
                      <div className="text-muted-foreground">{(client as any).billingPostalCode} {(client as any).billingCity}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && client.demand && (
              <div className="p-4 bg-muted/30 rounded-xl border">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Précisions</span>
                <div className="mt-1">{client.demand}</div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" /> Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.completedMissions}</div>
                  <div className="text-xs text-blue-600">Missions réalisées</div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-700">{stats.upcomingMissions}</div>
                  <div className="text-xs text-orange-600">Missions à venir</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5" /> Missions ({stats.missions.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {stats.missions.map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-medium truncate">{mission.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {mission.startDate && format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                    <a href={`/missions/${mission.id}`} className="text-primary hover:underline"><ExternalLink className="w-4 h-4" /></a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        )}
        <DialogFooter className="mt-6 flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
                onDelete(client.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: missions } = useMissions();
  const { data: invoices } = useInvoices();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [newClient, setNewClient] = useState({
    name: "",
    type: "" as any,
    siret: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    billingAddress: "",
    billingPostalCode: "",
    billingCity: "",
    trainingAddress: "",
    trainingPostalCode: "",
    trainingCity: "",
    origine: "",
    socialMedia: "",
    demand: "",
  });

  const clientStatsMap = useMemo(() => {
    const statsMap = new Map<number, ClientStats>();
    if (!clients) return statsMap;

    clients.forEach((client: Client) => {
      const clientMissions = missions?.filter((m: Mission) => m.clientId === client.id) || [];
      const clientInvoices = invoices?.filter((inv: Invoice) => {
        const mission = missions?.find((m: Mission) => m.id === inv.missionId);
        return mission?.clientId === client.id;
      }) || [];

      const completedMissions = clientMissions.filter(m => m.status === "completed").length;
      const upcomingMissions = clientMissions.filter(m => m.status !== "completed" && m.status !== "cancelled").length;
      const totalRevenue = clientInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount || 0), 0);

      statsMap.set(client.id, {
        completedMissions,
        upcomingMissions,
        totalRevenue,
        avgSatisfaction: null,
        missions: clientMissions,
        invoices: clientInvoices,
      });
    });
    return statsMap;
  }, [clients, missions, invoices]);

  const kpis = useMemo(() => {
    if (!clients) return { totalClients: 0, prive: 0, publique: 0, particulier: 0, totalRevenue: 0 };
    return {
      totalClients: clients.length,
      prive: clients.filter(c => c.type === "privé").length,
      publique: clients.filter(c => c.type === "public").length,
      particulier: clients.filter(c => c.type === "particulier").length,
      totalRevenue: Array.from(clientStatsMap.values()).reduce((sum, s) => sum + s.totalRevenue, 0),
    };
  }, [clients, clientStatsMap]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, typeFilter]);

  const handleCreateClient = async () => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) throw new Error();
      setIsCreateOpen(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Client créé", description: "Le client a été ajouté avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer le client.", variant: "destructive" });
    }
  };

  const handleUpdateClient = async (data: any) => {
    if (!selectedClient) return;
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Client mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSelectedClient(null);
      await queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Client supprimé", description: "Le client a été supprimé avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le client.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewClient({
      name: "",
      type: "",
      siret: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      billingAddress: "",
      billingPostalCode: "",
      billingCity: "",
      trainingAddress: "",
      trainingPostalCode: "",
      trainingCity: "",
      origine: "",
      socialMedia: "",
      demand: "",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Clients" />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total clients" value={kpis.totalClients} icon={Users} color="bg-blue-100 text-blue-600" />
            <StatCard title="Privé" value={kpis.prive} icon={Building2} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Public" value={kpis.publique} icon={Building2} color="bg-purple-100 text-purple-600" />
            <StatCard title="Particulier" value={kpis.particulier} icon={UserCircle} color="bg-green-100 text-green-600" />
            <StatCard title="CA Total" value={formatCurrency(kpis.totalRevenue)} icon={Euro} color="bg-amber-100 text-amber-600" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Tous les types</SelectItem>
                  <SelectItem value="particulier" className="focus:bg-violet-200">Particulier</SelectItem>
                  <SelectItem value="privé" className="focus:bg-violet-200">Privé</SelectItem>
                  <SelectItem value="public" className="focus:bg-violet-200">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouveau client</Button></DialogTrigger>
              <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Ajouter un client</DialogTitle></DialogHeader>
                <ClientForm client={newClient} onChange={setNewClient} onSubmit={handleCreateClient} onCancel={() => setIsCreateOpen(false)} isSubmitting={false} submitLabel="Ajouter" isAdmin={isAdmin} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover-elevate cursor-pointer overflow-visible" onClick={() => setSelectedClient(client)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate flex-1 mr-2">{client.name}</h3>
                    {getTypeBadge(client.type)}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.contactEmail || "-"}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {client.city || "-"}</div>
                    <div className="pt-2 border-t mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>Missions: {clientStatsMap.get(client.id)?.completedMissions || 0}</div>
                      <div>CA: {formatCurrency(clientStatsMap.get(client.id)?.totalRevenue || 0)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        {selectedClient && (
          <ClientDetailDialog
            client={selectedClient}
            stats={clientStatsMap.get(selectedClient.id)!}
            isOpen={true}
            onClose={() => setSelectedClient(null)}
            onSave={handleUpdateClient}
            onDelete={handleDeleteClient}
            isAdmin={isAdmin}
          />
        )}
      </main>
    </div>
  );
}
