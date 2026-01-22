import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import type { Client, ClientInvoice, CompanySettings, Mission, InvoiceLineItem } from "@shared/schema";

interface InvoiceGeneratorProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingInvoice?: ClientInvoice;
}

export function InvoiceGenerator({ client, open, onOpenChange, existingInvoice }: InvoiceGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [vatRate, setVatRate] = useState(20);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");

  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/documents/company-settings"],
    enabled: open,
  });

  // Fetch missions for this client
  const { data: missions = [] } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
    enabled: open,
  });

  const clientMissions = client ? missions.filter(m => m.clientId === client.id) : [];

  // Initialize form with existing invoice or generate new
  useEffect(() => {
    if (!open || !client) return;

    if (existingInvoice) {
      setTitle(existingInvoice.title);
      setDescription(existingInvoice.description || "");
      setLineItems(existingInvoice.lineItems || [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]);
      setVatRate(existingInvoice.vatRate || 20);
      setNotes(existingInvoice.notes || "");
      if (existingInvoice.dueDate) {
        setDueDate(new Date(existingInvoice.dueDate).toISOString().split('T')[0]);
      }
      if (existingInvoice.missionId) {
        setSelectedMissionId(existingInvoice.missionId.toString());
      }
    } else {
      // Initialize with client data
      setTitle(`Facture - ${client.name}`);
      setDescription(client.demand || "Prestation de services");
      setLineItems([{
        description: client.demand || "Prestation de services",
        quantity: 1,
        unitPrice: client.contractAmount || 0,
        total: client.contractAmount || 0
      }]);

      // Set default due date to 30 days from now
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    }
  }, [existingInvoice, client, open]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = Math.round(subtotal * vatRate / 100);
  const totalAmount = subtotal + vatAmount;

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setLineItems(newItems);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Create/Update invoice mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = existingInvoice
        ? `/api/documents/client-invoices/${existingInvoice.id}`
        : `/api/documents/client-invoices/generate/${client.id}`;

      const method = existingInvoice ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          lineItems,
          subtotal,
          vatRate,
          vatAmount,
          totalAmount,
          dueDate: dueDate || null,
          notes,
          missionId: selectedMissionId ? parseInt(selectedMissionId) : null,
          amount: subtotal
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save invoice");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/client-invoices"] });
      toast({
        title: existingInvoice ? "Facture mise \u00e0 jour" : "Facture cr\u00e9\u00e9e",
        description: "La facture a \u00e9t\u00e9 enregistr\u00e9e avec succ\u00e8s.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la facture.",
        variant: "destructive",
      });
    },
  });

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings?.companyName || "Votre Entreprise", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 35;

    if (companySettings?.address) {
      doc.text(companySettings.address, 20, yPos);
      yPos += 5;
    }
    if (companySettings?.postalCode || companySettings?.city) {
      doc.text(`${companySettings?.postalCode || ""} ${companySettings?.city || ""}`, 20, yPos);
      yPos += 5;
    }
    if (companySettings?.siret) {
      doc.text(`SIRET: ${companySettings.siret}`, 20, yPos);
      yPos += 5;
    }
    if (companySettings?.tvaNumber) {
      doc.text(`TVA: ${companySettings.tvaNumber}`, 20, yPos);
      yPos += 5;
    }

    // Invoice title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", pageWidth - 20, 25, { align: "right" });

    // Invoice number and date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const invoiceNumber = existingInvoice?.invoiceNumber || "BROUILLON";
    doc.text(`N\u00b0 ${invoiceNumber}`, pageWidth - 20, 35, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, 42, { align: "right" });
    if (dueDate) {
      doc.text(`\u00c9ch\u00e9ance: ${new Date(dueDate).toLocaleDateString('fr-FR')}`, pageWidth - 20, 49, { align: "right" });
    }

    // Client info
    yPos = 70;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Facturer \u00e0:", 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(client.name, 20, yPos);
    yPos += 5;

    if (client.address) {
      doc.text(client.address, 20, yPos);
      yPos += 5;
    }
    if (client.postalCode || client.city) {
      doc.text(`${client.postalCode || ""} ${client.city || ""}`, 20, yPos);
      yPos += 5;
    }
    if (client.siret) {
      doc.text(`SIRET: ${client.siret}`, 20, yPos);
      yPos += 5;
    }

    // Line items table
    yPos = 110;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, pageWidth - 40, 10, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 22, yPos);
    doc.text("Quantit\u00e9", 110, yPos);
    doc.text("Prix unitaire", 135, yPos);
    doc.text("Total", pageWidth - 22, yPos, { align: "right" });

    yPos += 10;
    doc.setFont("helvetica", "normal");

    lineItems.forEach((item) => {
      const descLines = doc.splitTextToSize(item.description, 80);
      doc.text(descLines, 22, yPos);
      doc.text(item.quantity.toString(), 110, yPos);
      doc.text((item.unitPrice / 100).toFixed(2) + " \u20ac", 135, yPos);
      doc.text((item.total / 100).toFixed(2) + " \u20ac", pageWidth - 22, yPos, { align: "right" });
      yPos += Math.max(descLines.length * 5, 7);
    });

    // Totals
    yPos += 10;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.text("Sous-total HT:", 120, yPos);
    doc.text((subtotal / 100).toFixed(2) + " \u20ac", pageWidth - 22, yPos, { align: "right" });
    yPos += 7;

    doc.text(`TVA (${vatRate}%):`, 120, yPos);
    doc.text((vatAmount / 100).toFixed(2) + " \u20ac", pageWidth - 22, yPos, { align: "right" });
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL TTC:", 120, yPos);
    doc.text((totalAmount / 100).toFixed(2) + " \u20ac", pageWidth - 22, yPos, { align: "right" });

    // Bank details
    if (companySettings?.iban) {
      yPos += 20;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Coordonn\u00e9es bancaires:", 20, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`IBAN: ${companySettings.iban}`, 20, yPos);
      if (companySettings?.bic) {
        yPos += 5;
        doc.text(`BIC: ${companySettings.bic}`, 20, yPos);
      }
    }

    // Footer
    if (companySettings?.invoiceFooter) {
      doc.setFontSize(8);
      doc.text(companySettings.invoiceFooter, pageWidth / 2, 280, { align: "center", maxWidth: pageWidth - 40 });
    }

    // Save
    doc.save(`facture_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF g\u00e9n\u00e9r\u00e9",
      description: "La facture a \u00e9t\u00e9 t\u00e9l\u00e9charg\u00e9e.",
    });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {existingInvoice ? "Modifier la facture" : "G\u00e9n\u00e9rer une facture"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Client info card */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-2">Client</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{client.name}</p>
                {client.address && <p>{client.address}</p>}
                {(client.postalCode || client.city) && (
                  <p>{client.postalCode} {client.city}</p>
                )}
                {client.siret && <p>SIRET: {client.siret}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Invoice details */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la facture</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Facture - ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission">Mission associ\u00e9e (optionnel)</Label>
                <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="S\u00e9lectionner une mission" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="" className="focus:bg-violet-200">Aucune</SelectItem>
                    {clientMissions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id.toString()} className="focus:bg-violet-200">
                        {mission.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la prestation..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Lignes de facturation</h3>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Quantit\u00e9"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Prix unitaire (\u20ac)"
                      value={(item.unitPrice / 100).toFixed(2)}
                      onChange={(e) => updateLineItem(index, 'unitPrice', Math.round(parseFloat(e.target.value) * 100) || 0)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium">
                      {(item.total / 100).toFixed(2)} \u20ac
                    </span>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals and options */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatRate">Taux TVA (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d'\u00e9ch\u00e9ance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes additionnelles..."
                  rows={2}
                />
              </div>
            </div>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total HT</span>
                  <span className="font-medium">{(subtotal / 100).toFixed(2)} \u20ac</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>TVA ({vatRate}%)</span>
                  <span>{(vatAmount / 100).toFixed(2)} \u20ac</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span>{(totalAmount / 100).toFixed(2)} \u20ac</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="outline" onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            T\u00e9l\u00e9charger PDF
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {existingInvoice ? "Mettre \u00e0 jour" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
