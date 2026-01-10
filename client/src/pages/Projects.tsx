import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useProjects, useCreateProject } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import type { InsertProject } from "@shared/schema";
import { useState } from "react";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      // userId would typically come from auth context
      userId: 1, 
    },
  });

  const onSubmit = (data: InsertProject) => {
    createProject.mutate(data, {
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
        <Header title="Mes Projets" />
        
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-display">Liste des projets</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau projet</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du projet</Label>
                    <Input id="title" {...form.register("title")} placeholder="Ex: Refonte site web" />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register("description")} placeholder="Détails du projet..." />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={createProject.isPending}>
                      {createProject.isPending ? "Création..." : "Créer le projet"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project) => (
                <div key={project.id} className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {project.status === 'active' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {project.description || "Aucune description fournie."}
                  </p>
                  <Button variant="outline" className="w-full hover:border-primary hover:text-primary">
                    Voir les détails
                  </Button>
                </div>
              ))}
              {projects?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                  <Folder className="w-12 h-12 mb-4 opacity-20" />
                  <p>Vous n'avez aucun projet pour le moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
