import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw, FileSpreadsheet, Calendar, HardDrive, ArrowLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExportFile {
  name: string;
  date: string;
  size: number;
  downloadUrl: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ExportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: exports, isLoading, refetch } = useQuery<ExportFile[]>({
    queryKey: ['/api/exports'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/exports/generate');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export généré",
        description: `Le fichier ${data.filename} a été créé avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer l'export",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await apiRequest('DELETE', `/api/exports/${encodeURIComponent(filename)}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Export supprimé",
        description: "Le fichier a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'export",
        variant: "destructive",
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/exports');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exports supprimés",
        description: data.message || "Tous les exports ont été supprimés.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer les exports",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exports Excel</h1>
          <p className="text-muted-foreground mt-1">
            Extraction automatique quotidienne des données de planification
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh-exports"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          {exports && exports.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tout supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer tous les exports ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement {exports.length} fichier(s) d'export.
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || generateMutation.isPending}
            data-testid="button-generate-export"
          >
            {isGenerating || generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Générer maintenant
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Fichiers d'export disponibles
          </CardTitle>
          <CardDescription>
            Les exports sont générés automatiquement chaque jour à 6h00 et conservés pendant 7 jours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : exports && exports.length > 0 ? (
            <div className="space-y-3">
              {exports.map((file, index) => (
                <div
                  key={file.name}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                  data-testid={`export-file-${index}`}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileSpreadsheet className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-filename-${index}`}>{file.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" data-testid={`text-date-${index}`}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(file.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                        <span className="flex items-center gap-1" data-testid={`text-size-${index}`}>
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 && (
                      <Badge variant="secondary">Dernier</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(file.downloadUrl)}
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet export ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le fichier "{file.name}" sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(file.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun export disponible
              </h3>
              <p className="text-muted-foreground mb-4">
                Cliquez sur "Générer maintenant" pour créer votre premier export.
              </p>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Générer un export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contenu de l'export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Onglet Missions</h4>
              <p className="text-sm text-muted-foreground">
                Toutes les missions avec leur statut, dates, formateur, client, nombre de participants et sessions.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Onglet Participants</h4>
              <p className="text-sm text-muted-foreground">
                Liste des participants par mission avec leurs informations et statut d'inscription.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Onglet Sessions</h4>
              <p className="text-sm text-muted-foreground">
                Détail des sessions de formation avec horaires, lieu et statistiques de présence.
              </p>
            </div>
            <div className="p-4 rounded-lg border md:col-span-2">
              <h4 className="font-medium mb-2">Onglet Statistiques</h4>
              <p className="text-sm text-muted-foreground">
                Résumé global : nombre de missions par statut, total participants, formateurs et clients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
