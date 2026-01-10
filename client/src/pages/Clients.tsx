import { useState } from "react";
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
  Building2,
  Search,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/use-missions";
import type { Client } from "@shared/schema";

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

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newClient, setNewClient] = useState({
    name: "",
    type: "entreprise" as "entreprise" | "opco" | "particulier" | "institution",
    siret: "",
    address: "",
    city: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const filteredClients = clients?.filter((client: Client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.type) return;

    try {
      await createClient.mutateAsync(newClient);
      setIsCreateOpen(false);
      setNewClient({
        name: "",
        type: "entreprise",
        siret: "",
        address: "",
        city: "",
        postalCode: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    } catch (error) {
      console.error("Failed to create client:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Clients" />

        <div className="flex-1 p-6 space-y-6">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
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
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="entreprise">Entreprise</SelectItem>
                  <SelectItem value="opco">OPCO</SelectItem>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un client</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau client.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        placeholder="TechCorp SAS"
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={newClient.type}
                        onValueChange={(value) => setNewClient({ ...newClient, type: value as any })}
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
                      <Label htmlFor="siret">SIRET</Label>
                      <Input
                        id="siret"
                        placeholder="12345678901234"
                        value={newClient.siret}
                        onChange={(e) => setNewClient({ ...newClient, siret: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact</Label>
                      <Input
                        id="contactName"
                        placeholder="Sophie Leroy"
                        value={newClient.contactName}
                        onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
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
                        value={newClient.contactEmail}
                        onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Telephone</Label>
                      <Input
                        id="contactPhone"
                        placeholder="01 23 45 67 89"
                        value={newClient.contactPhone}
                        onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      placeholder="15 rue de la Formation"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        placeholder="75001"
                        value={newClient.postalCode}
                        onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        placeholder="Paris"
                        value={newClient.city}
                        onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateClient} disabled={createClient.isPending}>
                    {createClient.isPending ? "Creation..." : "Ajouter le client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Clients table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun client</h3>
              <p className="text-muted-foreground">
                Commencez par ajouter un nouveau client.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Localisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: Client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.siret && (
                            <p className="text-xs text-muted-foreground">SIRET: {client.siret}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(client.type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.contactName && (
                            <p className="text-sm">{client.contactName}</p>
                          )}
                          {client.contactEmail && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.city && (
                          <p className="text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {client.city}
                            {client.postalCode && ` (${client.postalCode})`}
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
