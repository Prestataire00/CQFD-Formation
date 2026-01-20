import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2, Wand2, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import type { Client, ClientContract, CompanySettings } from "@shared/schema";

interface ContractGeneratorProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingContract?: ClientContract;
}

export function ContractGenerator({ client, open, onOpenChange, existingContract }: ContractGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("edit");

  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/documents/company-settings"],
    enabled: open,
  });

  // Calculate totals
  const vatAmount = Math.round(amount * vatRate / 100);
  const totalAmount = amount + vatAmount;

  // Initialize form with existing contract or generate new
  useEffect(() => {
    if (!open || !client) return;

    if (existingContract) {
      setTitle(existingContract.title);
      setDescription(existingContract.description || "");
      setContent(existingContract.content || "");
      setAmount(existingContract.amount);
      setVatRate(existingContract.vatRate || 20);
      if (existingContract.startDate) {
        setStartDate(new Date(existingContract.startDate).toISOString().split('T')[0]);
      }
      if (existingContract.endDate) {
        setEndDate(new Date(existingContract.endDate).toISOString().split('T')[0]);
      }
    } else {
      // Initialize with client data
      setTitle(`Contrat - ${client.name}`);
      setDescription(client.demand || "Prestation de services");
      setAmount(client.contractAmount || 0);
      setContent("");
    }
  }, [existingContract, client, open]);

  // Generate contract content
  const generateContent = () => {
    const companyName = companySettings?.companyName || "Votre Entreprise";
    const companyAddress = companySettings?.address
      ? `${companySettings.address}, ${companySettings.postalCode || ""} ${companySettings.city || ""}`
      : "";
    const companySiret = companySettings?.siret || "";

    const clientAddress = client.address
      ? `${client.address}, ${client.postalCode || ""} ${client.city || ""}`
      : "";

    const formatCurrency = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' \u20ac';
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "[DATE]";
      return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    const newContent = `CONTRAT DE PRESTATION DE SERVICES

Entre les soussign\u00e9s :

${companyName}
${companyAddress}
${companySiret ? `SIRET : ${companySiret}` : ""}
${companySettings?.email ? `Email : ${companySettings.email}` : ""}
${companySettings?.phone ? `T\u00e9l\u00e9phone : ${companySettings.phone}` : ""}

Ci-apr\u00e8s d\u00e9nomm\u00e9 "Le Prestataire"

ET

${client.name}
${clientAddress}
${client.siret ? `SIRET : ${client.siret}` : ""}
${client.email ? `Email : ${client.email}` : ""}
${client.phone ? `T\u00e9l\u00e9phone : ${client.phone}` : ""}
${client.contactName ? `Repr\u00e9sent\u00e9 par : ${client.contactName}` : ""}

Ci-apr\u00e8s d\u00e9nomm\u00e9 "Le Client"

IL A \u00c9T\u00c9 CONVENU CE QUI SUIT :

ARTICLE 1 - OBJET DU CONTRAT

Le pr\u00e9sent contrat a pour objet de d\u00e9finir les conditions dans lesquelles le Prestataire s'engage \u00e0 fournir au Client les services suivants :

${description || "Prestation de formation professionnelle"}

ARTICLE 2 - DUR\u00c9E DU CONTRAT

Le pr\u00e9sent contrat prend effet \u00e0 compter du ${formatDate(startDate)} et se terminera le ${formatDate(endDate)}.

ARTICLE 3 - PRIX ET MODALIT\u00c9S DE PAIEMENT

Le prix total de la prestation s'\u00e9l\u00e8ve \u00e0 ${formatCurrency(amount)} HT.
${companySettings?.tvaNumber ? `TVA applicable au taux de ${vatRate}% soit ${formatCurrency(vatAmount)}` : "TVA non applicable, article 293B du CGI"}
Total TTC : ${formatCurrency(totalAmount)}

Le paiement sera effectu\u00e9 selon les modalit\u00e9s suivantes :
- 30% \u00e0 la signature du pr\u00e9sent contrat
- 70% \u00e0 la fin de la prestation

ARTICLE 4 - OBLIGATIONS DU PRESTATAIRE

Le Prestataire s'engage \u00e0 :
- Ex\u00e9cuter la prestation conform\u00e9ment aux r\u00e8gles de l'art
- Respecter les d\u00e9lais convenus
- Informer le Client de toute difficult\u00e9 dans l'ex\u00e9cution de la prestation

ARTICLE 5 - OBLIGATIONS DU CLIENT

Le Client s'engage \u00e0 :
- Fournir au Prestataire toutes les informations n\u00e9cessaires \u00e0 l'ex\u00e9cution de la prestation
- R\u00e9gler les factures dans les d\u00e9lais convenus
- Collaborer activement \u00e0 la bonne ex\u00e9cution de la prestation

ARTICLE 6 - CONFIDENTIALIT\u00c9

Les parties s'engagent \u00e0 garder confidentielles toutes les informations \u00e9chang\u00e9es dans le cadre du pr\u00e9sent contrat.

ARTICLE 7 - LOI APPLICABLE ET JURIDICTION

Le pr\u00e9sent contrat est soumis au droit fran\u00e7ais. En cas de litige, les tribunaux comp\u00e9tents seront ceux du lieu du si\u00e8ge social du Prestataire.

Fait \u00e0 ______________, le ______________

En deux exemplaires originaux.

Pour le Prestataire :                    Pour le Client :
${companyName}                           ${client.name}


_____________________                    _____________________
Signature                                Signature
`;

    setContent(newContent);
    toast({
      title: "Contrat g\u00e9n\u00e9r\u00e9",
      description: "Le contenu du contrat a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 automatiquement.",
    });
  };

  // Create/Update contract mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = existingContract
        ? `/api/documents/contracts/${existingContract.id}`
        : `/api/documents/contracts/generate/${client.id}`;

      const method = existingContract ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          content,
          amount,
          vatRate,
          vatAmount,
          totalAmount,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save contract");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/contracts"] });
      toast({
        title: existingContract ? "Contrat mis \u00e0 jour" : "Contrat cr\u00e9\u00e9",
        description: "Le contrat a \u00e9t\u00e9 enregistr\u00e9 avec succ\u00e8s.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le contrat.",
        variant: "destructive",
      });
    },
  });

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Add content as text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(content, maxWidth);
    let yPos = margin;

    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // Check for headers (all caps lines)
      if (line.match(/^[A-Z\u00c0-\u00dF\s\-]+$/) && line.trim().length > 3) {
        doc.setFont("helvetica", "bold");
      } else if (line.startsWith("ARTICLE")) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      doc.text(line, margin, yPos);
      yPos += 5;
    });

    // Footer
    if (companySettings?.contractFooter) {
      const lastPage = doc.internal.pages.length - 1;
      doc.setPage(lastPage);
      doc.setFontSize(8);
      doc.text(companySettings.contractFooter, pageWidth / 2, pageHeight - 10, { align: "center", maxWidth: maxWidth });
    }

    // Save
    doc.save(`contrat_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF g\u00e9n\u00e9r\u00e9",
      description: "Le contrat a \u00e9t\u00e9 t\u00e9l\u00e9charg\u00e9.",
    });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {existingContract ? "Modifier le contrat" : "G\u00e9n\u00e9rer un contrat"}
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

          {/* Contract details */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du contrat</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contrat - ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Montant HT (\u20ac)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={(amount / 100).toFixed(2)}
                  onChange={(e) => setAmount(Math.round(parseFloat(e.target.value) * 100) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de d\u00e9but</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">Taux TVA (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description de la prestation</Label>
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

          {/* Totals */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Montant HT</p>
                  <p className="text-lg font-semibold">{(amount / 100).toFixed(2)} \u20ac</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA ({vatRate}%)</p>
                  <p className="text-lg font-semibold">{(vatAmount / 100).toFixed(2)} \u20ac</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total TTC</p>
                  <p className="text-xl font-bold">{(totalAmount / 100).toFixed(2)} \u20ac</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Contract content */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Contenu du contrat</h3>
              <Button variant="outline" onClick={generateContent}>
                <Wand2 className="h-4 w-4 mr-2" />
                G\u00e9n\u00e9rer automatiquement
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="edit">
                  <FileText className="h-4 w-4 mr-2" />
                  \u00c9dition
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Aper\u00e7u
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenu du contrat... Cliquez sur 'G\u00e9n\u00e9rer automatiquement' pour pr\u00e9remplir."
                  rows={20}
                  className="font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {content || "Aucun contenu. Cliquez sur 'G\u00e9n\u00e9rer automatiquement' pour cr\u00e9er le contrat."}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="outline" onClick={generatePDF} disabled={!content}>
            <Download className="h-4 w-4 mr-2" />
            T\u00e9l\u00e9charger PDF
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {existingContract ? "Mettre \u00e0 jour" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
