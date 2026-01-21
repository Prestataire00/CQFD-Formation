import { useState, useMemo, useEffect } from "react";
import { 
  useClients, 
  useMissions, 
  useInvoices, 
  useUsers 
} from "@/hooks/use-missions";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { 
  Plus, Search, Building2, Mail, Phone, MapPin, 
  ExternalLink, Briefcase, Receipt, X, Check, Loader2,
  Users, Euro, UserPlus, Handshake, XCircle, ClipboardCheck,
  Star, Calendar, UserCircle, Edit3, Fingerprint, UserCheck
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
import type { Client, Mission, Invoice, User, ClientContractStatus } from "@shared/schema";

// Helper functions
function getTypeBadge(type: string) {
  const styles: Record<string, { label: string; color: string }> = {
    entreprise: { label: "Entreprise", color: "bg-blue-100 text-blue-700" },
    opco: { label: "OPCO", color: "bg-purple-100 text-purple-700" },
    particulier: { label: "Particulier", color: "bg-green-100 text-green-700" },
    institution: { label: "Institution", color: "bg-orange-100 text-orange-700" },
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
  trainers,
}: {
  client: any;
  onChange: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  trainers: User[];
}) {
  return (
    <div className="space-y-4 pt-4">
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
          <Label>Type *</Label>
          <Select 
            value={client.type} 
            onValueChange={(v) => onChange({ ...client, type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entreprise">Entreprise</SelectItem>
              <SelectItem value="opco">OPCO</SelectItem>
              <SelectItem value="particulier">Particulier</SelectItem>
              <SelectItem value="institution">Institution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Statut du contrat</Label>
          <Select 
            value={client.contractStatus} 
            onValueChange={(v) => onChange({ ...client, contractStatus: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="negotiation">En négociation</SelectItem>
              <SelectItem value="lost">Perdu</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Montant du contrat (€)</Label>
          <Input 
            type="number" 
            value={client.contractAmount} 
            onChange={(e) => onChange({ ...client, contractAmount: parseFloat(e.target.value) || 0 })} 
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Formateur assigné</Label>
        <Select 
          value={client.assignedTrainerId || "none"} 
          onValueChange={(v) => onChange({ ...client, assignedTrainerId: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un formateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {trainers.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <Label>Demande spécifique</Label>
        <Input 
          value={client.demand} 
          onChange={(e) => onChange({ ...client, demand: e.target.value })} 
          placeholder="Détails de la demande..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
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
  trainers,
  onSave,
}: {
  client: Client;
  stats: ClientStats;
  isOpen: boolean;
  onClose: () => void;
  trainers: User[];
  onSave: (data: any) => Promise<void>;
}) {
  const { data: users } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedClient, setEditedClient] = useState({
    name: client.name,
    type: client.type,
    contractStatus: client.contractStatus || "prospect",
    contractAmount: (client.contractAmount || 0) / 100,
    assignedTrainerId: client.assignedTrainerId || "",
    siret: client.siret || "",
    address: client.address || "",
    city: client.city || "",
    postalCode: client.postalCode || "",
    contactName: client.contactName || "",
    contactEmail: client.contactEmail || "",
    contactPhone: client.contactPhone || "",
    demand: client.demand || "",
  });

  useEffect(() => {
    setEditedClient({
      name: client.name,
      type: client.type,
      contractStatus: client.contractStatus || "prospect",
      contractAmount: (client.contractAmount || 0) / 100,
      assignedTrainerId: client.assignedTrainerId || "",
      siret: client.siret || "",
      address: client.address || "",
      city: client.city || "",
      postalCode: client.postalCode || "",
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || "",
      contactPhone: client.contactPhone || "",
      demand: client.demand || "",
    });
    setIsEditing(false);
  }, [client]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...editedClient,
        contractAmount: Math.round(editedClient.contractAmount * 100),
        assignedTrainerId: editedClient.assignedTrainerId || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTrainerName = (trainerId: string | null | undefined) => {
    if (!trainerId || !users) return "Non assigné";
    const trainer = users.find((u: User) => u.id === trainerId);
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : "Non assigné";
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border">
              {isEditing ? (
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">NOM</Label>
                    <Input value={editedClient.name} onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">TYPE</Label>
                    <Select value={editedClient.type} onValueChange={(v) => setEditedClient({ ...editedClient, type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entreprise">Entreprise</SelectItem>
                        <SelectItem value="opco">OPCO</SelectItem>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="institution">Institution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Type</span>
                    <div>{getTypeBadge(client.type)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Statut</span>
                    <Badge variant="outline" className={
                      client.contractStatus === "client" ? "bg-green-100 text-green-700" :
                      client.contractStatus === "negotiation" ? "bg-amber-100 text-amber-700" :
                      client.contractStatus === "lost" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }>
                      {client.contractStatus === "client" ? "Client" :
                       client.contractStatus === "negotiation" ? "En négociation" :
                       client.contractStatus === "lost" ? "Perdu" : "Prospect"}
                    </Badge>
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">SIRET</span>
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-muted-foreground" />
                  <span>{client.siret || "-"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Formateur assigné</span>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <span>{getTrainerName(client.assignedTrainerId)}</span>
                </div>
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
                <div className="flex items-start gap-3 border-t pt-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    {client.address || "-"}
                    <br />
                    {client.postalCode} {client.city}
                  </div>
                </div>
              </div>
            </div>

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
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-xs text-green-600">CA cumulé</div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.avgSatisfaction !== null ? `${stats.avgSatisfaction.toFixed(1)}/5` : "-"}
                  </div>
                  <div className="text-xs text-yellow-600">Satisfaction</div>
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

            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Receipt className="w-5 h-5" /> Factures ({stats.invoices.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {stats.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-medium truncate">{invoice.invoiceNumber}</div>
                      <div className="text-[10px] font-semibold">{formatCurrency(invoice.amount)}</div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${invoice.status === "paid" ? "bg-green-100 text-green-700" : ""}`}>
                      {invoice.status === "paid" ? "Payée" : "En cours"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
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
  const { data: users } = useUsers();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [newClient, setNewClient] = useState({
    name: "",
    type: "entreprise" as any,
    contractStatus: "prospect" as ClientContractStatus,
    contractAmount: 0,
    assignedTrainerId: "",
    siret: "",
    address: "",
    city: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    demand: "",
  });

  const trainers = useMemo(() => {
    if (!users) return [];
    return users.filter((u: User) => u.role === "formateur" || u.role === "prestataire");
  }, [users]);

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
    if (!clients) return { prospects: 0, negotiation: 0, lost: 0, activeClients: 0, totalRevenue: 0 };
    return {
      prospects: clients.filter(c => (c.contractStatus || "prospect") === "prospect").length,
      negotiation: clients.filter(c => c.contractStatus === "negotiation").length,
      lost: clients.filter(c => c.contractStatus === "lost").length,
      activeClients: clients.filter(c => c.contractStatus === "client").length,
      totalRevenue: Array.from(clientStatsMap.values()).reduce((sum, s) => sum + s.totalRevenue, 0),
    };
  }, [clients, clientStatsMap]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const matchesContract = contractFilter === "all" || (c.contractStatus || "prospect") === contractFilter;
      const matchesTrainer = trainerFilter === "all" || c.assignedTrainerId === trainerFilter;
      return matchesSearch && matchesType && matchesContract && matchesTrainer;
    });
  }, [clients, searchTerm, typeFilter, contractFilter, trainerFilter]);

  const handleCreateClient = async () => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClient,
          contractAmount: Math.round(newClient.contractAmount * 100),
          assignedTrainerId: newClient.assignedTrainerId || null,
        }),
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

  const resetForm = () => {
    setNewClient({
      name: "",
      type: "entreprise",
      contractStatus: "prospect",
      contractAmount: 0,
      assignedTrainerId: "",
      siret: "",
      address: "",
      city: "",
      postalCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
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
            <StatCard title="Prospects" value={kpis.prospects} icon={UserPlus} color="bg-blue-100 text-blue-600" />
            <StatCard title="Négociation" value={kpis.negotiation} icon={Handshake} color="bg-amber-100 text-amber-600" />
            <StatCard title="Perdus" value={kpis.lost} icon={XCircle} color="bg-red-100 text-red-600" />
            <StatCard title="Clients" value={kpis.activeClients} icon={Users} color="bg-green-100 text-green-600" />
            <StatCard title="CA Total" value={formatCurrency(kpis.totalRevenue)} icon={Euro} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="entreprise">Entreprise</SelectItem>
                  <SelectItem value="opco">OPCO</SelectItem>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Contrat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="negotiation">Négociation</SelectItem>
                  <SelectItem value="lost">Perdu</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouveau client</Button></DialogTrigger>
              <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Ajouter un client</DialogTitle></DialogHeader>
                <ClientForm client={newClient} onChange={setNewClient} onSubmit={handleCreateClient} onCancel={() => setIsCreateOpen(false)} isSubmitting={false} submitLabel="Ajouter" trainers={trainers} />
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
            trainers={trainers}
            onSave={handleUpdateClient}
          />
        )}
      </main>
    </div>
  );
}
