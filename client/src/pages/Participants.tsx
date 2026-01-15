import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Briefcase,
} from "lucide-react";
import { useParticipants, useCreateParticipant } from "@/hooks/use-missions";
import type { Participant } from "@shared/schema";

export default function Participants() {
  const { data: participants, isLoading } = useParticipants();
  const createParticipant = useCreateParticipant();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newParticipant, setNewParticipant] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    function: "",
  });

  const filteredParticipants = participants?.filter((participant: Participant) => {
    const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const handleCreateParticipant = async () => {
    if (!newParticipant.firstName || !newParticipant.lastName || !newParticipant.email) return;

    try {
      await createParticipant.mutateAsync(newParticipant);
      setIsCreateOpen(false);
      setNewParticipant({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        function: "",
      });
    } catch (error) {
      console.error("Failed to create participant:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Participants" />

        <div className="flex-1 p-6 space-y-6">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau participant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un participant</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau participant.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prenom *</Label>
                      <Input
                        id="firstName"
                        placeholder="Alice"
                        value={newParticipant.firstName}
                        onChange={(e) => setNewParticipant({ ...newParticipant, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        placeholder="Dupont"
                        value={newParticipant.lastName}
                        onChange={(e) => setNewParticipant({ ...newParticipant, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alice.dupont@example.fr"
                      value={newParticipant.email}
                      onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <Input
                      id="phone"
                      placeholder="06 12 34 56 78"
                      value={newParticipant.phone}
                      onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        placeholder="TechCorp SAS"
                        value={newParticipant.company}
                        onChange={(e) => setNewParticipant({ ...newParticipant, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="function">Poste</Label>
                      <Input
                        id="function"
                        placeholder="Chef de projet"
                        value={newParticipant.function}
                        onChange={(e) => setNewParticipant({ ...newParticipant, function: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateParticipant} disabled={createParticipant.isPending}>
                    {createParticipant.isPending ? "Creation..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Participants table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun participant</h3>
              <p className="text-muted-foreground">
                Commencez par ajouter un nouveau participant.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Poste</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant: Participant) => (
                    <TableRow key={participant.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {participant.firstName[0]}{participant.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {participant.firstName} {participant.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <a href={`mailto:${participant.email}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                            <Mail className="w-3 h-3" />
                            {participant.email}
                          </a>
                          {participant.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {participant.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.company && (
                          <p className="text-sm flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            {participant.company}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {participant.function && (
                          <p className="text-sm flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            {participant.function}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
