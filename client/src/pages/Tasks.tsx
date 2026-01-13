import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useTasks, useCreateTask, useProjects } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import type { InsertTask } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      status: "pending",
    },
  });

  const onSubmit = (data: InsertTask) => {
    createTask.mutate(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Mes Tâches" />
        
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-display">Liste des tâches</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Tâche
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une tâche</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de la tâche</Label>
                    <Input id="title" {...form.register("title")} placeholder="Ex: Rédaction contenu" />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Projet associé</Label>
                    <Select onValueChange={(val) => form.setValue("projectId", parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Date d'échéance</Label>
                    <Input 
                      id="dueDate" 
                      type="date" 
                      {...form.register("dueDate", { valueAsDate: true })} 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={createTask.isPending}>
                      {createTask.isPending ? "Création..." : "Ajouter la tâche"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/30 border-b border-border/50 grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Titre</div>
              <div className="col-span-3">Projet</div>
              <div className="col-span-2">Échéance</div>
              <div className="col-span-1">Statut</div>
            </div>
            
            <div className="divide-y divide-border/50">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Chargement...</div>
              ) : tasks?.map((task) => (
                <div key={task.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-1 flex justify-center">
                    <div className="w-5 h-5 rounded border border-border flex items-center justify-center text-transparent hover:text-primary cursor-pointer">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="col-span-5 font-medium">{task.title}</div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {projects?.find(p => p.id === task.projectId)?.name || "—"}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr }) : "—"}
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status === 'completed' ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                </div>
              ))}
              {tasks?.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  Aucune tâche trouvée. Créez-en une nouvelle !
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
