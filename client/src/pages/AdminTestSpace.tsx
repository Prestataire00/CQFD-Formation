import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FlaskConical,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  UserCheck,
  Loader2,
  Trash2,
  DatabaseZap,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
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

interface TestDataStatus {
  hasTestData: boolean;
  counts: {
    trainers: number;
    clients: number;
    programs: number;
    missions: number;
    participants: number;
  };
}

interface SeedResult {
  success: boolean;
  results: {
    trainers: number;
    clients: number;
    programs: number;
    missions: number;
    participants: number;
    sessions: number;
    steps: number;
  };
}

export default function AdminTestSpace() {
  const { toast } = useToast();
  const [lastSeedResult, setLastSeedResult] = useState<SeedResult["results"] | null>(null);

  const { data: status, isLoading: statusLoading } = useQuery<TestDataStatus>({
    queryKey: ["/api/admin/test-data/status"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/test-data/seed");
      return res.json() as Promise<SeedResult>;
    },
    onSuccess: (data) => {
      setLastSeedResult(data.results);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/test-data/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Données de test créées",
        description: "Les données de démonstration ont été ajoutées avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer les données de test.",
        variant: "destructive",
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/test-data/clear");
      return res.json();
    },
    onSuccess: () => {
      setLastSeedResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/test-data/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Données de test supprimées",
        description: "Toutes les données de démonstration ont été nettoyées.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les données de test.",
        variant: "destructive",
      });
    },
  });

  const statCards = [
    { label: "Formateurs", count: status?.counts.trainers ?? 0, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Clients", count: status?.counts.clients ?? 0, icon: Building2, color: "text-green-600 dark:text-green-400" },
    { label: "Programmes", count: status?.counts.programs ?? 0, icon: GraduationCap, color: "text-purple-600 dark:text-purple-400" },
    { label: "Missions", count: status?.counts.missions ?? 0, icon: Briefcase, color: "text-orange-600 dark:text-orange-400" },
    { label: "Participants", count: status?.counts.participants ?? 0, icon: UserCheck, color: "text-cyan-600 dark:text-cyan-400" },
  ];

  const testAccounts = [
    { name: "Sophie Martin", email: "sophie.martin@test.cqfd.fr", role: "Formatrice", password: "test1234" },
    { name: "Pierre Dubois", email: "pierre.dubois@test.cqfd.fr", role: "Formateur", password: "test1234" },
    { name: "Marie Bernard", email: "marie.bernard@test.cqfd.fr", role: "Prestataire", password: "test1234" },
    { name: "Luc Petit", email: "luc.petit@test.cqfd.fr", role: "Prestataire", password: "test1234" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Espace de test Admin" />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                    Cet espace vous permet de remplir le logiciel avec des données réalistes pour tester toutes les fonctionnalités.
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Les données de test sont identifiées par le préfixe <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">[TEST]</code> et les emails <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">@test.cqfd.fr</code>, ce qui permet de les supprimer facilement sans toucher à vos vraies données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} data-testid={`stat-card-${stat.label.toLowerCase()}`}>
                <CardContent className="pt-4 pb-4 flex flex-col items-center">
                  <stat.icon className={`w-8 h-8 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold" data-testid={`stat-count-${stat.label.toLowerCase()}`}>{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseZap className="w-5 h-5" />
                  Générer les données de test
                </CardTitle>
                <CardDescription>
                  Crée un jeu complet de données pour explorer le CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Ce qui sera créé :</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>4 formateurs/prestataires avec comptes de connexion</li>
                    <li>6 clients (privés et publics, différents statuts)</li>
                    <li>5 programmes de formation</li>
                    <li>8 missions (brouillon, confirmée, en cours, terminée)</li>
                    <li>15 participants rattachés aux missions</li>
                    <li>Sessions de formation avec horaires</li>
                    <li>Étapes de suivi pré-configurées</li>
                  </ul>
                </div>

                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="w-full"
                  data-testid="button-seed-test-data"
                >
                  {seedMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Générer les données de test
                    </>
                  )}
                </Button>

                {lastSeedResult && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Données créées avec succès</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-green-700 dark:text-green-300">
                      <span>{lastSeedResult.trainers} formateurs</span>
                      <span>{lastSeedResult.clients} clients</span>
                      <span>{lastSeedResult.programs} programmes</span>
                      <span>{lastSeedResult.missions} missions</span>
                      <span>{lastSeedResult.participants} participants</span>
                      <span>{lastSeedResult.sessions} sessions</span>
                      <span>{lastSeedResult.steps} étapes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={status?.hasTestData ? "border-red-200 dark:border-red-800" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Nettoyer les données de test
                </CardTitle>
                <CardDescription>
                  Supprime uniquement les données de test, vos vraies données sont préservées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {status?.hasTestData ? (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Des données de test sont présentes</span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      La suppression retirera tous les éléments marqués [TEST] ainsi que les comptes @test.cqfd.fr
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 text-center">
                    Aucune donnée de test détectée
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!status?.hasTestData || clearMutation.isPending}
                      className="w-full"
                      data-testid="button-clear-test-data"
                    >
                      {clearMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Suppression en cours...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer les données de test
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action va supprimer toutes les données de test (missions, clients, formateurs, participants de test).
                        Vos données réelles ne seront pas affectées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearMutation.mutate()}
                        className="bg-destructive text-destructive-foreground"
                        data-testid="button-confirm-clear"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {status?.hasTestData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Comptes de test disponibles
                </CardTitle>
                <CardDescription>
                  Connectez-vous avec ces comptes pour tester l'interface formateur/prestataire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {testAccounts.map((account) => (
                    <div
                      key={account.email}
                      className="border rounded-lg p-3 space-y-1"
                      data-testid={`test-account-${account.email}`}
                    >
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate" data-testid={`text-email-${account.email}`}>
                          {account.email}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`text-password-${account.email}`}>
                          {account.password}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
