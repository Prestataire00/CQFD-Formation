import { useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
  useDeleteDocumentTemplate,
  useTemplateVersions,
} from "@/hooks/use-templates";
import { useClients } from "@/hooks/use-missions";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  History,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DocumentTemplate } from "@shared/schema";

// Types de documents disponibles pour les missions
const DOCUMENT_TYPES = [
  { value: "bilan_formation", label: "Bilan de formation" },
  { value: "bonnes_pratiques", label: "Bonnes pratiques (Prestataire)" },
  { value: "cahier_charges", label: "Cahier des charges (Prestataire)" },
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "consignes_formateurs", label: "Consignes formateurs (Salarié)" },
  { value: "contrat", label: "Contrat" },
  { value: "facture", label: "Facture" },
  { value: "feuille_presence", label: "Feuille de présence" },
  { value: "livret_annexes", label: "Livret et ses annexes" },
  { value: "programme", label: "Programme" },
  { value: "questionnaire_positionnement", label: "Questionnaire de positionnement" },
  { value: "questionnaire_preparation", label: "Questionnaire de préparation" },
  { value: "questionnaire_satisfaction", label: "Questionnaire de satisfaction" },
  { value: "sequencage", label: "Séquençage" },
  { value: "synthese_evaluations", label: "Synthèse des évaluations" },
  { value: "autre", label: "Autre" },
];

export default function DocumentTemplates() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useDocumentTemplates();
  const { data: clients } = useClients();
  const createTemplate = useCreateDocumentTemplate();
  const updateTemplate = useUpdateDocumentTemplate();
  const deleteTemplate = useDeleteDocumentTemplate();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"pdf" | "docx" | "image" | "unsupported">("unsupported");
  const [previewLoading, setPreviewLoading] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const openPreview = useCallback(async (url: string, title: string) => {
    setPreviewTitle(title);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewBlobUrl(null);

    const ext = url.split('.').pop()?.toLowerCase() || "";

    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();

      if (ext === "pdf") {
        setPreviewType("pdf");
        const blobUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(blobUrl);
      } else if (ext === "docx") {
        setPreviewType("docx");
        // Render after dialog is visible
        setTimeout(async () => {
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = "";
            const { renderAsync } = await import("docx-preview");
            await renderAsync(blob, docxContainerRef.current, undefined, {
              className: "docx-preview-wrapper",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
          }
        }, 100);
      } else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        setPreviewType("image");
        const blobUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(blobUrl);
      } else {
        setPreviewType("unsupported");
      }
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewType("unsupported");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const closePreview = useCallback(() => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewOpen(false);
    setPreviewBlobUrl(null);
    setPreviewTitle("");
    setPreviewType("unsupported");
  }, [previewBlobUrl]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    customType: "",
    forRole: "formateur",
    forTypology: "",
    description: "",
    clientId: "",
    changeNotes: "",
    depositDate: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "",
      customType: "",
      forRole: "formateur",
      forTypology: "",
      description: "",
      clientId: "",
      changeNotes: "",
      depositDate: "",
    });
    setSelectedFile(null);
  };

  const handleCreate = async () => {
    const effectiveType = formData.type === "autre" ? formData.customType : formData.type;

    if (!formData.title || !effectiveType || !formData.forRole) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "autre" && !formData.customType) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier le type de document",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("type", effectiveType);
    data.append("forRole", formData.forRole);
    if (formData.description) data.append("description", formData.description);
    if (formData.forTypology) data.append("forTypology", formData.forTypology);
    if (formData.clientId) data.append("clientId", formData.clientId);
    if (formData.depositDate) data.append("depositDate", formData.depositDate);
    if (selectedFile) data.append("file", selectedFile);

    try {
      await createTemplate.mutateAsync(data);
      toast({
        title: "Succès",
        description: "Document cree avec succes",
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la creation du document",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    const effectiveType = formData.type === "autre" ? formData.customType : formData.type;

    const data = new FormData();
    if (formData.title) data.append("title", formData.title);
    if (effectiveType) data.append("type", effectiveType);
    if (formData.forRole) data.append("forRole", formData.forRole);
    if (formData.description !== undefined) data.append("description", formData.description);
    if (formData.forTypology !== undefined) data.append("forTypology", formData.forTypology);
    if (formData.clientId !== undefined) data.append("clientId", formData.clientId);
    if (formData.depositDate) data.append("depositDate", formData.depositDate);
    if (formData.changeNotes) data.append("changeNotes", formData.changeNotes);
    if (selectedFile) data.append("file", selectedFile);

    try {
      await updateTemplate.mutateAsync({ id: selectedTemplate.id, data });
      toast({
        title: "Succès",
        description: "Document mis a jour avec succes",
      });
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise a jour du document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Etes-vous sur de vouloir supprimer ce document ?")) return;

    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: "Succès",
        description: "Document supprime avec succes",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du document",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    // Vérifier si le type est dans la liste prédéfinie
    const isPredefinedType = DOCUMENT_TYPES.some(dt => dt.value === template.type);
    setFormData({
      title: template.title,
      type: isPredefinedType ? template.type : "autre",
      customType: isPredefinedType ? "" : template.type,
      forRole: template.forRole,
      forTypology: (template as any).forTypology || "",
      description: template.description || "",
      clientId: template.clientId?.toString() || "",
      changeNotes: "",
      depositDate: (template as any).depositDate || "",
    });
    setShowEditDialog(true);
  };

  const openVersionDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowVersionDialog(true);
  };

  const toggleActive = async (template: DocumentTemplate) => {
    const data = new FormData();
    data.append("isActive", (!template.isActive).toString());

    try {
      await updateTemplate.mutateAsync({ id: template.id, data });
      toast({
        title: "Succès",
        description: `Document ${template.isActive ? "desactive" : "active"}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Documents" />

        <div className="flex-1 p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Documents</h1>
              <p className="text-muted-foreground mt-1">
                Gérez les documents pour les formateurs et prestataires
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau document
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date de dépôt</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Typologie</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {template.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {DOCUMENT_TYPES.find(dt => dt.value === template.type)?.label || template.type}
                      </TableCell>
                      <TableCell>
                        {(template as any).depositDate ? (
                          format(new Date((template as any).depositDate), "dd/MM/yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.forRole === "formateur" ? "Formateur" : "Prestataire"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(template as any).forTypology ? (
                          <Badge variant="secondary">{(template as any).forTypology}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Toutes</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.clientId ? (
                          <Badge variant="secondary">
                            {clients?.find((c: { id: number; name: string }) => c.id === template.clientId)?.name || "Client"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Global</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{template.version || 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(template)}
                          className="flex items-center gap-1"
                        >
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {template.url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Visualiser"
                                onClick={() => openPreview(template.url, template.title)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Telecharger"
                                onClick={() => window.open(template.url, "_blank")}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openVersionDialog(template)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
            <DialogDescription>
              Ajoutez un document pour les formateurs ou prestataires
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Consignes formateurs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de document *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, customType: value === "autre" ? formData.customType : "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  {DOCUMENT_TYPES.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value} className="focus:bg-violet-200">
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "autre" && (
              <div className="space-y-2">
                <Label htmlFor="customType">Précisez le type *</Label>
                <Input
                  id="customType"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Ex: Attestation de formation"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="depositDate">Date de dépôt</Label>
              <Input
                id="depositDate"
                type="date"
                value={formData.depositDate}
                onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forRole">Rôle *</Label>
              <Select
                value={formData.forRole}
                onValueChange={(value) => setFormData({ ...formData, forRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="formateur" className="focus:bg-violet-200">Formateur</SelectItem>
                  <SelectItem value="prestataire" className="focus:bg-violet-200">Prestataire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forTypology">Typologie</Label>
              <Select
                value={formData.forTypology || "_all_"}
                onValueChange={(value) => setFormData({ ...formData, forTypology: value === "_all_" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les typologies" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="_all_" className="focus:bg-violet-200">Toutes</SelectItem>
                  <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                  <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client (optionnel)</Label>
              <Select
                value={formData.clientId || "_global_"}
                onValueChange={(value) => setFormData({ ...formData, clientId: value === "_global_" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (tous les clients)" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="_global_" className="focus:bg-violet-200">Global</SelectItem>
                  {clients?.slice().sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", "fr")).map((client: { id: number; name: string }) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="focus:bg-violet-200">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du document"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createTemplate.isPending}>
              {createTemplate.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez les informations du document. Si vous modifiez le fichier, une nouvelle version sera creee.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Type de document</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, customType: value === "autre" ? formData.customType : "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  {DOCUMENT_TYPES.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value} className="focus:bg-violet-200">
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "autre" && (
              <div className="space-y-2">
                <Label htmlFor="edit-customType">Précisez le type</Label>
                <Input
                  id="edit-customType"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Ex: Attestation de formation"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-depositDate">Date de dépôt</Label>
              <Input
                id="edit-depositDate"
                type="date"
                value={formData.depositDate}
                onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-forRole">Rôle</Label>
              <Select
                value={formData.forRole}
                onValueChange={(value) => setFormData({ ...formData, forRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="formateur" className="focus:bg-violet-200">Formateur</SelectItem>
                  <SelectItem value="prestataire" className="focus:bg-violet-200">Prestataire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-forTypology">Typologie</Label>
              <Select
                value={formData.forTypology || "_all_"}
                onValueChange={(value) => setFormData({ ...formData, forTypology: value === "_all_" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les typologies" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="_all_" className="focus:bg-violet-200">Toutes</SelectItem>
                  <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                  <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-clientId">Client</Label>
              <Select
                value={formData.clientId || "_global_"}
                onValueChange={(value) => setFormData({ ...formData, clientId: value === "_global_" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (tous les clients)" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="_global_" className="focus:bg-violet-200">Global</SelectItem>
                  {clients?.slice().sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", "fr")).map((client: { id: number; name: string }) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="focus:bg-violet-200">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-file">Nouveau fichier (optionnel)</Label>
              <Input
                id="edit-file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Une nouvelle version sera créée avec ce fichier
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <Label htmlFor="changeNotes">Notes de changement</Label>
                <Textarea
                  id="changeNotes"
                  value={formData.changeNotes}
                  onChange={(e) => setFormData({ ...formData, changeNotes: e.target.value })}
                  placeholder="Décrivez les changements apportés"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      {selectedTemplate && (
        <VersionHistoryDialog
          templateId={selectedTemplate.id}
          open={showVersionDialog}
          onOpenChange={setShowVersionDialog}
        />
      )}

      {/* Document Preview Dialog - Landscape */}
      <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{previewTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tpl = templates?.find(t => t.title === previewTitle);
                  if (tpl?.url) window.open(tpl.url, "_blank");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Telecharger
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePreview}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto" style={{ height: "calc(90vh - 60px)" }}>
            {previewLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Chargement du document...</p>
                </div>
              </div>
            )}
            {!previewLoading && previewType === "pdf" && previewBlobUrl && (
              <iframe
                src={previewBlobUrl}
                className="w-full h-full border-0"
                title={previewTitle}
                style={{ minHeight: "100%" }}
              />
            )}
            {!previewLoading && previewType === "docx" && (
              <div
                ref={docxContainerRef}
                className="w-full h-full overflow-auto bg-white p-4"
                style={{ minHeight: "100%" }}
              />
            )}
            {!previewLoading && previewType === "image" && previewBlobUrl && (
              <div className="flex items-center justify-center h-full bg-gray-50 p-4">
                <img src={previewBlobUrl} alt={previewTitle} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            {!previewLoading && previewType === "unsupported" && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium">Apercu non disponible pour ce format</p>
                  <p className="text-muted-foreground">Téléchargez le fichier pour le consulter</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VersionHistoryDialog({
  templateId,
  open,
  onOpenChange,
}: {
  templateId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: versions } = useTemplateVersions(templateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historique des versions</DialogTitle>
          <DialogDescription>
            Consultez l'historique des versions de ce document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {versions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune version historique disponible
            </p>
          ) : (
            versions?.map((version: any) => (
              <div
                key={version.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge>v{version.version}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(version.createdAt), "PPP à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {version.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(version.url, "_blank")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  )}
                </div>
                {version.uploadedBy && (
                  <p className="text-sm text-muted-foreground">
                    Téléchargé par: {version.uploadedBy}
                  </p>
                )}
                {version.changeNotes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span> {version.changeNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
