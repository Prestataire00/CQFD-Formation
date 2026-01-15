import { useState } from "react";
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
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DocumentTemplate } from "@shared/schema";

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

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    forRole: "formateur",
    description: "",
    clientId: "",
    changeNotes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "",
      forRole: "formateur",
      description: "",
      clientId: "",
      changeNotes: "",
    });
    setSelectedFile(null);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.type || !formData.forRole) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("type", formData.type);
    data.append("forRole", formData.forRole);
    if (formData.description) data.append("description", formData.description);
    if (formData.clientId) data.append("clientId", formData.clientId);
    if (selectedFile) data.append("file", selectedFile);

    try {
      await createTemplate.mutateAsync(data);
      toast({
        title: "Succès",
        description: "Template créé avec succès",
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du template",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    const data = new FormData();
    if (formData.title) data.append("title", formData.title);
    if (formData.type) data.append("type", formData.type);
    if (formData.forRole) data.append("forRole", formData.forRole);
    if (formData.description !== undefined) data.append("description", formData.description);
    if (formData.clientId !== undefined) data.append("clientId", formData.clientId);
    if (formData.changeNotes) data.append("changeNotes", formData.changeNotes);
    if (selectedFile) data.append("file", selectedFile);

    try {
      await updateTemplate.mutateAsync({ id: selectedTemplate.id, data });
      toast({
        title: "Succès",
        description: "Template mis à jour avec succès",
      });
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: "Succès",
        description: "Template supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du template",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      type: template.type,
      forRole: template.forRole,
      description: template.description || "",
      clientId: template.clientId?.toString() || "",
      changeNotes: "",
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
        description: `Template ${template.isActive ? "désactivé" : "activé"}`,
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
        <Header title="Templates de documents" />

        <div className="flex-1 p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Templates de documents</h1>
              <p className="text-muted-foreground mt-1">
                Gérez les templates de documents pour les formateurs et prestataires
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau template
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
                    <TableHead>Rôle</TableHead>
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
                      <TableCell>{template.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.forRole === "formateur" ? "Formateur" : "Prestataire"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.clientId ? (
                          <Badge variant="secondary">
                            {clients?.find((c) => c.id === template.clientId)?.name || "Client"}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(template.url, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau template</DialogTitle>
            <DialogDescription>
              Créez un template de document pour les formateurs ou prestataires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
              <Label htmlFor="type">Type *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ex: consignes_formateurs"
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
                <SelectContent>
                  <SelectItem value="formateur">Formateur</SelectItem>
                  <SelectItem value="prestataire">Prestataire</SelectItem>
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
                <SelectContent>
                  <SelectItem value="_global_">Global</SelectItem>
                  {clients?.map((client: { id: number; name: string }) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
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
                placeholder="Description du template"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
            <DialogDescription>
              Modifiez les informations du template. Si vous modifiez le fichier, une nouvelle version sera créée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                <SelectContent>
                  <SelectItem value="formateur">Formateur</SelectItem>
                  <SelectItem value="prestataire">Prestataire</SelectItem>
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
                <SelectContent>
                  <SelectItem value="_global_">Global</SelectItem>
                  {clients?.map((client: { id: number; name: string }) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
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
            Consultez l'historique des versions de ce template
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
