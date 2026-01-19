import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  Edit,
  Plus,
  Trash2,
  BookOpen,
  Save,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
  AlertCircle,
  MinusCircle,
  ListTodo,
  MessageSquare,
  Check,
  Square,
  CheckSquare,
  FileText,
  Upload,
  Download,
  Info,
  Users,
  Star,
  UserPlus,
  Link2,
  RefreshCw,
  Copy,
  ExternalLink,
  Zap,
  ChevronDown,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import {
  useMission,
  useUpdateMission,
  useUpdateMissionStatus,
  useClients,
  useTrainers,
  usePrograms,
  useMissionSteps,
  useCreateMissionStep,
  useUpdateMissionStep,
  useDeleteMissionStep,
  useMissionDocuments,
  useCreateDocument,
  useDeleteDocument,
  useUploadDocument,
  useUpdateDocument,
  useMissionTrainers,
  useAddTrainerToMission,
  useRemoveTrainerFromMission,
  useSetMissionPrimaryTrainer,
  useAssignMultipleTrainers,
  useChildMissions,
  useParentMission,
  useSyncMissionChildren,
  useMissionParticipants,
  useUpdateMissionParticipant,
} from "@/hooks/use-missions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MissionStatus } from "@shared/schema";

// Calcule le statut de mission basé sur la progression des tâches
function getMissionStatusFromProgress(progressPercent: number, currentStatus: MissionStatus): MissionStatus {
  // Ne jamais changer automatiquement un statut "cancelled"
  if (currentStatus === "cancelled") return "cancelled";

  if (progressPercent === 0) {
    // Si pas encore de progression, garder draft ou confirmed
    return currentStatus === "in_progress" ? "confirmed" : currentStatus;
  } else if (progressPercent === 100) {
    return "completed";
  } else {
    return "in_progress";
  }
}

// Badge de statut avec couleur dynamique basée sur la progression
function getStatusBadgeWithProgress(status: MissionStatus, progressPercent: number) {
  // Configuration des couleurs basées sur la progression
  const getProgressColor = (percent: number) => {
    if (percent === 0) return "bg-slate-100 text-slate-700 border-slate-300";
    if (percent < 25) return "bg-red-100 text-red-700 border-red-300";
    if (percent < 50) return "bg-orange-100 text-orange-700 border-orange-300";
    if (percent < 75) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (percent < 100) return "bg-lime-100 text-lime-700 border-lime-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const labels: Record<MissionStatus, string> = {
    draft: "Brouillon",
    confirmed: "Confirmée",
    in_progress: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  };

  // Couleurs spéciales pour cancelled et draft
  if (status === "cancelled") {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-300">
        {labels[status]}
      </Badge>
    );
  }

  if (status === "draft") {
    return (
      <Badge className="bg-slate-100 text-slate-600 border border-slate-300">
        {labels[status]}
      </Badge>
    );
  }

  // Pour les autres statuts, utiliser la couleur basée sur la progression
  const colorClass = getProgressColor(progressPercent);
  const label = progressPercent === 100 ? "Terminée" :
                progressPercent > 0 ? `En cours (${progressPercent}%)` :
                labels[status];

  return (
    <Badge className={`${colorClass} border`}>
      {label}
    </Badge>
  );
}

function getStatusBadge(status: MissionStatus) {
  const styles: Record<MissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Brouillon", variant: "outline" },
    confirmed: { label: "Confirmée", variant: "secondary" },
    in_progress: { label: "En cours", variant: "default" },
    completed: { label: "Terminée", variant: "secondary" },
    cancelled: { label: "Annulée", variant: "destructive" },
  };
  const { label, variant } = styles[status] || styles.draft;
  return <Badge variant={variant}>{label}</Badge>;
}

// Configuration des statuts d'étapes
type StepStatus = 'todo' | 'priority' | 'late' | 'done' | 'na';

const stepStatusConfig: Record<StepStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  todo: {
    label: "A faire",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: <Circle className="w-5 h-5 text-slate-400" />,
  },
  priority: {
    label: "Prioritaire",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
  late: {
    label: "En retard",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  },
  done: {
    label: "Terminé",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  },
  na: {
    label: "Sans objet",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: <MinusCircle className="w-5 h-5 text-gray-400" />,
  },
};

function getAutoStatus(task: any): StepStatus {
  if (task.isCompleted) return 'done';
  if (task.status === 'na') return 'na';
  if (!task.dueDate) return 'todo';

  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'late';
  if (diffDays <= 3) return 'priority';
  return 'todo';
}

interface TaskItemProps {
  task: any;
  missionId: number;
  isAdmin: boolean;
  users: any[];
  currentUserId: string;
  onUpdate: (taskId: number, data: any) => void;
  onDelete: (taskId: number) => void;
}

function TaskItem({ task, missionId, isAdmin, users, currentUserId, onUpdate, onDelete }: TaskItemProps) {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [comment, setComment] = useState(task.comment || "");
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadline, setDeadline] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);

  const autoStatus = getAutoStatus(task);
  const config = stepStatusConfig[autoStatus] || stepStatusConfig.todo;
  const assignee = users?.find((u: any) => u.id === task.assigneeId);
  const commentAuthor = users?.find((u: any) => u.id === task.commentAuthorId);

  const handleToggleComplete = () => {
    onUpdate(task.id, { isCompleted: !task.isCompleted });
  };

  const handleSaveComment = () => {
    onUpdate(task.id, {
      comment: comment || null,
      commentAuthorId: comment ? currentUserId : null,
    });
    setIsEditingComment(false);
  };

  const handleSaveDeadline = () => {
    onUpdate(task.id, { dueDate: deadline || null });
    setIsEditingDeadline(false);
  };

  const handleSaveAssignee = (assigneeId: string) => {
    onUpdate(task.id, { assigneeId: assigneeId || null });
    setIsEditingAssignee(false);
  };

  const handleMarkNA = () => {
    onUpdate(task.id, { status: task.status === 'na' ? 'todo' : 'na' });
  };

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleComplete}
            className="mt-0.5 flex-shrink-0"
            disabled={task.status === 'na'}
          >
            {task.isCompleted ? (
              <CheckSquare className="w-5 h-5 text-green-600" />
            ) : (
              <Square className={`w-5 h-5 ${task.status === 'na' ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {config.icon}
              <h4 className={`font-medium ${task.isCompleted ? 'line-through text-green-700' : config.color}`}>
                {task.title}
              </h4>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              {isEditingAssignee ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={task.assigneeId || "unassigned"}
                    onValueChange={(value) => handleSaveAssignee(value === "unassigned" ? "" : value)}
                  >
                    <SelectTrigger className="w-40 h-8 text-sm">
                      <SelectValue placeholder="Assigner à..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingAssignee(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAssignee(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <User className="w-4 h-4" />
                  {assignee ? (
                    <span className="font-medium text-foreground">{assignee.firstName}</span>
                  ) : (
                    <span className="italic">Assigner</span>
                  )}
                </button>
              )}

              {isEditingDeadline ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-40 h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveDeadline}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDeadline(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingDeadline(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Calendar className="w-4 h-4" />
                  {task.dueDate ? (
                    <span className={autoStatus === 'late' ? 'text-red-600 font-medium' : ''}>
                      {format(new Date(task.dueDate), "d MMM yyyy", { locale: fr })}
                    </span>
                  ) : (
                    <span className="italic">Deadline</span>
                  )}
                </button>
              )}
            </div>

            {task.comment && !isEditingComment && (
              <div className="mt-3 bg-white/50 p-3 rounded-lg border border-gray-100">
                <RichTextDisplay content={task.comment} className="text-sm" />
                {commentAuthor && (
                  <p className="text-xs text-muted-foreground mt-2">
                    — {commentAuthor.firstName} {commentAuthor.lastName}
                    {task.commentUpdatedAt && (
                      <span className="ml-1">
                        le {format(new Date(task.commentUpdatedAt), "d MMM yyyy", { locale: fr })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
            {isEditingComment && (
              <div className="mt-3 space-y-2">
                <RichTextEditor
                  value={comment}
                  onChange={setComment}
                  placeholder="Ajouter un commentaire..."
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingComment(false)}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSaveComment}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditingComment(!isEditingComment)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-white/50"
              title="Commentaire"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={handleMarkNA}
              className={`p-1.5 rounded hover:bg-white/50 ${task.status === 'na' ? 'text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Marquer sans objet"
            >
              <MinusCircle className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-white/50"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MissionDetail() {
  const params = useParams<{ id: string }>();
  const missionId = parseInt(params.id || "0");

  const { user } = useAuth();
  const { data: mission, isLoading } = useMission(missionId);
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: programs } = usePrograms();
  const { data: steps } = useMissionSteps(missionId);
  const { data: documents } = useMissionDocuments(missionId);
  const { data: allUsers } = useUsers();
  const updateMission = useUpdateMission();
  const updateMissionStatus = useUpdateMissionStatus();
  const createStep = useCreateMissionStep();
  const updateStep = useUpdateMissionStep();
  const deleteStep = useDeleteMissionStep();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const uploadDocument = useUploadDocument();
  const updateDocument = useUpdateDocument();

  // Mission Trainers
  const { data: missionTrainers } = useMissionTrainers(missionId);
  const addTrainer = useAddTrainerToMission();
  const removeTrainer = useRemoveTrainerFromMission();
  const setPrimaryTrainer = useSetMissionPrimaryTrainer();

  // Multi-trainer assignment (sans duplication)
  const assignMultipleTrainers = useAssignMultipleTrainers();
  const { data: childMissions } = useChildMissions(missionId);
  const { data: parentMission } = useParentMission(missionId, !!mission?.parentMissionId);
  const syncChildren = useSyncMissionChildren();

  // Participants et suivi des documents
  const { data: missionParticipants } = useMissionParticipants(missionId);
  const updateMissionParticipant = useUpdateMissionParticipant();

  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [isAddingTrainer, setIsAddingTrainer] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState("");
  const [isAddingCustomAction, setIsAddingCustomAction] = useState(false);
  const [newCustomAction, setNewCustomAction] = useState("");
  const [customActions, setCustomActions] = useState<string[]>(() => {
    const saved = localStorage.getItem("customQuickActions");
    return saved ? JSON.parse(saved) : [];
  });
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    reference: "",
    description: "",
    status: "",
    typology: "",
    clientId: "",
    programId: "",
    startDate: "",
    endDate: "",
    location: "",
    locationType: "",
    totalHours: "",
  });

  const isAdmin = user?.role === "admin";

  const client = clients?.find((c: any) => c.id === mission?.clientId);
  const trainer = trainers?.find((t: any) => t.id === mission?.trainerId);
  const program = programs?.find((p: any) => p.id === mission?.programId);

  // Calculer la progression des tâches
  const totalTasks = steps?.length || 0;
  const completedTasks = steps?.filter((s: any) => s.isCompleted).length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mettre à jour automatiquement le statut de la mission en fonction de la progression
  useEffect(() => {
    if (!mission || !steps || mission.status === "cancelled") return;

    const expectedStatus = getMissionStatusFromProgress(progressPercent, mission.status as MissionStatus);

    // Seulement mettre à jour si le statut doit changer
    if (expectedStatus !== mission.status) {
      updateMissionStatus.mutate({ id: missionId, status: expectedStatus });
    }
  }, [progressPercent, mission?.status, missionId, steps]);

  const startEdit = () => {
    if (mission) {
      setEditForm({
        title: mission.title || "",
        reference: mission.reference || "",
        description: mission.description || "",
        status: mission.status || "draft",
        typology: mission.typology || "",
        clientId: mission.clientId?.toString() || "",
        programId: mission.programId?.toString() || "",
        startDate: mission.startDate ? format(new Date(mission.startDate), "yyyy-MM-dd") : "",
        endDate: mission.endDate ? format(new Date(mission.endDate), "yyyy-MM-dd") : "",
        location: mission.location || "",
        locationType: mission.locationType || "presentiel",
        totalHours: mission.totalHours?.toString() || "",
      });
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveChanges = async () => {
    try {
      await updateMission.mutateAsync({
        id: missionId,
        data: {
          title: editForm.title,
          reference: editForm.reference || null,
          description: editForm.description || null,
          status: editForm.status,
          typology: editForm.typology,
          clientId: editForm.clientId ? parseInt(editForm.clientId) : null,
          programId: editForm.programId ? parseInt(editForm.programId) : null,
          startDate: editForm.startDate ? new Date(editForm.startDate) : null,
          endDate: editForm.endDate ? new Date(editForm.endDate) : null,
          location: editForm.location || null,
          locationType: editForm.locationType || "presentiel",
          totalHours: editForm.totalHours ? parseInt(editForm.totalHours) : null,
        } as any,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update mission:", error);
    }
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;
    try {
      const maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      await createStep.mutateAsync({
        missionId,
        data: {
          title: newStepTitle.trim(),
          status: "todo",
          order: maxOrder + 1,
        },
      });
      setNewStepTitle("");
      setIsAddingStep(false);
    } catch (error) {
      console.error("Failed to create step:", error);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      await deleteStep.mutateAsync({ missionId, stepId });
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  // Actions rapides prédéfinies avec couleurs
  const quickActions = [
    {
      category: "Avant la formation",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      actions: [
        "Envoyer la convocation",
        "Envoyer le questionnaire de positionnement",
        "Valider le programme avec le client",
        "Réserver la salle",
        "Préparer les supports de formation",
        "Envoyer les consignes au formateur",
      ]
    },
    {
      category: "Pendant la formation",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      actions: [
        "Vérifier les émargements",
        "Suivre le bon déroulement",
      ]
    },
    {
      category: "Après la formation",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      actions: [
        "Envoyer le questionnaire de satisfaction",
        "Récupérer les émargements signés",
        "Faire le bilan avec le formateur",
        "Envoyer les attestations",
        "Envoyer le compte-rendu au client",
        "Facturer la mission",
      ]
    },
  ];

  // Gestion des actions personnalisées
  const handleAddCustomAction = () => {
    if (!newCustomAction.trim()) return;
    const updated = [...customActions, newCustomAction.trim()];
    setCustomActions(updated);
    localStorage.setItem("customQuickActions", JSON.stringify(updated));
    setNewCustomAction("");
    setIsAddingCustomAction(false);
  };

  const handleDeleteCustomAction = (actionToDelete: string) => {
    const updated = customActions.filter(a => a !== actionToDelete);
    setCustomActions(updated);
    localStorage.setItem("customQuickActions", JSON.stringify(updated));
  };

  const handleAddQuickAction = async (actionTitle: string) => {
    try {
      const maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      await createStep.mutateAsync({
        missionId,
        data: {
          title: actionTitle,
          status: "todo",
          order: maxOrder + 1,
        },
      });
    } catch (error) {
      console.error("Failed to create quick action:", error);
    }
  };

  const handleAddAllQuickActions = async (category: string) => {
    const categoryData = quickActions.find(c => c.category === category);
    if (!categoryData) return;

    let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;

    for (const action of categoryData.actions) {
      try {
        await createStep.mutateAsync({
          missionId,
          data: {
            title: action,
            status: "todo",
            order: ++maxOrder,
          },
        });
      } catch (error) {
        console.error("Failed to create quick action:", error);
      }
    }
  };

  const handleUpdateTask = async (taskId: number, data: any) => {
    try {
      await updateStep.mutateAsync({
        missionId,
        stepId: taskId,
        data,
      });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Types de documents disponibles
  const documentTypes = [
    'Programme',
    'Séquençage',
    'Compte rendu',
    'Livret et annexes',
    'Contrat',
    'Questionnaire préparation',
    'Questionnaire positionnement',
    'Questionnaire satisfaction',
    'Bilan de formation',
    'Synthèse des évaluations',
    'Feuilles de présence / émargements',
    'Factures',
    'Autres documents'
  ];

  const handleAddDocument = async () => {
    if (!newDocumentType) return;
    try {
      await createDocument.mutateAsync({
        missionId,
        data: {
          title: newDocumentType,
          type: newDocumentType,
          url: '', // Empty initially, will be filled when file is uploaded
        },
      });
      setNewDocumentType("");
      setIsAddingDocument(false);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    try {
      await deleteDocument.mutateAsync({ id: documentId, missionId });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleUploadFile = async (documentId: number, file: File) => {
    try {
      await uploadDocument.mutateAsync({ id: documentId, file, missionId });
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const handleStartEditDocTitle = (doc: any) => {
    setEditingDocId(doc.id);
    setEditDocTitle(doc.title);
  };

  const handleSaveDocTitle = async (documentId: number) => {
    if (!editDocTitle.trim()) return;
    try {
      await updateDocument.mutateAsync({
        id: documentId,
        data: { title: editDocTitle },
        missionId,
      });
      setEditingDocId(null);
      setEditDocTitle("");
    } catch (error) {
      console.error("Failed to update document title:", error);
    }
  };

  const handleCancelEditDocTitle = () => {
    setEditingDocId(null);
    setEditDocTitle("");
  };

  // Handlers pour les formateurs
  const handleAddTrainer = async () => {
    if (!selectedTrainerId) return;
    try {
      await addTrainer.mutateAsync({
        missionId,
        trainerId: selectedTrainerId,
        isPrimary: !missionTrainers || missionTrainers.length === 0, // Premier formateur = principal
      });
      setSelectedTrainerId("");
      setIsAddingTrainer(false);
    } catch (error) {
      console.error("Failed to add trainer:", error);
    }
  };

  const handleRemoveTrainer = async (trainerId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce formateur ?")) return;
    try {
      await removeTrainer.mutateAsync({ missionId, trainerId });
    } catch (error) {
      console.error("Failed to remove trainer:", error);
    }
  };

  const handleSetPrimaryTrainer = async (trainerId: string) => {
    try {
      await setPrimaryTrainer.mutateAsync({ missionId, trainerId });
    } catch (error) {
      console.error("Failed to set primary trainer:", error);
    }
  };

  // Liste des formateurs disponibles (pas encore assignés à la mission et actifs)
  const availableTrainers = trainers?.filter(
    (t: any) => t.isActive !== false && !missionTrainers?.some((mt: any) => mt.trainerId === t.id)
  ) || [];

  // Liste des formateurs de la mission pour l'assignation des tâches
  const missionTrainerUsers = missionTrainers?.map((mt: any) => mt.trainer) || [];

  // Handlers pour la duplication multi-formateurs
  const handleToggleTrainerSelection = (trainerId: string) => {
    setSelectedTrainerIds(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  const handleAssignTrainers = async () => {
    if (selectedTrainerIds.length === 0) return;
    try {
      await assignMultipleTrainers.mutateAsync({
        missionId,
        trainerIds: selectedTrainerIds,
      });
      setSelectedTrainerIds([]);
      setIsDuplicateDialogOpen(false);
    } catch (error) {
      console.error("Failed to assign trainers:", error);
    }
  };

  const handleSyncChildren = async () => {
    try {
      await syncChildren.mutateAsync({ missionId });
    } catch (error) {
      console.error("Failed to sync children:", error);
    }
  };

  // Formateurs disponibles pour l'assignation (exclut ceux déjà assignés via missionTrainers)
  const trainersForAssignment = trainers?.filter((t: any) => {
    if (t.status !== 'ACTIF') return false;
    // Exclure les formateurs déjà assignés à cette mission via missionTrainers
    const isAlreadyAssigned = missionTrainers?.some((mt: any) => mt.trainerId === t.id);
    // Exclure aussi le formateur principal (trainerId de la mission)
    const isMainTrainer = mission?.trainerId === t.id;
    return !isAlreadyAssigned && !isMainTrainer;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <Header title="Détail Mission" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <Header title="Mission non trouvée" />
          <div className="flex-1 p-6">
            <Link href="/missions">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux missions
              </Button>
            </Link>
            <div className="mt-8 text-center text-muted-foreground">
              Cette mission n'existe pas ou a été supprimée.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Détail Mission" />

        <div className="flex-1 p-6">
          {/* Back button and actions */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/missions">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux missions
              </Button>
            </Link>
            {isAdmin && !isEditing && (
              <div className="flex gap-2">
                {/* Bouton d'assignation multi-formateurs */}
                {mission.isOriginal !== false && (
                  <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assigner à plusieurs formateurs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Assigner à plusieurs formateurs</DialogTitle>
                        <DialogDescription>
                          Chaque formateur sélectionné sera assigné à cette mission et recevra par email les documents appropriés selon son statut. La mission apparaîtra dans leur espace formateur.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Sélectionnez les formateurs:
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {trainersForAssignment.length > 0 ? (
                            trainersForAssignment.map((trainer: any) => (
                              <div
                                key={trainer.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedTrainerIds.includes(trainer.id)
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => handleToggleTrainerSelection(trainer.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedTrainerIds.includes(trainer.id)}
                                    onCheckedChange={() => handleToggleTrainerSelection(trainer.id)}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {trainer.firstName} {trainer.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {trainer.role === 'formateur' ? 'Salarié' : 'Prestataire'}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {trainer.role === 'formateur' ? 'Consignes formateurs' : 'Cahier des charges'}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Aucun formateur disponible pour la duplication.
                            </p>
                          )}
                        </div>
                        {selectedTrainerIds.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {selectedTrainerIds.length} formateur(s) sélectionné(s)
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setSelectedTrainerIds([]);
                          setIsDuplicateDialogOpen(false);
                        }}>
                          Annuler
                        </Button>
                        <Button
                          onClick={handleAssignTrainers}
                          disabled={selectedTrainerIds.length === 0 || assignMultipleTrainers.isPending}
                        >
                          {assignMultipleTrainers.isPending
                            ? "Assignation en cours..."
                            : `Assigner ${selectedTrainerIds.length} formateur(s)`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {/* Bouton Actions rapides */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-violet-50 border-violet-300 hover:bg-violet-100">
                      <Zap className="w-4 h-4 mr-2 text-violet-600" />
                      <span className="text-violet-700">Actions rapides</span>
                      <ChevronDown className="w-4 h-4 ml-2 text-violet-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
                    {quickActions.map((category) => (
                      <div key={category.category}>
                        <DropdownMenuLabel className={`flex items-center justify-between ${category.bgColor} ${category.borderColor} border-b mx-1 rounded-t-md px-2 py-2 mt-1`}>
                          <span className={`font-semibold ${category.color}`}>{category.category}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 px-2 text-xs ${category.color} hover:${category.bgColor}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddAllQuickActions(category.category);
                            }}
                          >
                            Tout ajouter
                          </Button>
                        </DropdownMenuLabel>
                        {category.actions.map((action) => (
                          <DropdownMenuItem
                            key={action}
                            onClick={() => handleAddQuickAction(action)}
                            className="cursor-pointer mx-1 hover:bg-slate-100"
                          >
                            <Plus className={`w-4 h-4 mr-2 ${category.color}`} />
                            <span className="text-slate-700">{action}</span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-2" />
                      </div>
                    ))}

                    {/* Actions personnalisées */}
                    <div>
                      <DropdownMenuLabel className="flex items-center justify-between bg-purple-50 border-purple-200 border-b mx-1 rounded-t-md px-2 py-2 mt-1">
                        <span className="font-semibold text-purple-600 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          Mes actions personnalisées
                        </span>
                      </DropdownMenuLabel>
                      {customActions.length > 0 ? (
                        customActions.map((action) => (
                          <div key={action} className="flex items-center mx-1 group">
                            <DropdownMenuItem
                              onClick={() => handleAddQuickAction(action)}
                              className="cursor-pointer flex-1 hover:bg-slate-100"
                            >
                              <Plus className="w-4 h-4 mr-2 text-purple-600" />
                              <span className="text-slate-700">{action}</span>
                            </DropdownMenuItem>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteCustomAction(action);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground italic mx-1">
                          Aucune action personnalisée
                        </div>
                      )}
                      <DropdownMenuSeparator className="my-2" />
                      <div className="px-2 pb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsAddingCustomAction(true);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Ajouter une action personnalisée
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Dialog pour ajouter une action personnalisée */}
                <Dialog open={isAddingCustomAction} onOpenChange={setIsAddingCustomAction}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Nouvelle action personnalisée
                      </DialogTitle>
                      <DialogDescription>
                        Créez une action rapide qui sera disponible pour toutes vos missions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="customAction">Nom de l'action</Label>
                      <Input
                        id="customAction"
                        value={newCustomAction}
                        onChange={(e) => setNewCustomAction(e.target.value)}
                        placeholder="Ex: Envoyer le devis au client"
                        className="mt-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAction()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingCustomAction(false)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={handleAddCustomAction}
                        disabled={!newCustomAction.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={startEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={saveChanges} disabled={updateMission.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateMission.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            )}
          </div>

          {/* Layout à deux colonnes: principale (gauche) et sidebar (droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête Mission */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editForm.reference}
                            onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                            placeholder="Référence"
                            className="font-mono text-sm w-48"
                          />
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Titre de la mission"
                            className="text-2xl font-bold"
                          />
                        </div>
                      ) : (
                        <>
                          {mission.reference && (
                            <p className="text-sm text-muted-foreground font-mono mb-1">
                              {mission.reference}
                            </p>
                          )}
                          <h1 className="text-2xl font-bold">{mission.title}</h1>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Select
                            value={editForm.typology}
                            onValueChange={(value) => setEditForm({ ...editForm, typology: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Intra">Intra</SelectItem>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Conseil">Conseil</SelectItem>
                              <SelectItem value="Conference">Conférence</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.status}
                            onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Brouillon</SelectItem>
                              <SelectItem value="confirmed">Confirmée</SelectItem>
                              <SelectItem value="in_progress">En cours</SelectItem>
                              <SelectItem value="completed">Terminée</SelectItem>
                              <SelectItem value="cancelled">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          {mission.typology && <Badge>{mission.typology}</Badge>}
                          {getStatusBadgeWithProgress(mission.status as MissionStatus, progressPercent)}
                          {/* Case à cocher pour marquer comme terminée */}
                          {mission.status !== "cancelled" && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <Checkbox
                                checked={mission.status === "completed"}
                                onCheckedChange={(checked) => {
                                  const newStatus = checked ? "completed" : "in_progress";
                                  updateMissionStatus.mutate({ id: mission.id, status: newStatus });
                                }}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                Terminée
                              </span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description de la mission..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {mission.description || "Aucune description"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Barre de progression */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {completedTasks} / {totalTasks} tâches complétées
                      </span>
                      <span className={`font-medium ${
                        progressPercent === 100 ? 'text-green-600' :
                        progressPercent >= 75 ? 'text-lime-600' :
                        progressPercent >= 50 ? 'text-yellow-600' :
                        progressPercent >= 25 ? 'text-orange-600' :
                        progressPercent > 0 ? 'text-red-600' : 'text-slate-600'
                      }`}>{progressPercent}%</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progressPercent === 100 ? 'bg-green-500' :
                          progressPercent >= 75 ? 'bg-lime-500' :
                          progressPercent >= 50 ? 'bg-yellow-500' :
                          progressPercent >= 25 ? 'bg-orange-500' :
                          progressPercent > 0 ? 'bg-red-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Tâches */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ListTodo className="w-5 h-5" />
                        Tâches
                      </CardTitle>
                      <CardDescription>
                        Gestion des tâches avec suivi automatique des statuts
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <div>
                        {isAddingStep ? (
                          <div className="flex gap-2">
                            <Input
                              value={newStepTitle}
                              onChange={(e) => setNewStepTitle(e.target.value)}
                              placeholder="Titre de la tâche..."
                              className="w-64"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                            />
                            <Button size="sm" onClick={handleAddStep} disabled={createStep.isPending}>
                              Ajouter
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsAddingStep(false)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setIsAddingStep(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une tâche
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Résumé des statuts */}
                  {steps && steps.length > 0 && (
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                          <span>{steps.filter((s: any) => getAutoStatus(s) === 'todo').length} À faire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span>{steps.filter((s: any) => getAutoStatus(s) === 'priority').length} Prioritaire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>{steps.filter((s: any) => getAutoStatus(s) === 'late').length} En retard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>{steps.filter((s: any) => getAutoStatus(s) === 'done').length} Terminé</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          <span>{steps.filter((s: any) => getAutoStatus(s) === 'na').length} Sans objet</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {steps && steps.length > 0 ? (
                    <div className="relative">
                      {/* Ligne de connexion verticale du workflow */}
                      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-300 via-violet-400 to-violet-300" />

                      <div className="space-y-4">
                        {[...steps]
                          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                          .map((task: any, index: number) => (
                          <div key={task.id} className="relative flex gap-4">
                            {/* Numéro d'étape avec cercle */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                                task.isCompleted
                                  ? 'bg-green-500 text-white'
                                  : task.status === 'na'
                                  ? 'bg-gray-300 text-gray-600'
                                  : getAutoStatus(task) === 'late'
                                  ? 'bg-red-500 text-white'
                                  : getAutoStatus(task) === 'priority'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-violet-500 text-white'
                              }`}>
                                {task.isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                            </div>

                            {/* Contenu de la tâche */}
                            <div className="flex-1 pb-2">
                              <TaskItem
                                task={task}
                                missionId={missionId}
                                isAdmin={isAdmin}
                                users={missionTrainerUsers.length > 0 ? missionTrainerUsers : allUsers || []}
                                currentUserId={user?.id || ""}
                                onUpdate={handleUpdateTask}
                                onDelete={handleDeleteStep}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucune tâche définie. Ajoutez des tâches pour suivre l'avancement de la mission.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar droite (1/3) */}
            <div className="space-y-6">
              {/* Informations */}
              <Card className="border-violet-300 bg-gradient-to-br from-violet-50 to-violet-100/50 shadow-violet-100">
                <CardHeader className="border-b border-violet-200 bg-violet-100/50">
                  <CardTitle className="flex items-center gap-2 text-violet-800">
                    <Info className="w-5 h-5 text-violet-600" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="w-4 h-4" />
                      <span>Client</span>
                    </div>
                    {isEditing ? (
                      <Select
                        value={editForm.clientId}
                        onValueChange={(value) => setEditForm({ ...editForm, clientId: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{client?.name || "Non défini"}</p>
                    )}
                  </div>

                  {/* Formation */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Formation</span>
                    </div>
                    {isEditing ? (
                      <Select
                        value={editForm.programId}
                        onValueChange={(value) => setEditForm({ ...editForm, programId: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Sélectionner une formation" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs?.map((p: any) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{program?.title || "Non défini"}</p>
                    )}
                  </div>

                  {/* Formateurs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Formateurs</span>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          {mission?.typology?.toLowerCase().trim() === "intra" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsDuplicateDialogOpen(true)}
                              className="h-6 px-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                              title="Assigner à plusieurs formateurs"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              <span className="text-[10px]">Multi</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingTrainer(true)}
                            className="h-6 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Dialog pour ajouter un formateur */}
                    {isAddingTrainer && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg space-y-2">
                        <Select
                          value={selectedTrainerId}
                          onValueChange={setSelectedTrainerId}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Choisir un formateur" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTrainers.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.firstName} {t.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddTrainer} disabled={!selectedTrainerId || addTrainer.isPending}>
                            Ajouter
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingTrainer(false)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Liste des formateurs */}
                    {missionTrainers && missionTrainers.length > 0 ? (
                      <div className="space-y-2">
                        {missionTrainers.map((mt: any) => (
                          <div
                            key={mt.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              mt.isPrimary ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {mt.isPrimary && (
                                <Star className="w-3 h-3 text-primary fill-primary" />
                              )}
                              <span className="text-sm font-medium">
                                {mt.trainer.firstName} {mt.trainer.lastName}
                              </span>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                {!mt.isPrimary && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSetPrimaryTrainer(mt.trainerId)}
                                    className="h-6 px-1"
                                    title="Définir comme principal"
                                  >
                                    <Star className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveTrainer(mt.trainerId)}
                                  className="h-6 px-1 text-red-500 hover:text-red-700"
                                  title="Retirer"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun formateur assigné</p>
                    )}
                  </div>

                  {/* Dates */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Dates</span>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Début</Label>
                          <Input
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fin</Label>
                          <Input
                            type="date"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                            className="h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-sm">
                        {mission.startDate
                          ? format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })
                          : "Non défini"}
                        {mission.endDate && mission.startDate !== mission.endDate && (
                          <> - {format(new Date(mission.endDate), "d MMM yyyy", { locale: fr })}</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Lieu et modalité */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Lieu</span>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          placeholder="Adresse ou lien visio"
                          className="h-8"
                        />
                        <Select
                          value={editForm.locationType}
                          onValueChange={(value) => setEditForm({ ...editForm, locationType: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Modalité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="presentiel">Présentiel</SelectItem>
                            <SelectItem value="distanciel">Distanciel</SelectItem>
                            <SelectItem value="hybride">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        {mission.location ? (
                          <>
                            <p className="font-medium text-sm">{mission.location}</p>
                            <Badge variant="outline" className="mt-1">
                              {mission.locationType === "presentiel" && "Présentiel"}
                              {mission.locationType === "distanciel" && "Distanciel"}
                              {mission.locationType === "hybride" && "Hybride"}
                            </Badge>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Non défini</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Durée */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Durée</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editForm.totalHours}
                          onChange={(e) => setEditForm({ ...editForm, totalHours: e.target.value })}
                          placeholder="Heures"
                          className="h-8 w-20"
                        />
                        <span className="text-sm text-muted-foreground">heures</span>
                      </div>
                    ) : (
                      <p className="font-medium">
                        {mission.totalHours ? `${mission.totalHours} heures` : "Non défini"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents
                    </CardTitle>
                    {isAdmin && (
                      <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un document</DialogTitle>
                            <DialogDescription>
                              Sélectionnez le type de document à créer pour cette mission.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="docType">Type de document</Label>
                            <Select
                              value={newDocumentType}
                              onValueChange={setNewDocumentType}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choisir un type de document" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddingDocument(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleAddDocument} disabled={!newDocumentType || createDocument.isPending}>
                              {createDocument.isPending ? "Création..." : "Créer"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {documents && documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="border rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {/* Ligne principale: icône + titre + actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              {editingDocId === doc.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editDocTitle}
                                    onChange={(e) => setEditDocTitle(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveDocTitle(doc.id)}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEditDocTitle}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">{doc.title}</span>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleStartEditDocTitle(doc)}
                                      className="h-6 px-2"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Bouton télécharger */}
                              {doc.url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                                    <Download className="w-4 h-4 text-blue-600" />
                                  </a>
                                </Button>
                              )}

                              {/* Bouton upload */}
                              {isAdmin && (
                                <>
                                  <input
                                    type="file"
                                    id={`file-${doc.id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadFile(doc.id, file);
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                                    title={doc.url ? "Remplacer le fichier" : "Uploader un fichier"}
                                  >
                                    <Upload className="w-4 h-4 text-green-600" />
                                  </Button>
                                </>
                              )}

                              {/* Bouton supprimer */}
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Indicateur de statut du fichier */}
                          {uploadDocument.isPending && (
                            <div className="mt-2 text-xs text-blue-600">
                              Upload en cours...
                            </div>
                          )}
                          {!doc.url && !uploadDocument.isPending && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Aucun fichier uploadé
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm mb-4">
                        Aucun document créé pour cette mission.
                      </p>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddingDocument(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un document
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section Missions Liées */}
              {/* Afficher si c'est une mission originale avec des copies OU si c'est une copie */}
              {((mission.isOriginal !== false && childMissions && childMissions.length > 0) || mission.parentMissionId) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        Missions liées
                      </CardTitle>
                      {isAdmin && mission.isOriginal !== false && childMissions && childMissions.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSyncChildren}
                          disabled={syncChildren.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${syncChildren.isPending ? 'animate-spin' : ''}`} />
                          Synchroniser
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Indicateur si c'est une copie */}
                    {mission.parentMissionId && (
                      <Alert>
                        <Link2 className="w-4 h-4" />
                        <AlertDescription>
                          Cette mission est une copie de{' '}
                          <Link href={`/missions/${mission.parentMissionId}`} className="font-medium underline hover:text-primary">
                            {parentMission?.reference || `Mission #${mission.parentMissionId}`}
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Liste des copies (pour les missions originales) */}
                    {mission.isOriginal !== false && childMissions && childMissions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {childMissions.length} copie(s) de cette mission:
                        </p>
                        {childMissions.map((child: any) => {
                          const childTrainer = trainers?.find((t: any) => t.id === child.trainerId);
                          return (
                            <Link key={child.id} href={`/missions/${child.id}`}>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-sm font-medium">
                                      {childTrainer ? `${childTrainer.firstName} ${childTrainer.lastName}` : 'Formateur inconnu'}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {child.reference}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Copie
                                  </Badge>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Section Suivi des Documents Participants */}
              {missionParticipants && missionParticipants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Suivi des documents participants ({missionParticipants.length})
                    </CardTitle>
                    <CardDescription>
                      Suivez l'envoi et la réception des documents pour chaque participant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Participant</th>
                            <th className="text-center p-3 font-medium">
                              <div className="flex flex-col items-center">
                                <span>Quest. positionnement</span>
                                <span className="text-xs text-muted-foreground font-normal">Envoyé / Reçu</span>
                              </div>
                            </th>
                            <th className="text-center p-3 font-medium">
                              <div className="flex flex-col items-center">
                                <span>Évaluation</span>
                                <span className="text-xs text-muted-foreground font-normal">Envoyé / Reçu</span>
                              </div>
                            </th>
                            <th className="text-center p-3 font-medium">Convocation</th>
                            <th className="text-center p-3 font-medium">Certificat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missionParticipants.map((mp: any) => (
                            <tr key={mp.id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <div className="font-medium">
                                  {mp.participant?.firstName} {mp.participant?.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {mp.participant?.email}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Checkbox
                                    checked={!!mp.positioningQuestionnaireSentAt}
                                    onCheckedChange={(checked) => {
                                      updateMissionParticipant.mutate({
                                        missionId,
                                        participantId: mp.participantId,
                                        data: {
                                          positioningQuestionnaireSentAt: checked ? new Date().toISOString() : null
                                        }
                                      });
                                    }}
                                    className="data-[state=checked]:bg-blue-600"
                                    title="Envoyé"
                                  />
                                  <Checkbox
                                    checked={!!mp.positioningQuestionnaireReceivedAt}
                                    onCheckedChange={(checked) => {
                                      updateMissionParticipant.mutate({
                                        missionId,
                                        participantId: mp.participantId,
                                        data: {
                                          positioningQuestionnaireReceivedAt: checked ? new Date().toISOString() : null
                                        }
                                      });
                                    }}
                                    className="data-[state=checked]:bg-green-600"
                                    title="Reçu"
                                  />
                                </div>
                                {(mp.positioningQuestionnaireSentAt || mp.positioningQuestionnaireReceivedAt) && (
                                  <div className="text-xs text-center text-muted-foreground mt-1">
                                    {mp.positioningQuestionnaireSentAt && (
                                      <span className="text-blue-600">
                                        E: {format(new Date(mp.positioningQuestionnaireSentAt), "dd/MM")}
                                      </span>
                                    )}
                                    {mp.positioningQuestionnaireSentAt && mp.positioningQuestionnaireReceivedAt && " - "}
                                    {mp.positioningQuestionnaireReceivedAt && (
                                      <span className="text-green-600">
                                        R: {format(new Date(mp.positioningQuestionnaireReceivedAt), "dd/MM")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Checkbox
                                    checked={!!mp.evaluationSentAt}
                                    onCheckedChange={(checked) => {
                                      updateMissionParticipant.mutate({
                                        missionId,
                                        participantId: mp.participantId,
                                        data: {
                                          evaluationSentAt: checked ? new Date().toISOString() : null
                                        }
                                      });
                                    }}
                                    className="data-[state=checked]:bg-blue-600"
                                    title="Envoyé"
                                  />
                                  <Checkbox
                                    checked={!!mp.evaluationReceivedAt}
                                    onCheckedChange={(checked) => {
                                      updateMissionParticipant.mutate({
                                        missionId,
                                        participantId: mp.participantId,
                                        data: {
                                          evaluationReceivedAt: checked ? new Date().toISOString() : null
                                        }
                                      });
                                    }}
                                    className="data-[state=checked]:bg-green-600"
                                    title="Reçu"
                                  />
                                </div>
                                {(mp.evaluationSentAt || mp.evaluationReceivedAt) && (
                                  <div className="text-xs text-center text-muted-foreground mt-1">
                                    {mp.evaluationSentAt && (
                                      <span className="text-blue-600">
                                        E: {format(new Date(mp.evaluationSentAt), "dd/MM")}
                                      </span>
                                    )}
                                    {mp.evaluationSentAt && mp.evaluationReceivedAt && " - "}
                                    {mp.evaluationReceivedAt && (
                                      <span className="text-green-600">
                                        R: {format(new Date(mp.evaluationReceivedAt), "dd/MM")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Checkbox
                                  checked={!!mp.convocationSentAt}
                                  onCheckedChange={(checked) => {
                                    updateMissionParticipant.mutate({
                                      missionId,
                                      participantId: mp.participantId,
                                      data: {
                                        convocationSentAt: checked ? new Date().toISOString() : null
                                      }
                                    });
                                  }}
                                  className="data-[state=checked]:bg-green-600"
                                />
                                {mp.convocationSentAt && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(mp.convocationSentAt), "dd/MM/yy")}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Checkbox
                                  checked={!!mp.certificateGeneratedAt}
                                  onCheckedChange={(checked) => {
                                    updateMissionParticipant.mutate({
                                      missionId,
                                      participantId: mp.participantId,
                                      data: {
                                        certificateGeneratedAt: checked ? new Date().toISOString() : null
                                      }
                                    });
                                  }}
                                  className="data-[state=checked]:bg-green-600"
                                />
                                {mp.certificateGeneratedAt && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(mp.certificateGeneratedAt), "dd/MM/yy")}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-600"></div>
                        <span>Envoyé</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-600"></div>
                        <span>Reçu / Généré</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
