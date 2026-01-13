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
} from "lucide-react";
import { useMissions, useClients, useTrainers, usePrograms, useCreateMission } from "@/hooks/use-missions";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionStatus, LocationType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  const { data: missions, isLoading } = useMissions();
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: programs } = usePrograms();
  const createMission = useCreateMission();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    return matchesSearch && matchesStatus;
  }) || [];

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Missions" />

        <div className="flex-1 p-6 space-y-6">
          {/* Actions bar */}
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="confirmed">Confirmee</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminee</SelectItem>
                  <SelectItem value="cancelled">Annulee</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Missions list */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune mission</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Aucune mission ne correspond a vos criteres."
                  : "Commencez par creer une nouvelle mission."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMissions.map((mission: Mission) => (
                <Link key={mission.id} href={`/missions/${mission.id}`}>
                  <div className="group bg-card rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
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
                      {getStatusBadge(mission.status as MissionStatus)}
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

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      {mission.locationType && getLocationBadge(mission.locationType as LocationType)}
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
