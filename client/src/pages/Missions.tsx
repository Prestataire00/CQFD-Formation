import { useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  Eye,
  Search,
  Filter,
  Trash2,
  ArrowUpDown,
  BookOpen,
  Tag,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { useMissions, useClients, useTrainers, usePrograms, useCreateMission, useUpdateMissionStatus } from "@/hooks/use-missions";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionStatus, LocationType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getStatusBadge(status: MissionStatus) {
  const styles: Record<MissionStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600 border border-slate-300" },
    confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-700 border border-blue-300" },
    in_progress: { label: "En cours", className: "bg-orange-100 text-orange-700 border border-orange-300" },
    completed: { label: "Terminée", className: "bg-green-100 text-green-700 border border-green-300" },
    cancelled: { label: "Annulée", className: "bg-red-100 text-red-700 border border-red-300" },
  };
  const { label, className } = styles[status] || styles.draft;
  return <Badge className={className}>{label}</Badge>;
}

function getLocationBadge(type: LocationType) {
  const labels: Record<LocationType, string> = {
    presentiel: "Presentiel",
    distanciel: "Distanciel",
    hybride: "Hybride",
  };
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      {labels[type]}
    </span>
  );
}

export default function Missions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: missions, isLoading } = useMissions();
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: programs } = usePrograms();
  const createMission = useCreateMission();
  const updateMissionStatus = useUpdateMissionStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [typologyFilter, setTypologyFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<number | null>(null);

  const [newMission, setNewMission] = useState<{
    reference: string;
    title: string;
    clientIds: string[];
    trainerId: string;
    programId: string;
    startDate: string;
    endDate: string;
    locationType: LocationType;
    location: string;
    typology: string;
  }>({
    reference: "",
    title: "",
    clientIds: [],
    trainerId: "",
    programId: "",
    startDate: "",
    endDate: "",
    locationType: "presentiel" as LocationType,
    location: "",
    typology: "Intra" as string,
  });

  const isAdmin = user?.role === "admin";

  // Filter missions
  const filteredMissions = missions?.filter((mission: Mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    const matchesTrainer = trainerFilter === "all" || mission.trainerId === trainerFilter;
    const matchesTypology = typologyFilter === "all" || mission.typology === typologyFilter;
    const matchesClient = clientFilter === "all" || mission.clientId?.toString() === clientFilter;
    const matchesProgram = programFilter === "all" || mission.programId?.toString() === programFilter;
    return matchesSearch && matchesStatus && matchesTrainer && matchesTypology && matchesClient && matchesProgram;
  }) || [];

  // Sort missions
  const sortedMissions = [...filteredMissions].sort((a: Mission, b: Mission) => {
    switch (sortBy) {
      case "date_asc":
        return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
      case "date_desc":
        return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      case "client":
        const clientA = clients?.find((c: any) => c.id === a.clientId)?.name || "";
        const clientB = clients?.find((c: any) => c.id === b.clientId)?.name || "";
        return clientA.localeCompare(clientB);
      case "trainer":
        const trainerA = trainers?.find((t: any) => t.id === a.trainerId);
        const trainerB = trainers?.find((t: any) => t.id === b.trainerId);
        const nameA = trainerA ? `${trainerA.lastName} ${trainerA.firstName}` : "";
        const nameB = trainerB ? `${trainerB.lastName} ${trainerB.firstName}` : "";
        return nameA.localeCompare(nameB);
      case "title":
        return a.title.localeCompare(b.title);
      case "typology":
        return (a.typology || "").localeCompare(b.typology || "");
      case "status":
        const statusOrder = { draft: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: 4 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
      default:
        return 0;
    }
  });

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== "all" || trainerFilter !== "all" || typologyFilter !== "all" || clientFilter !== "all" || programFilter !== "all" || searchTerm !== "";

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTrainerFilter("all");
    setTypologyFilter("all");
    setClientFilter("all");
    setProgramFilter("all");
    setSortBy("date_desc");
  };

  const handleCreateMission = async () => {
    if (!newMission.title || newMission.clientIds.length === 0 || !newMission.startDate || !newMission.endDate || !newMission.typology) {
      console.error("Champs requis manquants:", {
        title: newMission.title,
        clientIds: newMission.clientIds,
        startDate: newMission.startDate,
        endDate: newMission.endDate,
        typology: newMission.typology
      });
      return;
    }

    try {
      const missionData = {
        reference: newMission.reference || `MIS-${Date.now()}`,
        title: newMission.title,
        clientId: parseInt(newMission.clientIds[0]), // Legacy support for schema (primary client)
        trainerId: newMission.trainerId || null,
        programId: newMission.programId ? parseInt(newMission.programId) : null,
        startDate: newMission.startDate,
        endDate: newMission.endDate,
        locationType: newMission.locationType,
        location: newMission.location || null,
        typology: newMission.typology,
        status: "draft",
      };
      
      const createdMission = await createMission.mutateAsync(missionData as any);
      
      // If multiple clients for INTER
      if (newMission.typology === "Inter" && newMission.clientIds.length > 1) {
        // Add additional clients
        for (let i = 1; i < newMission.clientIds.length; i++) {
          await apiRequest("POST", `/api/missions/${createdMission.id}/clients`, {
            clientId: parseInt(newMission.clientIds[i]),
            isPrimary: false
          });
        }
      }

      setIsCreateOpen(false);
      setNewMission({
        reference: "",
        title: "",
        clientIds: [],
        trainerId: "",
        programId: "",
        startDate: "",
        endDate: "",
        locationType: "presentiel",
        location: "",
        typology: "Intra",
      });
    } catch (error) {
      console.error("Failed to create mission:", error);
    }
  };

  const handleDeleteMission = async () => {
    if (!missionToDelete) return;

    try {
      await apiRequest("DELETE", `/api/missions/${missionToDelete}`);
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission supprimee",
        description: "La mission a ete supprimee avec succes.",
      });
      setMissionToDelete(null);
    } catch (error) {
      console.error("Failed to delete mission:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la mission.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Missions" />

        <div className="flex-1 p-6 space-y-4">
          {/* Search and main actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une mission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isAdmin && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle mission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Creer une mission</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour creer une nouvelle mission de formation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input
                          id="reference"
                          placeholder="MIS-2024-XXX"
                          value={newMission.reference}
                          onChange={(e) => setNewMission({ ...newMission, reference: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          placeholder="Formation Management..."
                          value={newMission.title}
                          onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">{newMission.typology === "Inter" ? "Clients *" : "Client *"}</Label>
                        {newMission.typology === "Inter" ? (
                          <div className="space-y-2">
                            <Select
                              onValueChange={(value) => {
                                if (!newMission.clientIds.includes(value)) {
                                  setNewMission({ ...newMission, clientIds: [...newMission.clientIds, value] });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Ajouter des clients" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients?.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2">
                              {newMission.clientIds.map(id => {
                                const client = clients?.find((c: any) => c.id.toString() === id);
                                return (
                                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                    {client?.name}
                                    <button 
                                      onClick={() => setNewMission({ ...newMission, clientIds: newMission.clientIds.filter(cid => cid !== id) })}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <Select
                            value={newMission.clientIds[0] || ""}
                            onValueChange={(value) => setNewMission({ ...newMission, clientIds: [value] })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selectionner un client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients?.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trainer">Formateur</Label>
                        <Select
                          value={newMission.trainerId}
                          onValueChange={(value) => setNewMission({ ...newMission, trainerId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner un formateur" />
                          </SelectTrigger>
                          <SelectContent>
                            {trainers?.map((trainer: any) => (
                              <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.firstName} {trainer.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="program">Formation (catalogue) *</Label>
                        <Select
                          value={newMission.programId}
                          onValueChange={(value) => setNewMission({ ...newMission, programId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner une formation" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((program: any) => (
                              <SelectItem key={program.id} value={program.id.toString()}>
                                {program.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="typology">Typologie *</Label>
                        <Select
                          value={newMission.typology}
                          onValueChange={(value) => setNewMission({ ...newMission, typology: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner une typologie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intra">Intra</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Conseil">Conseil</SelectItem>
                            <SelectItem value="Conference">Conference</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locationType">Modalite</Label>
                        <Select
                          value={newMission.locationType}
                          onValueChange={(value) => setNewMission({ ...newMission, locationType: value as LocationType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="presentiel">Presentiel</SelectItem>
                            <SelectItem value="distanciel">Distanciel</SelectItem>
                            <SelectItem value="hybride">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Date de debut *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newMission.startDate}
                          onChange={(e) => setNewMission({ ...newMission, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Date de fin *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newMission.endDate}
                          onChange={(e) => setNewMission({ ...newMission, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    {newMission.locationType !== "distanciel" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Lieu</Label>
                          <Input
                            id="location"
                            placeholder="15 rue de la Formation, Paris"
                            value={newMission.location}
                            onChange={(e) => setNewMission({ ...newMission, location: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateMission} disabled={createMission.isPending}>
                      {createMission.isPending ? "Creation..." : "Creer la mission"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters bar */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Tous les statuts</SelectItem>
                  <SelectItem value="draft" className="focus:bg-violet-200">Brouillon</SelectItem>
                  <SelectItem value="confirmed" className="focus:bg-violet-200">Confirmee</SelectItem>
                  <SelectItem value="in_progress" className="focus:bg-violet-200">En cours</SelectItem>
                  <SelectItem value="completed" className="focus:bg-violet-200">Terminee</SelectItem>
                  <SelectItem value="cancelled" className="focus:bg-violet-200">Annulee</SelectItem>
                </SelectContent>
              </Select>

              {/* Typology filter */}
              <Select value={typologyFilter} onValueChange={setTypologyFilter}>
                <SelectTrigger className="w-40">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Typologie" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Toutes typologies</SelectItem>
                  <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                  <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                  <SelectItem value="Conseil" className="focus:bg-violet-200">Conseil</SelectItem>
                  <SelectItem value="Conference" className="focus:bg-violet-200">Conference</SelectItem>
                </SelectContent>
              </Select>

              {/* Client filter */}
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Tous les clients</SelectItem>
                  {clients?.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="focus:bg-violet-200">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Trainer filter */}
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-48">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Formateur" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Tous les formateurs</SelectItem>
                  {trainers?.map((trainer: any) => (
                    <SelectItem key={trainer.id} value={trainer.id} className="focus:bg-violet-200">
                      {trainer.firstName} {trainer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Program filter */}
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-52">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Formation" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Toutes les formations</SelectItem>
                  {programs?.map((program: any) => (
                    <SelectItem key={program.id} value={program.id.toString()} className="focus:bg-violet-200">
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort and view options */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-52">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="date_desc" className="focus:bg-violet-200">Date (plus recentes)</SelectItem>
                    <SelectItem value="date_asc" className="focus:bg-violet-200">Date (plus anciennes)</SelectItem>
                    <SelectItem value="client" className="focus:bg-violet-200">Client (A-Z)</SelectItem>
                    <SelectItem value="trainer" className="focus:bg-violet-200">Formateur (A-Z)</SelectItem>
                    <SelectItem value="title" className="focus:bg-violet-200">Titre (A-Z)</SelectItem>
                    <SelectItem value="typology" className="focus:bg-violet-200">Typologie</SelectItem>
                    <SelectItem value="status" className="focus:bg-violet-200">Statut</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reset filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                    <X className="w-4 h-4 mr-1" />
                    Reinitialiser
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Results count */}
                <span className="text-sm text-muted-foreground">
                  {sortedMissions.length} mission{sortedMissions.length > 1 ? "s" : ""}
                </span>

                {/* View toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Missions list */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune mission</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Aucune mission ne correspond a vos criteres."
                  : "Commencez par creer une nouvelle mission."}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={resetFilters} className="mt-2">
                  Reinitialiser les filtres
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            /* List view */
            <div className="bg-card rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-sm">Reference</th>
                    <th className="text-left p-3 font-medium text-sm">Titre</th>
                    <th className="text-left p-3 font-medium text-sm">Client</th>
                    <th className="text-left p-3 font-medium text-sm">Formateur</th>
                    <th className="text-left p-3 font-medium text-sm">Dates</th>
                    <th className="text-left p-3 font-medium text-sm">Typologie</th>
                    <th className="text-left p-3 font-medium text-sm">Statut</th>
                    <th className="text-right p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMissions.map((mission: Mission) => {
                    const client = clients?.find((c: any) => c.id === mission.clientId);
                    const trainer = trainers?.find((t: any) => t.id === mission.trainerId);
                    // Couleurs de fond selon le statut pour la vue liste
                    const rowStatusStyles: Record<MissionStatus, string> = {
                      draft: "bg-slate-50/70 border-l-4 border-l-slate-400",
                      confirmed: "bg-blue-50/70 border-l-4 border-l-blue-500",
                      in_progress: "bg-orange-50/70 border-l-4 border-l-orange-500",
                      completed: "bg-green-50/70 border-l-4 border-l-green-500",
                      cancelled: "bg-red-50/70 border-l-4 border-l-red-500",
                    };
                    const rowClass = rowStatusStyles[mission.status as MissionStatus] || rowStatusStyles.draft;
                    return (
                      <tr key={mission.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${rowClass}`}>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          {mission.reference || "-"}
                        </td>
                        <td className="p-3">
                          <Link href={`/missions/${mission.id}`} className="font-medium hover:text-primary transition-colors">
                            {mission.title}
                          </Link>
                        </td>
                        <td className="p-3 text-sm">{client?.name || "-"}</td>
                        <td className="p-3 text-sm">
                          {trainer ? `${trainer.firstName} ${trainer.lastName}` : "-"}
                        </td>
                        <td className="p-3 text-sm">
                          {mission.startDate ? (
                            <>
                              {format(new Date(mission.startDate), "dd/MM/yy", { locale: fr })}
                              {mission.endDate && mission.startDate !== mission.endDate && (
                                <> - {format(new Date(mission.endDate), "dd/MM/yy", { locale: fr })}</>
                              )}
                            </>
                          ) : "-"}
                        </td>
                        <td className="p-3">
                          {mission.typology && (
                            <Badge variant="outline" className="text-xs">
                              {mission.typology}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(mission.status as MissionStatus)}
                            {mission.status !== "cancelled" && (
                              <Checkbox
                                checked={mission.status === "completed"}
                                onCheckedChange={(checked) => {
                                  const newStatus = checked ? "completed" : "in_progress";
                                  updateMissionStatus.mutate({ id: mission.id, status: newStatus as MissionStatus });
                                }}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                title={mission.status === "completed" ? "Marquer comme en cours" : "Marquer comme terminée"}
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/missions/${mission.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setMissionToDelete(mission.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid view */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedMissions.map((mission: Mission) => {
                // Couleurs de bordure et fond selon le statut
                const statusStyles: Record<MissionStatus, string> = {
                  draft: "border-l-4 border-l-slate-400 bg-slate-50/50",
                  confirmed: "border-l-4 border-l-blue-500 bg-blue-50/50",
                  in_progress: "border-l-4 border-l-orange-500 bg-orange-50/50",
                  completed: "border-l-4 border-l-green-500 bg-green-50/50",
                  cancelled: "border-l-4 border-l-red-500 bg-red-50/50",
                };
                const statusClass = statusStyles[mission.status as MissionStatus] || statusStyles.draft;

                return (
                <div key={mission.id} className={`group relative rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-200 ${statusClass}`}>
                  <Link href={`/missions/${mission.id}`} className="block cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {mission.reference && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {mission.reference}
                          </p>
                        )}
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {mission.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(mission.status as MissionStatus)}
                        {mission.status !== "cancelled" && (
                          <Checkbox
                            checked={mission.status === "completed"}
                            onCheckedChange={(checked) => {
                              const newStatus = checked ? "completed" : "in_progress";
                              updateMissionStatus.mutate({ id: mission.id, status: newStatus as MissionStatus });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            title={mission.status === "completed" ? "Marquer comme en cours" : "Marquer comme terminée"}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {mission.typology && (
                        <Badge variant="outline" className="mb-2">
                          {mission.typology}
                        </Badge>
                      )}

                      {mission.clientId && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>{clients?.find((c: any) => c.id === mission.clientId)?.name || "Client"}</span>
                        </div>
                      )}

                      {mission.trainerId && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>
                            {(() => {
                              const trainer = trainers?.find((t: any) => t.id === mission.trainerId);
                              return trainer ? `${trainer.firstName} ${trainer.lastName}` : "Formateur";
                            })()}
                          </span>
                        </div>
                      )}

                      {mission.startDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                            {mission.endDate && mission.startDate !== mission.endDate && (
                              <> - {format(new Date(mission.endDate), "d MMM yyyy", { locale: fr })}</>
                            )}
                          </span>
                        </div>
                      )}

                      {mission.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{mission.location}</span>
                        </div>
                      )}

                      {mission.totalHours && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{mission.totalHours}h</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    {mission.locationType && getLocationBadge(mission.locationType as LocationType)}
                    <div className="flex items-center gap-2">
                      <Link href={`/missions/${mission.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMissionToDelete(mission.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialog open={missionToDelete !== null} onOpenChange={(open) => !open && setMissionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irreversible. Cela supprimera definitivement la mission ainsi que toutes les donnees associees (etapes, documents, messages, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMission} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
