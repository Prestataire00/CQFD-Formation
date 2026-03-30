import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
} from "@/components/ui/popover";
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
  Tag,
  X,
  LayoutGrid,
  List,
  Check,
  ChevronsUpDown,
  Users,
  Copy,
  Archive,
} from "lucide-react";
import { useMissions, useClients, useTrainers, useCreateMission, useUpdateMissionStatus, useAllSessions } from "@/hooks/use-missions";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionStatus, LocationType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
    draft: { label: "En option", className: "bg-slate-100 text-slate-600 border border-slate-300" },
    confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-700 border border-blue-300" },
    in_progress: { label: "En cours", className: "bg-orange-100 text-orange-700 border border-orange-300" },
    completed: { label: "Terminée", className: "bg-green-100 text-green-700 border border-green-300" },
    cancelled: { label: "Annulée", className: "bg-red-100 text-red-700 border border-red-300" },
    archived: { label: "Archivée", className: "bg-gray-100 text-gray-500 border border-gray-300" },
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
  const [, setLocation] = useLocation();
  const { data: missions, isLoading } = useMissions();
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: allSessions } = useAllSessions();
  const createMission = useCreateMission();
  const updateMissionStatus = useUpdateMissionStatus();

  // Build a map of missionId -> session dates
  const sessionsByMission = useMemo(() => {
    const map: Record<number, Array<{ sessionDate: string; startTime?: string; endTime?: string }>> = {};
    if (allSessions) {
      for (const s of allSessions) {
        if (!map[s.missionId]) map[s.missionId] = [];
        map[s.missionId].push(s);
      }
    }
    return map;
  }, [allSessions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [typologyFilter, setTypologyFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"missions" | "archived">("missions");

  // Combobox states
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const [newMission, setNewMission] = useState<{
    title: string;
    clientIds: string[];
    trainerId: string;
    trainingDays: Array<{ date: string; startTime: string; endTime: string }>;
    locationType: LocationType;
    location: string;
    typology: string;
    reminderDays: number | null;
    participantsList: string;
    expectedParticipants: string;
    hasDisability: boolean;
    disabilityDetails: string;
    rateBase: string;
    financialTerms: string;
  }>({
    title: "",
    clientIds: [],
    trainerId: "",
    trainingDays: [{ date: "", startTime: "09:00", endTime: "17:00" }],
    locationType: "presentiel" as LocationType,
    location: "",
    typology: "Intra" as string,
    reminderDays: 7,
    participantsList: "",
    expectedParticipants: "",
    hasDisability: false,
    disabilityDetails: "",
    rateBase: "",
    financialTerms: "",
  });

  // Auto-open creation dialog with pre-filled client from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("newMission");
    if (clientId) {
      setNewMission(prev => ({ ...prev, clientIds: [clientId] }));
      setIsCreateOpen(true);
      // Clean URL
      setLocation("/missions", { replace: true });
    }
  }, []);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const sorted = [...clients].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", "fr"));
    if (!clientSearch) return sorted;
    const search = clientSearch.toLowerCase();
    return sorted.filter((c: any) =>
      c.name?.toLowerCase().includes(search) ||
      c.contactEmail?.toLowerCase().includes(search) ||
      c.city?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const isAdmin = user?.role === "admin";

  // Filter missions
  const filteredMissions = missions?.filter((mission: Mission) => {
    const matchesSearch =
      (mission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTab = activeTab === "archived" ? mission.status === "archived" : mission.status !== "archived";
    const matchesStatus = activeTab === "archived" || statusFilter === "all" || mission.status === statusFilter;
    const matchesTrainer = trainerFilter === "all" || mission.trainerId === trainerFilter;
    const matchesTypology = typologyFilter === "all" || (mission.typology || "") === typologyFilter;
    const matchesClient = clientFilter === "all" || mission.clientId?.toString() === clientFilter;
    return matchesTab && matchesSearch && matchesStatus && matchesTrainer && matchesTypology && matchesClient;
  }) || [];

  // Sort missions
  // Helper: get the earliest session date for a mission, fallback to startDate
  const getEarliestSessionDate = (mission: Mission): number => {
    const sessions = sessionsByMission[mission.id];
    if (sessions && sessions.length > 0) {
      const dates = sessions.map(s => new Date(s.sessionDate).getTime()).filter(d => !isNaN(d));
      if (dates.length > 0) return Math.min(...dates);
    }
    return new Date(mission.startDate || 0).getTime();
  };

  const sortedMissions = [...filteredMissions].sort((a: Mission, b: Mission) => {
    switch (sortBy) {
      case "date_asc":
        return getEarliestSessionDate(b) - getEarliestSessionDate(a);
      case "date_desc":
        return getEarliestSessionDate(a) - getEarliestSessionDate(b);
      case "client":
        const clientA = clients?.find((c: any) => c.id === a.clientId)?.name || "";
        const clientB = clients?.find((c: any) => c.id === b.clientId)?.name || "";
        return clientA.localeCompare(clientB);
      case "trainer":
        const trainerA = trainers?.find((t: any) => t.id === a.trainerId);
        const trainerB = trainers?.find((t: any) => t.id === b.trainerId);
        const nameA = trainerA ? `${trainerA.lastName || ""} ${trainerA.firstName || ""}` : "";
        const nameB = trainerB ? `${trainerB.lastName || ""} ${trainerB.firstName || ""}` : "";
        return nameA.localeCompare(nameB);
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "typology":
        return (a.typology || "").localeCompare(b.typology || "");
      case "status":
        const statusOrder = { draft: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: 4, archived: 5 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
      default:
        return 0;
    }
  });

  // Count archived missions
  const archivedCount = missions?.filter((m: Mission) => m.status === "archived").length || 0;

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== "all" || trainerFilter !== "all" || typologyFilter !== "all" || clientFilter !== "all" || searchTerm !== "";

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTrainerFilter("all");
    setTypologyFilter("all");
    setClientFilter("all");
    setSortBy("date_desc");
  };

  const handleCreateMission = async () => {
    // Valider qu'il y a au moins un jour avec une date
    const validDays = newMission.trainingDays.filter(d => d.date);
    if (!newMission.title || newMission.clientIds.length === 0 || !newMission.typology) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir le titre, le client et la typologie.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculer la date de debut depuis les jours de formation (min)
      const allDates = validDays.length > 0 ? validDays.map(d => d.date).sort() : [];
      const globalStartDate = allDates.length > 0 ? allDates[0] : null;

      const missionData = {
        title: newMission.title,
        clientId: parseInt(newMission.clientIds[0]),
        trainerId: newMission.trainerId || null,
        startDate: globalStartDate,
        locationType: newMission.locationType,
        location: newMission.location || null,
        typology: newMission.typology,
        expectedParticipants: newMission.expectedParticipants ? parseInt(newMission.expectedParticipants) : null,
        participantsList: newMission.participantsList || null,
        hasDisability: newMission.hasDisability,
        disabilityDetails: newMission.disabilityDetails || null,
        rateBase: newMission.rateBase || null,
        financialTerms: newMission.financialTerms || null,
        status: "draft",
      };

      const createdMission = await createMission.mutateAsync(missionData as any);

      // Creer les jours de formation
      for (const day of validDays) {
        await apiRequest("POST", `/api/missions/${createdMission.id}/sessions`, {
          sessionDate: day.date,
          startTime: day.startTime || null,
          endTime: day.endTime || null,
        });
      }
      // Invalidate global sessions cache
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });

      // If multiple clients for INTER
      if (newMission.typology === "Inter" && newMission.clientIds.length > 1) {
        for (let i = 1; i < newMission.clientIds.length; i++) {
          await apiRequest("POST", `/api/missions/${createdMission.id}/clients`, {
            clientId: parseInt(newMission.clientIds[i]),
            isPrimary: false
          });
        }
      }

      // Créer le rappel avec le J-X choisi
      if (newMission.reminderDays !== null && newMission.reminderDays > 0) {
        try {
          await apiRequest("POST", `/api/missions/${createdMission.id}/create-reminder`, {
            daysBefore: newMission.reminderDays,
          });
        } catch (err) {
          console.error("Erreur lors de la création du rappel:", err);
        }
      }

      setIsCreateOpen(false);
      setNewMission({
        title: "",
        clientIds: [],
        trainerId: "",
        trainingDays: [{ date: "", startTime: "09:00", endTime: "17:00" }],
        locationType: "presentiel",
        location: "",
        typology: "Intra",
        reminderDays: 7,
        participantsList: "",
        expectedParticipants: "",
        hasDisability: false,
        disabilityDetails: "",
        rateBase: "",
        financialTerms: "",
      });
      toast({
        title: "Mission creee",
        description: `La mission a ete creee avec ${validDays.length} jour(s) de formation.${newMission.reminderDays ? ` Rappel J-${newMission.reminderDays} programme.` : ""}`,
      });
    } catch (error) {
      console.error("Failed to create mission:", error);
      toast({
        title: "Erreur",
        description: "Impossible de creer la mission.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMission = async () => {
    if (!missionToDelete) return;

    try {
      await apiRequest("DELETE", `/api/missions/${missionToDelete}`);
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission supprimée",
        description: "La mission a été supprimée définitivement.",
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

  const handleArchiveMission = async () => {
    if (!missionToDelete) return;

    try {
      await apiRequest("PATCH", `/api/missions/${missionToDelete}/status`, { status: "archived" });
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission archivée",
        description: "La mission a été archivée et ses documents supprimés pour libérer l'espace.",
      });
      setMissionToDelete(null);
    } catch (error: any) {
      console.error("Failed to archive mission:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'archiver la mission.",
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Creer une mission</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour creer une nouvelle mission de formation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        placeholder="Formation Management..."
                        value={newMission.title}
                        onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">{newMission.typology === "Inter" ? "Clients *" : "Client *"}</Label>
                        <div className="relative">
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                            onClick={() => setClientOpen(!clientOpen)}
                          >
                            {newMission.typology === "Inter" ? (
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Taper pour ajouter des clients...
                              </span>
                            ) : newMission.clientIds[0] ? (
                              (() => {
                                const client = clients?.find((c: any) => c.id.toString() === newMission.clientIds[0]);
                                return client ? client.name : "Selectionner...";
                              })()
                            ) : (
                              <span className="text-muted-foreground">Taper pour rechercher...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                          {clientOpen && (
                            <div className="absolute top-full left-0 mt-1 w-[350px] z-[60] rounded-md border bg-popover shadow-md">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Rechercher un client (nom, email, ville)..."
                                  value={clientSearch}
                                  onValueChange={setClientSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>Aucun client trouve</CommandEmpty>
                                  <CommandGroup>
                                    {filteredClients
                                      .filter((c: any) => newMission.typology === "Inter" ? !newMission.clientIds.includes(c.id.toString()) : true)
                                      .map((client: any) => (
                                        <CommandItem
                                          key={client.id}
                                          value={client.id.toString()}
                                          onSelect={() => {
                                            if (newMission.typology === "Inter") {
                                              if (!newMission.clientIds.includes(client.id.toString())) {
                                                setNewMission({ ...newMission, clientIds: [...newMission.clientIds, client.id.toString()] });
                                              }
                                            } else {
                                              setNewMission({ ...newMission, clientIds: [client.id.toString()] });
                                              setClientOpen(false);
                                            }
                                            setClientSearch("");
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              newMission.clientIds.includes(client.id.toString()) ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{client.name}</span>
                                            {(client.contactEmail || client.city) && (
                                              <span className="text-xs text-muted-foreground">
                                                {[client.contactEmail, client.city].filter(Boolean).join(" • ")}
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </div>
                          )}
                        </div>
                        {newMission.clientIds.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newMission.clientIds.map(id => {
                              const client = clients?.find((c: any) => c.id.toString() === id);
                              return (
                                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                  {client?.name}
                                  <button
                                    type="button"
                                    onClick={() => setNewMission({ ...newMission, clientIds: newMission.clientIds.filter(cid => cid !== id) })}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trainer">Formateur</Label>
                        <Select
                          value={newMission.trainerId || "_none_"}
                          onValueChange={(value) => setNewMission({ ...newMission, trainerId: value === "_none_" ? "" : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner un formateur" />
                          </SelectTrigger>
                          <SelectContent className="bg-violet-100 border-violet-300">
                            <SelectItem value="_none_" className="focus:bg-violet-200">Aucun formateur</SelectItem>
                            {trainers?.slice().sort((a: any, b: any) =>
                              `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr")
                            ).map((trainer: any) => (
                              <SelectItem key={trainer.id} value={trainer.id} className="focus:bg-violet-200">
                                {trainer.firstName} {trainer.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedParticipants">Nombre de participants prevus</Label>
                      <Input
                        id="expectedParticipants"
                        type="number"
                        min="0"
                        placeholder="Ex: 12"
                        value={newMission.expectedParticipants}
                        onChange={(e) => setNewMission({ ...newMission, expectedParticipants: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre indicatif de participants attendus sur cette mission.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasDisability"
                          checked={newMission.hasDisability}
                          onCheckedChange={(checked) => setNewMission({ ...newMission, hasDisability: !!checked, disabilityDetails: checked ? newMission.disabilityDetails : "" })}
                        />
                        <Label htmlFor="hasDisability" className="cursor-pointer">Situation de handicap</Label>
                      </div>
                      {newMission.hasDisability && (
                        <Textarea
                          placeholder="Preciser les amenagements necessaires ou les informations utiles..."
                          value={newMission.disabilityDetails}
                          onChange={(e) => setNewMission({ ...newMission, disabilityDetails: e.target.value })}
                          rows={3}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rateBase">Base tarifaire</Label>
                        <Input
                          id="rateBase"
                          placeholder="Ex: 1 200 EUR / jour"
                          value={newMission.rateBase}
                          onChange={(e) => setNewMission({ ...newMission, rateBase: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="financialTerms">Modalite financiere</Label>
                        <Input
                          id="financialTerms"
                          placeholder="Ex: Paiement a 30 jours"
                          value={newMission.financialTerms}
                          onChange={(e) => setNewMission({ ...newMission, financialTerms: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Participants</Label>
                      <Textarea
                        placeholder="Saisir la liste des participants (un par ligne ou separes par des virgules)..."
                        value={newMission.participantsList}
                        onChange={(e) => setNewMission({ ...newMission, participantsList: e.target.value })}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Liste libre des participants pour cette mission
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="typology">Typologie *</Label>
                        <Select
                          value={newMission.typology}
                          onValueChange={(value) => setNewMission({ ...newMission, typology: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-violet-100 border-violet-300">
                            <SelectItem value="Conférence" className="focus:bg-violet-200">Conférence</SelectItem>
                            <SelectItem value="Conseil" className="focus:bg-violet-200">Conseil</SelectItem>
                            <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                            <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locationType">Modalite</Label>
                        <Select
                          value={newMission.locationType}
                          onValueChange={(value) => setNewMission({ ...newMission, locationType: value as LocationType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-violet-100 border-violet-300">
                            <SelectItem value="distanciel" className="focus:bg-violet-200">Distanciel</SelectItem>
                            <SelectItem value="hybride" className="focus:bg-violet-200">Hybride</SelectItem>
                            <SelectItem value="presentiel" className="focus:bg-violet-200">Presentiel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newMission.locationType !== "distanciel" && (
                        <div className="space-y-2">
                          <Label htmlFor="location">Lieu</Label>
                          <Input
                            id="location"
                            placeholder="Adresse"
                            value={newMission.location}
                            onChange={(e) => setNewMission({ ...newMission, location: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Jours de formation</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewMission({
                            ...newMission,
                            trainingDays: [...newMission.trainingDays, { date: "", startTime: "09:00", endTime: "17:00" }]
                          })}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ajouter un jour
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {newMission.trainingDays.map((day, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <Input
                                  type="date"
                                  value={day.date}
                                  onChange={(e) => {
                                    const updated = [...newMission.trainingDays];
                                    updated[index].date = e.target.value;
                                    setNewMission({ ...newMission, trainingDays: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Debut</Label>
                                <Input
                                  type="time"
                                  value={day.startTime}
                                  onChange={(e) => {
                                    const updated = [...newMission.trainingDays];
                                    updated[index].startTime = e.target.value;
                                    setNewMission({ ...newMission, trainingDays: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Fin</Label>
                                <Input
                                  type="time"
                                  value={day.endTime}
                                  onChange={(e) => {
                                    const updated = [...newMission.trainingDays];
                                    updated[index].endTime = e.target.value;
                                    setNewMission({ ...newMission, trainingDays: updated });
                                  }}
                                />
                              </div>
                            </div>
                            {newMission.trainingDays.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const updated = newMission.trainingDays.filter((_, i) => i !== index);
                                  setNewMission({ ...newMission, trainingDays: updated });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajoutez chaque jour de formation avec ses horaires (ex: 18 janv 9h-17h, 24 janv 9h-17h).
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <Label>Rappel avant la formation</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={newMission.reminderDays === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewMission({ ...newMission, reminderDays: null })}
                        >
                          Aucun
                        </Button>
                        {[30, 14, 7, 3, 2, 1].map((days) => (
                          <Button
                            key={days}
                            type="button"
                            variant={newMission.reminderDays === days ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewMission({ ...newMission, reminderDays: days })}
                          >
                            J-{days}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newMission.reminderDays
                          ? `Un rappel sera envoye ${newMission.reminderDays} jour(s) avant le debut de la formation`
                          : "Aucun rappel ne sera programme"}
                      </p>
                    </div>
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

          {/* Tabs: Missions / Archivées */}
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab("missions"); setStatusFilter("all"); }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "missions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Missions
            </button>
            <button
              onClick={() => { setActiveTab("archived"); setStatusFilter("all"); }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "archived"
                  ? "border-gray-500 text-gray-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Archive className="w-4 h-4" />
              Archivées
              {archivedCount > 0 && (
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{archivedCount}</span>
              )}
            </button>
          </div>

          {/* Filters bar */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Status filter (hidden on archived tab) */}
              {activeTab !== "archived" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="all" className="focus:bg-violet-200">Tous les statuts</SelectItem>
                    <SelectItem value="cancelled" className="focus:bg-violet-200">Annulee</SelectItem>
                    <SelectItem value="draft" className="focus:bg-violet-200">En option</SelectItem>
                    <SelectItem value="confirmed" className="focus:bg-violet-200">Confirmee</SelectItem>
                    <SelectItem value="in_progress" className="focus:bg-violet-200">En cours</SelectItem>
                    <SelectItem value="completed" className="focus:bg-violet-200">Terminee</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Typology filter */}
              <Select value={typologyFilter} onValueChange={setTypologyFilter}>
                <SelectTrigger className="w-40">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Typologie" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="all" className="focus:bg-violet-200">Toutes typologies</SelectItem>
                  <SelectItem value="Conférence" className="focus:bg-violet-200">Conférence</SelectItem>
                  <SelectItem value="Conseil" className="focus:bg-violet-200">Conseil</SelectItem>
                  <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                  <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                </SelectContent>
              </Select>

              {/* Client filter - admin only */}
              {isAdmin && (
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-48">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="all" className="focus:bg-violet-200">Tous les clients</SelectItem>
                    {clients?.slice().sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", "fr")).map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()} className="focus:bg-violet-200">
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Trainer filter - admin only */}
              {isAdmin && (
                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                  <SelectTrigger className="w-48">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Formateur" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="all" className="focus:bg-violet-200">Tous les formateurs</SelectItem>
                    {trainers?.slice().sort((a: any, b: any) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr")).map((trainer: any) => (
                      <SelectItem key={trainer.id} value={trainer.id} className="focus:bg-violet-200">
                        {trainer.firstName} {trainer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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
                    {isAdmin && <SelectItem value="client" className="focus:bg-violet-200">Client (A-Z)</SelectItem>}
                    <SelectItem value="date_asc" className="focus:bg-violet-200">Date (plus anciennes)</SelectItem>
                    <SelectItem value="date_desc" className="focus:bg-violet-200">Date (plus recentes)</SelectItem>
                    {isAdmin && <SelectItem value="trainer" className="focus:bg-violet-200">Formateur (A-Z)</SelectItem>}
                    <SelectItem value="status" className="focus:bg-violet-200">Statut</SelectItem>
                    <SelectItem value="title" className="focus:bg-violet-200">Titre (A-Z)</SelectItem>
                    <SelectItem value="typology" className="focus:bg-violet-200">Typologie</SelectItem>
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
                    <th className="text-left p-3 font-medium text-sm">Titre</th>
                    {isAdmin && <th className="text-left p-3 font-medium text-sm">Client</th>}
                    {isAdmin && <th className="text-left p-3 font-medium text-sm">Formateur</th>}
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
                      archived: "bg-gray-50/70 border-l-4 border-l-gray-400",
                    };
                    const rowClass = rowStatusStyles[mission.status as MissionStatus] || rowStatusStyles.draft;
                    return (
                      <tr key={mission.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${rowClass}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/missions/${mission.id}`} className="font-medium hover:text-primary transition-colors">
                              {mission.title}
                            </Link>
                            {isAdmin && mission.isOriginal && (
                              <Badge className="bg-purple-100 text-purple-700 border border-purple-300 text-[10px] px-1.5 py-0">Original</Badge>
                            )}
                            {isAdmin && mission.parentMissionId && (
                              <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300 text-[10px] px-1.5 py-0">Copie</Badge>
                            )}
                          </div>
                        </td>
                        {isAdmin && <td className="p-3 text-sm">{client?.name || "-"}</td>}
                        {isAdmin && (
                          <td className="p-3 text-sm">
                            {trainer ? `${trainer.firstName} ${trainer.lastName}` : "-"}
                          </td>
                        )}
                        <td className="p-3 text-sm">
                          {mission.startDate ? (
                            <>
                              {format(new Date(mission.startDate), "dd/MM/yy", { locale: fr })}
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
                                  updateMissionStatus.mutate(
                                    { id: mission.id, status: newStatus as MissionStatus },
                                    {
                                      onError: (error: any) => {
                                        if (error?.data?.issues) {
                                          toast({ title: error.data.message, description: error.data.issues.join(" | "), variant: "destructive", duration: 10000 });
                                        } else {
                                          toast({ title: "Erreur", variant: "destructive" });
                                        }
                                      },
                                    }
                                  );
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
                  archived: "border-l-4 border-l-gray-400 bg-gray-50/50",
                };
                const statusClass = statusStyles[mission.status as MissionStatus] || statusStyles.draft;

                return (
                <div key={mission.id} className={`group relative rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-200 ${statusClass}`}>
                  <Link href={`/missions/${mission.id}`} className="block cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {mission.title}
                          </h3>
                          {isAdmin && mission.isOriginal && (
                            <Badge className="bg-purple-100 text-purple-700 border border-purple-300 text-[10px] px-1.5 py-0">Original</Badge>
                          )}
                          {isAdmin && mission.parentMissionId && (
                            <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300 text-[10px] px-1.5 py-0">Copie</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(mission.status as MissionStatus)}
                        {mission.status !== "cancelled" && (
                          <Checkbox
                            checked={mission.status === "completed"}
                            onCheckedChange={(checked) => {
                              const newStatus = checked ? "completed" : "in_progress";
                              updateMissionStatus.mutate(
                                { id: mission.id, status: newStatus as MissionStatus },
                                {
                                  onError: (error: any) => {
                                    if (error?.data?.issues) {
                                      toast({ title: error.data.message, description: error.data.issues.join(" | "), variant: "destructive", duration: 10000 });
                                    } else {
                                      toast({ title: "Erreur", variant: "destructive" });
                                    }
                                  },
                                }
                              );
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

                      {isAdmin && mission.trainerId && (
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

                      {mission.expectedParticipants != null && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{mission.expectedParticipants} participant(s) prevus</span>
                        </div>
                      )}

                      {(() => {
                        const sessions = sessionsByMission[mission.id];
                        if (sessions && sessions.length > 0) {
                          return (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {sessions.map((s: any, i: number) => (
                                  <span key={i} className="inline-flex items-center bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                                    {format(new Date(s.sessionDate), "d MMM yyyy", { locale: fr })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        if (mission.startDate) {
                          return (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

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
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Que souhaitez-vous faire ?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">
                  <strong className="text-gray-700">Archiver :</strong> Conserve la mission et ses données (évaluations, factures, sessions...) mais supprime les documents pour libérer l'espace de stockage.
                </span>
                <span className="block">
                  <strong className="text-gray-700">Supprimer :</strong> Supprime définitivement la mission et toutes les données associées. Cette action est irréversible.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchiveMission} className="bg-gray-600 text-white hover:bg-gray-700">
                <Archive className="w-4 h-4 mr-2" />
                Archiver
              </AlertDialogAction>
              <AlertDialogAction onClick={handleDeleteMission} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
