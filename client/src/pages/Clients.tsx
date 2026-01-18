import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Building2,
  Search,
  Mail,
  Phone,
  MapPin,
  Handshake,
  TrendingUp,
  Euro,
  Briefcase,
  Star,
  Calendar,
  Edit,
  ArrowRightLeft,
  Loader2,
  X,
  FileText,
  Receipt,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";
import { useClients, useCreateClient, useMissions, useInvoices, useUsers } from "@/hooks/use-missions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Client, Mission, Invoice, ClientContractStatus, User } from "@shared/schema";
import { UserCircle } from "lucide-react";

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
  icon: React.ElementType;
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

function ClientMiniRecap({ stats }: { stats: ClientStats }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5 text-xs">
        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-muted-foreground">Realisees:</span>
        <span className="font-medium">{stats.completedMissions}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-muted-foreground">A venir:</span>
        <span className="font-medium">{stats.upcomingMissions}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Euro className="w-3.5 h-3.5 text-green-500" />
        <span className="text-muted-foreground">CA:</span>
        <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Star className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-muted-foreground">Satisfaction:</span>
        <span className="font-medium">
          {stats.avgSatisfaction !== null ? `${stats.avgSatisfaction.toFixed(1)}/5` : "-"}
        </span>
      </div>
    </div>
  );
}

// Client Detail Dialog Component
function ClientDetailDialog({
  client,
  stats,
  isOpen,
  onClose,
  onToggleStatus,
  onEdit,
  isToggling,
}: {
  client: Client;
  stats: ClientStats;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  isToggling: boolean;
}) {
  const status = client.contractStatus || "negotiation";
  const isAcquired = status === "acquired";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{client.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {getTypeBadge(client.type)}
                <button
                  onClick={onToggleStatus}
                  disabled={isToggling}
                  className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium border transition-all cursor-pointer hover:scale-105 disabled:opacity-50 ${
                    isAcquired
                      ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                      : "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                  {isAcquired ? "Acquis" : "En negociation"}
                </button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informations
            </h3>

            {client.contractAmount && client.contractAmount > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    Montant du contrat: {formatCurrency(client.contractAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              {client.siret && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">SIRET:</span>
                  <span className="font-medium">{client.siret}</span>
                </div>
              )}
              {client.contactName && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">Contact:</span>
                  <span className="font-medium">{client.contactName}</span>
                </div>
              )}
              {client.contactEmail && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">Email:</span>
                  <a href={`mailto:${client.contactEmail}`} className="text-primary hover:underline flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {client.contactEmail}
                  </a>
                </div>
              )}
              {client.contactPhone && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">Telephone:</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {client.contactPhone}
                  </span>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">Adresse:</span>
                  <span className="flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>
                      {client.address && <>{client.address}<br /></>}
                      {client.postalCode} {client.city}
                    </span>
                  </span>
                </div>
              )}
              {client.demand && (
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24">Demande:</span>
                  <span>{client.demand}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Statistiques
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.completedMissions}</div>
                <div className="text-xs text-blue-600">Missions realisees</div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-700">{stats.upcomingMissions}</div>
                <div className="text-xs text-orange-600">Missions a venir</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-xs text-green-600">CA cumule</div>
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

        {/* Missions */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5" />
            Missions ({stats.missions.length})
          </h3>
          {stats.missions.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.missions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <div className="font-medium">{mission.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {mission.reference} - {mission.startDate && format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      mission.status === "completed" ? "bg-green-100 text-green-700" :
                      mission.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      mission.status === "confirmed" ? "bg-violet-100 text-violet-700" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {mission.status === "completed" ? "Terminee" :
                       mission.status === "in_progress" ? "En cours" :
                       mission.status === "confirmed" ? "Confirmee" :
                       mission.status === "cancelled" ? "Annulee" : "Brouillon"}
                    </Badge>
                    <a href={`/missions/${mission.id}`} className="text-primary hover:underline">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune mission pour ce client</p>
          )}
        </div>

        {/* Invoices / Documents */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <Receipt className="w-5 h-5" />
            Factures ({stats.invoices.length})
          </h3>
          {stats.invoices.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{invoice.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.invoiceDate && format(new Date(invoice.invoiceDate), "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                    <Badge variant="outline" className={
                      invoice.status === "paid" ? "bg-green-100 text-green-700" :
                      invoice.status === "submitted" ? "bg-blue-100 text-blue-700" :
                      invoice.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {invoice.status === "paid" ? "Payee" :
                       invoice.status === "submitted" ? "Soumise" :
                       invoice.status === "rejected" ? "Rejetee" : "Brouillon"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune facture pour ce client</p>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const { data: clients, isLoading: clientsLoading, refetch } = useClients();
  const { data: missions } = useMissions();
  const { data: invoices } = useInvoices();
  const { data: users } = useUsers();
  const createClient = useCreateClient();
  const { toast } = useToast();

  // Filter trainers from users (role = formateur or prestataire)
  const trainers = useMemo(() => {
    if (!users) {
      console.log('[DEBUG] No users loaded yet');
      return [];
    }
    const filtered = users.filter((u: User) => u.role === "formateur" || u.role === "prestataire");
    console.log('[DEBUG] Trainers loaded:', filtered.length, filtered.map((t: User) => ({ id: t.id, name: t.firstName })));
    return filtered;
  }, [users]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [togglingClientId, setTogglingClientId] = useState<number | null>(null);

  const [newClient, setNewClient] = useState({
    name: "",
    type: "entreprise" as "entreprise" | "opco" | "particulier" | "institution",
    contractStatus: "negotiation" as ClientContractStatus,
    contractAmount: 0,
    assignedTrainerId: "" as string,
    siret: "",
    address: "",
    city: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    demand: "",
  });

  // Check if any filter is active
  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || contractFilter !== "all" || trainerFilter !== "all";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setContractFilter("all");
    setTrainerFilter("all");
  };

  // Helper to get trainer name
  const getTrainerName = (trainerId: string | null | undefined) => {
    if (!trainerId || !users) return null;
    const trainer = users.find((u: User) => u.id === trainerId);
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : null;
  };

  // Calculate client statistics
  const clientStatsMap = useMemo(() => {
    const statsMap = new Map<number, ClientStats>();
    if (!clients) return statsMap;

    const now = new Date();

    clients.forEach((client: Client) => {
      const clientMissions = missions?.filter((m: Mission) => m.clientId === client.id) || [];
      const clientInvoices = invoices?.filter((inv: Invoice) => {
        const mission = missions?.find((m: Mission) => m.id === inv.missionId);
        return mission?.clientId === client.id;
      }) || [];

      const completedMissions = clientMissions.filter(
        (m: Mission) => m.status === "completed"
      ).length;

      const upcomingMissions = clientMissions.filter((m: Mission) => {
        if (!m.startDate) return false;
        return (
          new Date(m.startDate) > now &&
          (m.status === "confirmed" || m.status === "in_progress")
        );
      }).length;

      const paidInvoices = clientInvoices.filter((inv: Invoice) => inv.status === "paid");
      const totalRevenue = paidInvoices.reduce(
        (sum: number, inv: Invoice) => sum + (inv.amount || 0),
        0
      );

      const avgSatisfaction = null;

      statsMap.set(client.id, {
        completedMissions,
        upcomingMissions,
        totalRevenue,
        avgSatisfaction,
        missions: clientMissions,
        invoices: clientInvoices,
      });
    });

    return statsMap;
  }, [clients, missions, invoices]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (!clients || clients.length === 0) {
      return { prospects: 0, acquiredClients: 0, totalAcquiredRevenue: 0 };
    }

    const prospects = clients.filter((c: Client) => {
      const status = c.contractStatus || "negotiation";
      return status === "negotiation";
    }).length;

    const acquiredClients = clients.filter((c: Client) => {
      const status = c.contractStatus || "negotiation";
      return status === "acquired";
    }).length;

    const totalAcquiredRevenue = clients
      .filter((c: Client) => (c.contractStatus || "negotiation") === "acquired")
      .reduce((sum: number, c: Client) => {
        const contractAmount = c.contractAmount || 0;
        const invoiceRevenue = clientStatsMap.get(c.id)?.totalRevenue || 0;
        return sum + contractAmount + invoiceRevenue;
      }, 0);

    return { prospects, acquiredClients, totalAcquiredRevenue };
  }, [clients, clientStatsMap]);

  const filteredClients = clients?.filter((client: Client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.demand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    const clientContractStatus = client.contractStatus || "negotiation";
    const matchesContract =
      contractFilter === "all" || clientContractStatus === contractFilter;
    const matchesTrainer =
      trainerFilter === "all" || client.assignedTrainerId === trainerFilter;
    return matchesSearch && matchesType && matchesContract && matchesTrainer;
  }) || [];

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.type) return;

    try {
      await createClient.mutateAsync({
        ...newClient,
        contractAmount: newClient.contractAmount * 100,
        assignedTrainerId: newClient.assignedTrainerId || null,
      });
      setIsCreateOpen(false);
      resetForm();
      // Force refresh - reset queries to bypass staleTime: Infinity
      await queryClient.resetQueries({ queryKey: [api.clients.list.path] });
      toast({
        title: "Client cree",
        description: "Le client a ete ajoute avec succes.",
      });
    } catch (error) {
      console.error("Failed to create client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de creer le client.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClient = async () => {
    console.log('[UPDATE] handleUpdateClient called');
    console.log('[UPDATE] editingClient:', editingClient);
    console.log('[UPDATE] newClient at function start:', newClient);

    if (!editingClient) return;

    const dataToSend = {
      name: newClient.name,
      type: newClient.type,
      contractStatus: newClient.contractStatus,
      contractAmount: newClient.contractAmount * 100,
      assignedTrainerId: newClient.assignedTrainerId || null,
      siret: newClient.siret || null,
      address: newClient.address || null,
      city: newClient.city || null,
      postalCode: newClient.postalCode || null,
      contactName: newClient.contactName || null,
      contactEmail: newClient.contactEmail || null,
      contactPhone: newClient.contactPhone || null,
      demand: newClient.demand || null,
    };

    console.log('[UPDATE] Form state:', newClient);
    console.log('[UPDATE] Sending data:', dataToSend);

    // Temporary debug alert - remove after fixing
    alert(`Envoi de la mise à jour:\nassignedTrainerId = ${dataToSend.assignedTrainerId}\nClient ID = ${editingClient.id}`);

    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();
      console.log('[UPDATE] Server response:', responseData);

      // Temporary debug alert - remove after fixing
      alert(`Réponse du serveur:\nassignedTrainerId = ${responseData.assignedTrainerId}\nID = ${responseData.id}`);

      if (!response.ok) {
        throw new Error(responseData.message || "Erreur lors de la mise à jour");
      }

      // Close dialog
      setEditingClient(null);
      resetForm();

      // Force page reload to ensure fresh data
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to update client:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre a jour le client.",
        variant: "destructive",
      });
    }
  };

  // Quick toggle contract status
  const handleToggleContractStatus = async (client: Client, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const currentStatus = client.contractStatus || "negotiation";
    const newStatus: ClientContractStatus =
      currentStatus === "acquired" ? "negotiation" : "acquired";

    setTogglingClientId(client.id);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: client.name,
          type: client.type,
          contractStatus: newStatus,
          contractAmount: client.contractAmount || 0,
          assignedTrainerId: client.assignedTrainerId || "",
          siret: client.siret || "",
          address: client.address || "",
          city: client.city || "",
          postalCode: client.postalCode || "",
          contactName: client.contactName || "",
          contactEmail: client.contactEmail || "",
          contactPhone: client.contactPhone || "",
          demand: client.demand || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      // Get the updated client from the response
      const updatedClient = await response.json();

      // Update selected client if it's the one being toggled
      if (selectedClient?.id === client.id) {
        setSelectedClient(updatedClient);
      }

      // Force refresh - reset queries to bypass staleTime: Infinity
      await queryClient.resetQueries({ queryKey: [api.clients.list.path] });

      toast({
        title: newStatus === "acquired" ? "Client acquis !" : "Client en negociation",
        description:
          newStatus === "acquired"
            ? `${client.name} est maintenant un client acquis.`
            : `${client.name} est de nouveau en negociation.`,
      });
    } catch (error: any) {
      console.error("Failed to toggle contract status:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le statut.",
        variant: "destructive",
      });
    } finally {
      setTogglingClientId(null);
    }
  };

  const openEditDialog = (client: Client) => {
    setNewClient({
      name: client.name,
      type: client.type as any,
      contractStatus: (client.contractStatus as ClientContractStatus) || "negotiation",
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
    setSelectedClient(null);
    setEditingClient(client);
  };

  const resetForm = () => {
    setNewClient({
      name: "",
      type: "entreprise",
      contractStatus: "negotiation",
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

  const isLoading = clientsLoading;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Clients" />

        <div className="flex-1 p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Prospects"
              value={kpis.prospects}
              icon={TrendingUp}
              color="bg-amber-100 text-amber-600"
              subtitle="En negociation"
            />
            <StatCard
              title="Clients acquis"
              value={kpis.acquiredClients}
              icon={Handshake}
              color="bg-green-100 text-green-600"
              subtitle="Contrats signes"
            />
            <StatCard
              title="CA total acquis"
              value={formatCurrency(kpis.totalAcquiredRevenue)}
              icon={Euro}
              color="bg-blue-100 text-blue-600"
              subtitle="Contrats + factures payees"
            />
          </div>

          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="entreprise">Entreprise</SelectItem>
                  <SelectItem value="opco">OPCO</SelectItem>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Statut contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="negotiation">En negociation</SelectItem>
                  <SelectItem value="acquired">Acquis</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Formateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les formateurs</SelectItem>
                  {trainers.map((trainer: User) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Clear all filters button - always visible */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className={hasActiveFilters ? "border-red-300 text-red-600 hover:bg-red-50" : ""}
              >
                <X className="w-4 h-4 mr-1" />
                Effacer filtres
              </Button>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un client</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau client.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  client={newClient}
                  onChange={setNewClient}
                  onSubmit={handleCreateClient}
                  onCancel={() => setIsCreateOpen(false)}
                  isSubmitting={createClient.isPending}
                  submitLabel="Ajouter le client"
                  trainers={trainers}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Dialog */}
          <Dialog open={editingClient !== null} onOpenChange={(open) => !open && setEditingClient(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le client</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du client.
                </DialogDescription>
              </DialogHeader>
              <ClientForm
                client={newClient}
                onChange={setNewClient}
                onSubmit={handleUpdateClient}
                onCancel={() => setEditingClient(null)}
                isSubmitting={false}
                submitLabel="Enregistrer"
                trainers={trainers}
              />
            </DialogContent>
          </Dialog>

          {/* Client Detail Dialog */}
          {selectedClient && (
            <ClientDetailDialog
              client={selectedClient}
              stats={clientStatsMap.get(selectedClient.id) || {
                completedMissions: 0,
                upcomingMissions: 0,
                totalRevenue: 0,
                avgSatisfaction: null,
                missions: [],
                invoices: [],
              }}
              isOpen={selectedClient !== null}
              onClose={() => setSelectedClient(null)}
              onToggleStatus={() => handleToggleContractStatus(selectedClient)}
              onEdit={() => openEditDialog(selectedClient)}
              isToggling={togglingClientId === selectedClient.id}
            />
          )}

          {/* Clients grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun client</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Aucun client ne correspond aux filtres."
                  : "Commencez par ajouter un nouveau client."}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client: Client) => {
                const stats = clientStatsMap.get(client.id) || {
                  completedMissions: 0,
                  upcomingMissions: 0,
                  totalRevenue: 0,
                  avgSatisfaction: null,
                  missions: [],
                  invoices: [],
                };
                const status = client.contractStatus || "negotiation";
                const isAcquired = status === "acquired";

                return (
                  <Card
                    key={client.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getTypeBadge(client.type)}
                            <button
                              onClick={(e) => handleToggleContractStatus(client, e)}
                              disabled={togglingClientId === client.id}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border transition-all cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isAcquired
                                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                              }`}
                              title={
                                isAcquired
                                  ? "Cliquez pour repasser en negociation"
                                  : "Cliquez pour marquer comme acquis"
                              }
                            >
                              {togglingClientId === client.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="w-3 h-3" />
                              )}
                              {isAcquired ? "Acquis" : "En negociation"}
                            </button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(client);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Assigned trainer - prominent display */}
                      {client.assignedTrainerId && getTrainerName(client.assignedTrainerId) && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-violet-50 border border-violet-200 rounded-lg">
                          <UserCircle className="w-4 h-4 text-violet-600" />
                          <span className="text-sm font-medium text-violet-700">
                            {getTrainerName(client.assignedTrainerId)}
                          </span>
                        </div>
                      )}

                      {client.contractAmount && client.contractAmount > 0 && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                          <Euro className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Contrat: {formatCurrency(client.contractAmount)}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {client.contactName && (
                          <p className="text-sm font-medium">{client.contactName}</p>
                        )}
                        {client.contactEmail && (
                          <p className="text-xs flex items-center gap-1 text-primary">
                            <Mail className="w-3 h-3" />
                            {client.contactEmail}
                          </p>
                        )}
                        {client.contactPhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.contactPhone}
                          </p>
                        )}
                        {client.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {client.city}
                            {client.postalCode && ` (${client.postalCode})`}
                          </p>
                        )}
                      </div>

                      <ClientMiniRecap stats={stats} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
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
  client: {
    name: string;
    type: string;
    contractStatus: ClientContractStatus;
    contractAmount: number;
    assignedTrainerId: string;
    siret: string;
    address: string;
    city: string;
    postalCode: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    demand: string;
  };
  onChange: (client: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  trainers: User[];
}) {
  console.log('[ClientForm] Rendering with:', {
    assignedTrainerId: client.assignedTrainerId,
    trainersCount: trainers.length
  });

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              placeholder="TechCorp SAS"
              value={client.name}
              onChange={(e) => onChange({ ...client, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={client.type}
              onValueChange={(value) => onChange({ ...client, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="contractStatus">Statut du contrat</Label>
            <Select
              value={client.contractStatus}
              onValueChange={(value) =>
                onChange({ ...client, contractStatus: value as ClientContractStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negotiation">En negociation</SelectItem>
                <SelectItem value="acquired">Acquis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractAmount">Montant du contrat (EUR)</Label>
            <Input
              id="contractAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={client.contractAmount || ""}
              onChange={(e) =>
                onChange({
                  ...client,
                  contractAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTrainer">
            Formateur assigne ({trainers.length} disponibles)
          </Label>
          {trainers.length === 0 ? (
            <p className="text-sm text-red-500">Aucun formateur disponible</p>
          ) : (
            <Select
              value={client.assignedTrainerId || "none"}
              onValueChange={(value) => {
                console.log('[FORM] Trainer selected:', value);
                const newValue = value === "none" ? "" : value;
                console.log('[FORM] Setting assignedTrainerId to:', newValue);
                onChange({ ...client, assignedTrainerId: newValue });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un formateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun formateur</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-blue-600 font-mono bg-blue-50 p-1 rounded">
            DEBUG: assignedTrainerId = "{client.assignedTrainerId || ""}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              placeholder="12345678901234"
              value={client.siret}
              onChange={(e) => onChange({ ...client, siret: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact</Label>
            <Input
              id="contactName"
              placeholder="Sophie Leroy"
              value={client.contactName}
              onChange={(e) => onChange({ ...client, contactName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contact@example.fr"
              value={client.contactEmail}
              onChange={(e) => onChange({ ...client, contactEmail: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telephone</Label>
            <Input
              id="contactPhone"
              placeholder="01 23 45 67 89"
              value={client.contactPhone}
              onChange={(e) => onChange({ ...client, contactPhone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            placeholder="15 rue de la Formation"
            value={client.address}
            onChange={(e) => onChange({ ...client, address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              placeholder="75001"
              value={client.postalCode}
              onChange={(e) => onChange({ ...client, postalCode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              placeholder="Paris"
              value={client.city}
              onChange={(e) => onChange({ ...client, city: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demand">Demande</Label>
          <Input
            id="demand"
            placeholder="Details de la demande..."
            value={client.demand}
            onChange={(e) => onChange({ ...client, demand: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "En cours..." : submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
