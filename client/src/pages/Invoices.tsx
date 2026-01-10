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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Receipt,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  X,
  CreditCard,
  Eye,
} from "lucide-react";
import {
  useInvoices,
  useCreateInvoice,
  useApproveInvoice,
  useRejectInvoice,
  useMarkInvoicePaid,
  useMissions,
} from "@/hooks/use-missions";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Invoice, InvoiceStatus } from "@shared/schema";

function getStatusBadge(status: InvoiceStatus) {
  const styles: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Brouillon", variant: "outline" },
    submitted: { label: "Soumise", variant: "secondary" },
    approved: { label: "Approuvee", variant: "default" },
    rejected: { label: "Refusee", variant: "destructive" },
    paid: { label: "Payee", variant: "default" },
  };
  const { label, variant } = styles[status] || styles.draft;
  return <Badge variant={variant}>{label}</Badge>;
}

function formatAmount(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function Invoices() {
  const { user } = useAuth();
  const { data: invoices, isLoading } = useInvoices();
  const { data: missions } = useMissions();
  const createInvoice = useCreateInvoice();
  const approveInvoice = useApproveInvoice();
  const rejectInvoice = useRejectInvoice();
  const markPaid = useMarkInvoicePaid();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    missionId: "",
    amount: "",
    vatAmount: "",
  });

  const isAdmin = user?.role === "admin";
  const isPrestataire = user?.role === "prestataire";

  const filteredInvoices = invoices?.filter((invoice: Invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateInvoice = async () => {
    if (!newInvoice.invoiceNumber || !newInvoice.amount) return;

    try {
      await createInvoice.mutateAsync({
        invoiceNumber: newInvoice.invoiceNumber,
        amount: Math.round(parseFloat(newInvoice.amount) * 100),
        vatAmount: newInvoice.vatAmount ? Math.round(parseFloat(newInvoice.vatAmount) * 100) : undefined,
        missionId: newInvoice.missionId ? parseInt(newInvoice.missionId) : undefined,
        invoiceDate: new Date(),
        status: "submitted",
      });
      setIsCreateOpen(false);
      setNewInvoice({
        invoiceNumber: "",
        missionId: "",
        amount: "",
        vatAmount: "",
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveInvoice.mutateAsync(id);
    } catch (error) {
      console.error("Failed to approve invoice:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice || !rejectReason) return;
    try {
      await rejectInvoice.mutateAsync({ id: selectedInvoice.id, reason: rejectReason });
      setIsRejectOpen(false);
      setSelectedInvoice(null);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject invoice:", error);
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await markPaid.mutateAsync(id);
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Factures" />

        <div className="flex-1 p-6 space-y-6">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une facture..."
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
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="submitted">Soumise</SelectItem>
                  <SelectItem value="approved">Approuvee</SelectItem>
                  <SelectItem value="rejected">Refusee</SelectItem>
                  <SelectItem value="paid">Payee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPrestataire && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Soumettre une facture
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Soumettre une facture</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour soumettre une nouvelle facture.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Numero de facture *</Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="FAC-2024-001"
                        value={newInvoice.invoiceNumber}
                        onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mission">Mission associee</Label>
                      <Select
                        value={newInvoice.missionId}
                        onValueChange={(value) => setNewInvoice({ ...newInvoice, missionId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner une mission" />
                        </SelectTrigger>
                        <SelectContent>
                          {missions?.map((mission: any) => (
                            <SelectItem key={mission.id} value={mission.id.toString()}>
                              {mission.reference} - {mission.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant HT *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="500.00"
                          value={newInvoice.amount}
                          onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vatAmount">TVA</Label>
                        <Input
                          id="vatAmount"
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={newInvoice.vatAmount}
                          onChange={(e) => setNewInvoice({ ...newInvoice, vatAmount: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={createInvoice.isPending}>
                      {createInvoice.isPending ? "Envoi..." : "Soumettre"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Reject dialog */}
          <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser la facture</DialogTitle>
                <DialogDescription>
                  Indiquez la raison du refus de la facture {selectedInvoice?.invoiceNumber}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Motif du refus..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={rejectInvoice.isPending}>
                  {rejectInvoice.isPending ? "Refus..." : "Confirmer le refus"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invoices table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune facture</h3>
              <p className="text-muted-foreground">
                {isPrestataire
                  ? "Soumettez votre premiere facture."
                  : "Aucune facture a afficher."}
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <p className="font-medium font-mono">{invoice.invoiceNumber}</p>
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceDate && (
                          <p className="text-sm">
                            {format(new Date(invoice.invoiceDate), "d MMM yyyy", { locale: fr })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{formatAmount(invoice.amount)}</p>
                          {invoice.vatAmount && (
                            <p className="text-xs text-muted-foreground">
                              TVA: {formatAmount(invoice.vatAmount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                        {invoice.rejectionReason && (
                          <p className="text-xs text-destructive mt-1">{invoice.rejectionReason}</p>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {invoice.status === "submitted" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleApprove(invoice.id)}>
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsRejectOpen(true);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2 text-red-600" />
                                  Refuser
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {invoice.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkPaid(invoice.id)}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Marquer payee
                            </Button>
                          )}
                        </TableCell>
                      )}
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
