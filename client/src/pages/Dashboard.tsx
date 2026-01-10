import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { GridCard } from "@/components/DashboardGrid";
import { useStats, useProjects, useTasks, useInvoices, useDocuments, useMessages } from "@/hooks/use-dashboard";
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Target, 
  MoreHorizontal, 
  FileText, 
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats } = useStats();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: invoices } = useInvoices();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Portail Sous-traitant" />
        
        <div className="p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Projets Actifs" 
              value={stats?.activeProjects || 0} 
              icon={Briefcase}
              trend="+12%"
              trendUp={true}
            />
            <StatCard 
              label="Tâches en Cours" 
              value={stats?.tasksInProgress || 0} 
              icon={Clock}
            />
            <StatCard 
              label="Tâches Terminées" 
              value={stats?.completedTasks || 0} 
              icon={CheckCircle2}
              trend="+5%"
              trendUp={true}
            />
            <StatCard 
              label="Missions Totales" 
              value={stats?.missions || 0} 
              icon={Target}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Mes Projets */}
            <GridCard 
              title="Mes Projets" 
              actionLabel="Voir tous les projets" 
              actionLink="/projects"
            >
              <div className="space-y-4">
                {projects?.slice(0, 3).map((project) => (
                  <div key={project.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{project.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status === 'active' ? 'Actif' : 'Terminé'}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                {(!projects || projects.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Aucun projet actif</div>
                )}
              </div>
            </GridCard>

            {/* Mes Tâches */}
            <GridCard 
              title="Mes Tâches" 
              actionLabel="Voir toutes les tâches" 
              actionLink="/tasks"
            >
              <div className="space-y-3">
                {tasks?.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-2">
                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pour le {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                 {(!tasks || tasks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Aucune tâche en cours</div>
                )}
              </div>
            </GridCard>

            {/* Mes Factures */}
            <GridCard 
              title="Dernières Factures" 
              actionLabel="Gérer mes factures" 
              actionLink="/invoices"
            >
              <div className="space-y-4">
                {invoices?.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt || new Date()), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{(invoice.amount / 100).toFixed(2)} €</p>
                      <span className={`text-[10px] uppercase font-bold ${
                        invoice.status === 'paid' ? 'text-green-600' : 'text-orange-500'
                      }`}>
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Aucune facture récente</div>
                )}
              </div>
            </GridCard>

            {/* Messages - Placeholder for visual completeness */}
            <GridCard 
              title="Messages Récents" 
              actionLabel="Accéder à la messagerie" 
              actionLink="/messages"
            >
               <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-foreground">Aucun nouveau message</h4>
                <p className="text-sm text-muted-foreground mt-1">Vous êtes à jour dans vos communications.</p>
              </div>
            </GridCard>

             {/* Documents - Placeholder */}
             <GridCard 
              title="Documents Partagés" 
              actionLabel="Tous les documents" 
              actionLink="/documents"
            >
               <div className="space-y-2">
                 {[1, 2].map((i) => (
                   <div key={i} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                     <div className="w-8 h-8 rounded bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                       <span className="text-xs font-bold">PDF</span>
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Cahier des charges V{i}.0.pdf</p>
                       <p className="text-xs text-muted-foreground">Mis à jour il y a 2j</p>
                     </div>
                   </div>
                 ))}
               </div>
            </GridCard>

            {/* Quick Actions / Contrats */}
            <GridCard 
              title="Contrats & Accords" 
              actionLabel="Voir les contrats" 
              actionLink="/documents"
            >
              <div className="bg-gradient-to-br from-primary/10 to-purple-100/50 rounded-xl p-4 border border-primary/10">
                <h4 className="font-semibold text-primary mb-1">Contrat Cadre 2024</h4>
                <p className="text-sm text-muted-foreground mb-3">Validé le 15 Janvier 2024</p>
                <div className="w-full bg-background/50 rounded-full h-2 mb-1 overflow-hidden">
                  <div className="bg-green-500 w-full h-full" />
                </div>
                <p className="text-xs text-green-600 font-medium text-right">Signé électroniquement</p>
              </div>
            </GridCard>

          </div>
        </div>
      </main>
    </div>
  );
}
