import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Edit,
  Loader2,
  Search,
} from "lucide-react";

interface PersonalNote {
  id: number;
  userId: string;
  title: string;
  content: string | null;
  color: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const noteColors = [
  { value: "default", label: "Par defaut", bg: "bg-white", border: "border-gray-200" },
  { value: "yellow", label: "Jaune", bg: "bg-yellow-50", border: "border-yellow-200" },
  { value: "green", label: "Vert", bg: "bg-green-50", border: "border-green-200" },
  { value: "blue", label: "Bleu", bg: "bg-blue-50", border: "border-blue-200" },
  { value: "pink", label: "Rose", bg: "bg-pink-50", border: "border-pink-200" },
  { value: "purple", label: "Violet", bg: "bg-purple-50", border: "border-purple-200" },
];

export default function MyNotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    color: "default",
  });

  // Fetch personal notes
  const { data: personalNotes, isLoading } = useQuery<PersonalNote[]>({
    queryKey: ["personal-notes"],
    queryFn: async () => {
      const res = await fetch("/api/personal-notes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });

  // Create note mutation
  const createNote = useMutation({
    mutationFn: async (data: { title: string; content: string; color: string }) => {
      const res = await fetch("/api/personal-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      setIsNoteDialogOpen(false);
      setNoteForm({ title: "", content: "", color: "default" });
      toast({ title: "Note creee avec succes" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de creer la note", variant: "destructive" });
    },
  });

  // Update note mutation
  const updateNote = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PersonalNote> }) => {
      const res = await fetch(`/api/personal-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      setIsNoteDialogOpen(false);
      setEditingNote(null);
      setNoteForm({ title: "", content: "", color: "default" });
      toast({ title: "Note mise a jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre a jour", variant: "destructive" });
    },
  });

  // Delete note mutation
  const deleteNote = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/personal-notes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      toast({ title: "Note supprimee" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    },
  });

  // Toggle pin mutation
  const togglePin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      const res = await fetch(`/api/personal-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error("Failed to toggle pin");
      return res.json();
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: ["personal-notes"] });
      toast({ title: isPinned ? "Note epinglee" : "Note desepinglee" });
    },
  });

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setNoteForm({ title: "", content: "", color: "default" });
    setIsNoteDialogOpen(true);
  };

  const handleEditNote = (note: PersonalNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content || "",
      color: note.color || "default",
    });
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteForm.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est requis", variant: "destructive" });
      return;
    }

    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, data: noteForm });
    } else {
      createNote.mutate(noteForm);
    }
  };

  const getNoteColorClasses = (color: string | null) => {
    const colorConfig = noteColors.find((c) => c.value === color) || noteColors[0];
    return `${colorConfig.bg} ${colorConfig.border}`;
  };

  // Filter notes by search query
  const filteredNotes = personalNotes?.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      (note.content && note.content.toLowerCase().includes(query))
    );
  });

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes?.filter((note) => note.isPinned) || [];
  const unpinnedNotes = filteredNotes?.filter((note) => !note.isPinned) || [];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Mes notes" />

        <div className="flex-1 p-6 space-y-6">
          {/* Header actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-muted-foreground">
                Gerez vos notes personnelles. Ces notes sont privees et visibles uniquement par vous.
              </p>
            </div>
            <Button onClick={handleOpenNewNote}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle note
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans mes notes..."
              className="pl-10"
            />
          </div>

          {/* Notes content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotes && filteredNotes.length > 0 ? (
            <div className="space-y-6">
              {/* Pinned notes section */}
              {pinnedNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    Notes epinglees ({pinnedNotes.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={(id) => deleteNote.mutate(id)}
                        onTogglePin={(id, isPinned) => togglePin.mutate({ id, isPinned })}
                        getColorClasses={getNoteColorClasses}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other notes section */}
              {unpinnedNotes.length > 0 && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Autres notes ({unpinnedNotes.length})
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={(id) => deleteNote.mutate(id)}
                        onTogglePin={(id, isPinned) => togglePin.mutate({ id, isPinned })}
                        getColorClasses={getNoteColorClasses}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <StickyNote className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "Aucune note trouvee" : "Aucune note"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Essayez avec d'autres mots-cles"
                    : "Commencez par creer votre premiere note personnelle"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleOpenNewNote}>
                    <Plus className="w-4 h-4 mr-2" />
                    Creer ma premiere note
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Note Dialog */}
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? "Modifier la note" : "Nouvelle note"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="noteTitle">Titre *</Label>
                <Input
                  id="noteTitle"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="Titre de la note"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noteContent">Contenu</Label>
                <Textarea
                  id="noteContent"
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Ecrivez votre note ici..."
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-3 flex-wrap">
                  {noteColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNoteForm({ ...noteForm, color: color.value })}
                      className={`w-10 h-10 rounded-lg border-2 ${color.bg} ${
                        noteForm.color === color.value
                          ? "ring-2 ring-primary ring-offset-2"
                          : color.border
                      } transition-all hover:scale-105`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={createNote.isPending || updateNote.isPending}
              >
                {(createNote.isPending || updateNote.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingNote ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// Note Card component
function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  getColorClasses,
}: {
  note: PersonalNote;
  onEdit: (note: PersonalNote) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number, isPinned: boolean) => void;
  getColorClasses: (color: string | null) => string;
}) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 ${getColorClasses(note.color)} transition-all hover:shadow-lg group cursor-pointer`}
      onClick={() => onEdit(note)}
    >
      {note.isPinned && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold line-clamp-2">{note.title}</h4>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap min-h-[60px]">
        {note.content || "Aucun contenu"}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
        <p className="text-xs text-muted-foreground">
          {new Date(note.updatedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, !note.isPinned);
            }}
            className="p-1.5 hover:bg-black/5 rounded-lg"
            title={note.isPinned ? "Desepingler" : "Epingler"}
          >
            {note.isPinned ? (
              <PinOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Pin className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-1.5 hover:bg-black/5 rounded-lg"
            title="Modifier"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
