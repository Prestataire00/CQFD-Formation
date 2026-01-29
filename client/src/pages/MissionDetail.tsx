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
  FileText,
  Upload,
  Download,
  Info,
  Users,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ClipboardList,
  FolderOpen,
  TrendingUp,
  Square,
  CheckSquare,
  Zap,
} from "lucide-react";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
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
  useMissionTrainers,
  useAddTrainerToMission,
  useRemoveTrainerFromMission,
  useMissionParticipants,
  useParticipants,
  useAddParticipantToMission,
  useRemoveParticipantFromMission,
  useMissionSessions,
  useCreateMissionSession,
  useUpdateMissionSession,
  useDeleteMissionSession,
} from "@/hooks/use-missions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MissionStatus } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Step configuration
const STEPS = [
  { id: 1, label: "Informations", icon: Info, description: "Dates et details" },
  { id: 2, label: "Description", icon: ClipboardList, description: "Demande client" },
  { id: 3, label: "Taches", icon: ListTodo, description: "Etapes a realiser" },
  { id: 4, label: "Participants", icon: Users, description: "Stagiaires et documents" },
  { id: 5, label: "Progression", icon: TrendingUp, description: "Suivi et avancement" },
];

// Status badge helper
function getStatusBadge(status: MissionStatus) {
  const styles: Record<MissionStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-slate-100 text-slate-700" },
    confirmed: { label: "Confirmee", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "En cours", className: "bg-amber-100 text-amber-700" },
    completed: { label: "Terminee", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Annulee", className: "bg-red-100 text-red-700" },
  };
  const { label, className } = styles[status] || styles.draft;
  return <Badge className={className}>{label}</Badge>;
}

// Step status config
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
    label: "Termine",
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

// Calculate automatic status based on due date
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

// Quick actions predefined
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
      "Reserver la salle",
      "Preparer les supports de formation",
      "Envoyer les consignes au formateur",
    ]
  },
  {
    category: "Pendant la formation",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    actions: [
      "Verifier les emargements",
      "Suivre le bon deroulement",
    ]
  },
  {
    category: "Apres la formation",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    actions: [
      "Envoyer le questionnaire de satisfaction",
      "Recuperer les emargements signes",
      "Faire le bilan avec le formateur",
      "Envoyer les attestations",
      "Envoyer le compte-rendu au client",
      "Facturer la mission",
    ]
  },
];

// TaskItem component
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
                      <SelectValue placeholder="Assigner a..." />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-100 border-violet-300">
                      <SelectItem value="unassigned" className="focus:bg-violet-200">Non assigne</SelectItem>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id} className="focus:bg-violet-200">
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
  const { id } = useParams<{ id: string }>();
  const missionId = Number(id);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Current step state
  const [currentStep, setCurrentStep] = useState(1);

  // Edit states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Dialog states
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({ date: "", startTime: "09:00", endTime: "17:00" });

  // Data queries
  const { data: mission, isLoading } = useMission(missionId);
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: programs } = usePrograms();
  const { data: steps } = useMissionSteps(missionId);
  const { data: documents } = useMissionDocuments(missionId);
  const { data: missionTrainers } = useMissionTrainers(missionId);
  const { data: missionParticipants } = useMissionParticipants(missionId);
  const { data: allParticipants } = useParticipants();
  const { data: allUsers } = useUsers();
  const { data: missionSessions } = useMissionSessions(missionId);

  // Mutations
  const updateMission = useUpdateMission();
  const updateStatus = useUpdateMissionStatus();
  const createStep = useCreateMissionStep();
  const updateStep = useUpdateMissionStep();
  const deleteStep = useDeleteMissionStep();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const uploadDocument = useUploadDocument();
  const addTrainer = useAddTrainerToMission();
  const removeTrainer = useRemoveTrainerFromMission();
  const addParticipant = useAddParticipantToMission();
  const removeParticipant = useRemoveParticipantFromMission();
  const createSession = useCreateMissionSession();
  const updateSession = useUpdateMissionSession();
  const deleteSession = useDeleteMissionSession();

  // Initialize edit form when mission loads
  useEffect(() => {
    if (mission) {
      setEditForm({
        title: mission.title || "",
        reference: mission.reference || "",
        description: mission.description || "",
        startDate: mission.startDate ? format(new Date(mission.startDate), "yyyy-MM-dd") : "",
        endDate: mission.endDate ? format(new Date(mission.endDate), "yyyy-MM-dd") : "",
        location: mission.location || "",
        locationType: mission.locationType || "presentiel",
        totalHours: mission.totalHours || "",
        clientId: mission.clientId?.toString() || "",
        trainerId: mission.trainerId || "",
        programId: mission.programId?.toString() || "",
        programTitle: mission.programTitle || "",
      });
    }
  }, [mission]);

  // Calculate progress
  const completedSteps = steps?.filter((s: any) => s.status === "done" || s.isCompleted).length || 0;
  const totalSteps = steps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Get related data
  const client = clients?.find((c: any) => c.id === mission?.clientId);
  const trainer = trainers?.find((t: any) => t.id === mission?.trainerId);
  const program = programs?.find((p: any) => p.id === mission?.programId);

  // Handlers
  const handleSaveInfo = async () => {
    try {
      await updateMission.mutateAsync({
        id: missionId,
        data: {
          title: editForm.title,
          reference: editForm.reference,
          startDate: editForm.startDate ? new Date(editForm.startDate) : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate) : undefined,
          location: editForm.location,
          locationType: editForm.locationType,
          totalHours: editForm.totalHours ? Number(editForm.totalHours) : undefined,
          clientId: editForm.clientId ? Number(editForm.clientId) : undefined,
          trainerId: editForm.trainerId || undefined,
          programId: editForm.programId ? Number(editForm.programId) : undefined,
          programTitle: editForm.programTitle || undefined,
        },
      });
      setIsEditingInfo(false);
      toast({ title: "Informations mises a jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateMission.mutateAsync({
        id: missionId,
        data: { description: editForm.description },
      });
      setIsEditingDescription(false);
      toast({ title: "Description mise a jour" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
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
      setIsAddStepOpen(false);
      toast({ title: "Tache ajoutee" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
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
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      await deleteStep.mutateAsync({ missionId, stepId });
      toast({ title: "Tache supprimee" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
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
      toast({ title: "Tache ajoutee" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllQuickActions = async (category: string) => {
    const categoryData = quickActions.find(c => c.category === category);
    if (!categoryData) return;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const action of categoryData.actions) {
        maxOrder++;
        await createStep.mutateAsync({
          missionId,
          data: {
            title: action,
            status: "todo",
            order: maxOrder,
          },
        });
      }
      toast({ title: `${categoryData.actions.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddDocument = async () => {
    if (!newDocTitle.trim()) return;
    try {
      await createDocument.mutateAsync({
        missionId,
        data: {
          title: newDocTitle,
          type: newDocType || "Autre",
          url: "",
        },
      });
      setNewDocTitle("");
      setNewDocType("");
      setIsAddDocumentOpen(false);
      toast({ title: "Document ajoute" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleFileUpload = async (docId: number, file: File) => {
    try {
      await uploadDocument.mutateAsync({ id: docId, file, missionId });
      toast({ title: "Fichier televerse" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddParticipant = async (participantId: number) => {
    try {
      await addParticipant.mutateAsync({ missionId, participantId });
      toast({ title: "Participant ajoute" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    try {
      await removeParticipant.mutateAsync({ missionId, participantId });
      toast({ title: "Participant retire" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: MissionStatus) => {
    try {
      await updateStatus.mutateAsync({ id: missionId, status: newStatus });
      toast({ title: "Statut mis a jour" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddSession = async () => {
    if (!newSession.date) return;
    try {
      await createSession.mutateAsync({
        missionId,
        data: {
          sessionDate: newSession.date,
          startTime: newSession.startTime || undefined,
          endTime: newSession.endTime || undefined,
        },
      });
      setNewSession({ date: "", startTime: "09:00", endTime: "17:00" });
      setIsAddSessionOpen(false);
      toast({ title: "Jour de formation ajoute" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSession.mutateAsync({ missionId, sessionId });
      toast({ title: "Periode supprimee" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-2">Mission non trouvee</h2>
          <Link href="/missions">
            <Button variant="outline">Retour aux missions</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderInfoStep();
      case 2:
        return renderDescriptionStep();
      case 3:
        return renderTasksStep();
      case 4:
        return renderParticipantsStep();
      case 5:
        return renderProgressStep();
      default:
        return null;
    }
  };

  // Step 1: Information
  const renderInfoStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Informations de la mission</h2>
        {isAdmin && !isEditingInfo && (
          <Button variant="outline" onClick={() => setIsEditingInfo(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
        {isEditingInfo && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditingInfo(false)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveInfo} disabled={updateMission.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Jours de formation
              </CardTitle>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setIsAddSessionOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un jour
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {missionSessions && missionSessions.length > 0 ? (
              <div className="space-y-2">
                {missionSessions.map((session: any, index: number) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium">
                          {format(new Date(session.sessionDate), "EEEE dd MMMM yyyy", { locale: fr })}
                        </span>
                        {(session.startTime || session.endTime) && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {session.startTime || "?"} - {session.endTime || "?"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun jour de formation defini</p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => setIsAddSessionOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un jour
                  </Button>
                )}
              </div>
            )}

            {/* Résumé */}
            {missionSessions && missionSessions.length > 0 && (
              <div className="pt-3 border-t text-sm text-muted-foreground">
                <span className="font-medium">{missionSessions.length} jour(s) de formation</span>
              </div>
            )}

            {mission.totalHours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{mission.totalHours} heures au total</span>
              </div>
            )}

            {/* Dialog pour ajouter un jour */}
            <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un jour de formation</DialogTitle>
                  <DialogDescription>
                    Definissez la date et les horaires de ce jour de formation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Heure de debut</Label>
                      <Input
                        type="time"
                        value={newSession.startTime}
                        onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Heure de fin</Label>
                      <Input
                        type="time"
                        value={newSession.endTime}
                        onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSessionOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddSession} disabled={!newSession.date || createSession.isPending}>
                    {createSession.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lieu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingInfo ? (
              <>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editForm.locationType}
                    onValueChange={(value) => setEditForm({ ...editForm, locationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-100 border-violet-300">
                      <SelectItem value="presentiel" className="focus:bg-violet-200">Presentiel</SelectItem>
                      <SelectItem value="distanciel" className="focus:bg-violet-200">Distanciel</SelectItem>
                      <SelectItem value="hybride" className="focus:bg-violet-200">Hybride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Adresse du lieu"
                  />
                </div>
              </>
            ) : (
              <>
                <Badge variant="outline" className="capitalize">
                  {mission.locationType || "Presentiel"}
                </Badge>
                {mission.location && (
                  <p className="text-sm text-muted-foreground">{mission.location}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingInfo ? (
              <Select
                value={editForm.clientId}
                onValueChange={(value) => setEditForm({ ...editForm, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  {clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()} className="focus:bg-violet-200">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">{client?.name || "Non defini"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Formateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingInfo ? (
              <Select
                value={editForm.trainerId}
                onValueChange={(value) => setEditForm({ ...editForm, trainerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un formateur" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  {trainers?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id} className="focus:bg-violet-200">
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">
                {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Non assigne"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Programme de formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingInfo ? (
              <Input
                value={editForm.programTitle}
                onChange={(e) => setEditForm({ ...editForm, programTitle: e.target.value })}
                placeholder="Ex: Formation Excel avancee, Management d'equipe..."
              />
            ) : (
              <p className="font-medium">{mission?.programTitle || "Non defini"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 2: Description
  const renderDescriptionStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Description / Demande client</h2>
        {isAdmin && !isEditingDescription && (
          <Button variant="outline" onClick={() => setIsEditingDescription(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
        {isEditingDescription && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditingDescription(false)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveDescription} disabled={updateMission.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isEditingDescription ? (
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Decrivez la mission, les objectifs, la demande du client..."
              rows={10}
              className="min-h-[200px]"
            />
          ) : mission.description ? (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{mission.description}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune description renseignee</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsEditingDescription(true)}
                >
                  Ajouter une description
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {client?.demand && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demande initiale du client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {client.demand}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Step 3: Tasks
  const renderTasksStep = () => {
    // Get users from mission trainers or all users
    const missionTrainerUsers = missionTrainers?.map((mt: any) => mt.trainer).filter(Boolean) || [];
    const availableUsers = missionTrainerUsers.length > 0 ? missionTrainerUsers : allUsers || [];

    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Taches
            </h2>
            <p className="text-sm text-muted-foreground">
              Gestion des taches avec suivi automatique des statuts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQuickActions(!showQuickActions)}>
              <Zap className="w-4 h-4 mr-2" />
              Actions rapides
            </Button>
            {isAddingStep ? (
              <div className="flex gap-2">
                <Input
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="Titre de la tache..."
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
              <Button onClick={() => setIsAddingStep(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une tache
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Actions rapides predefinies
              </CardTitle>
              <CardDescription>
                Cliquez sur une action pour l'ajouter ou ajoutez toutes les actions d'une categorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((category) => (
                  <div
                    key={category.category}
                    className={`p-4 rounded-lg border-2 ${category.borderColor} ${category.bgColor}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className={`font-semibold ${category.color}`}>{category.category}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={category.color}
                        onClick={() => handleAddAllQuickActions(category.category)}
                      >
                        Tout ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {category.actions.map((action) => (
                        <button
                          key={action}
                          onClick={() => handleAddQuickAction(action)}
                          className="w-full text-left text-sm p-2 rounded hover:bg-white/50 transition-colors"
                        >
                          <Plus className="w-3 h-3 inline mr-2" />
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status summary */}
        {steps && steps.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span>{steps.filter((s: any) => getAutoStatus(s) === 'todo').length} A faire</span>
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
                <span>{steps.filter((s: any) => getAutoStatus(s) === 'done').length} Termine</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>{steps.filter((s: any) => getAutoStatus(s) === 'na').length} Sans objet</span>
              </div>
            </div>
          </div>
        )}

        {/* Tasks list with workflow */}
        {steps && steps.length > 0 ? (
          <div className="relative">
            {/* Vertical workflow line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-300 via-violet-400 to-violet-300" />

            <div className="space-y-4">
              {[...steps]
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((task: any, index: number) => (
                  <div key={task.id} className="relative flex gap-4">
                    {/* Step number with circle */}
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

                    {/* Task content */}
                    <div className="flex-1 pb-2">
                      <TaskItem
                        task={task}
                        missionId={missionId}
                        isAdmin={isAdmin}
                        users={availableUsers}
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
          <Card>
            <CardContent className="py-12 text-center">
              <ListTodo className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Aucune tache definie</p>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" onClick={() => setIsAddingStep(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une tache manuellement
                </Button>
                <span className="text-sm text-muted-foreground">ou</span>
                <Button variant="outline" onClick={() => setShowQuickActions(true)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Utiliser les actions rapides
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Step 4: Participants & Documents
  const renderParticipantsStep = () => {
    const availableParticipants = allParticipants?.filter(
      (p: any) => !missionParticipants?.some((mp: any) => mp.participantId === p.id)
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Participants */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Participants</h2>
              <Button variant="outline" onClick={() => setIsAddParticipantOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {missionParticipants && missionParticipants.length > 0 ? (
              <div className="space-y-2">
                {missionParticipants.map((mp: any) => (
                  <Card key={mp.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {mp.participant?.firstName?.[0]}{mp.participant?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {mp.participant?.firstName} {mp.participant?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{mp.participant?.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveParticipant(mp.participantId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aucun participant</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Documents</h2>
              <Button variant="outline" onClick={() => setIsAddDocumentOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(doc.id, file);
                                }}
                              />
                              <Button variant="ghost" size="sm" asChild>
                                <span>
                                  <Upload className="w-4 h-4" />
                                </span>
                              </Button>
                            </label>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteDocument.mutate({ id: doc.id, missionId: mission.id })}
                            data-testid={`button-delete-document-${doc.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aucun document</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add participant dialog */}
        <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un participant</DialogTitle>
            </DialogHeader>
            <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
              {availableParticipants && availableParticipants.length > 0 ? (
                availableParticipants.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      handleAddParticipant(p.id);
                      setIsAddParticipantOpen(false);
                    }}
                  >
                    <div>
                      <p className="font-medium">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Tous les participants sont deja assignes
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add document dialog */}
        <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ex: Programme de formation"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newDocType} onValueChange={setNewDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-100 border-violet-300">
                    <SelectItem value="Programme" className="focus:bg-violet-200">Programme</SelectItem>
                    <SelectItem value="Convocation" className="focus:bg-violet-200">Convocation</SelectItem>
                    <SelectItem value="Emargement" className="focus:bg-violet-200">Emargement</SelectItem>
                    <SelectItem value="Evaluation" className="focus:bg-violet-200">Evaluation</SelectItem>
                    <SelectItem value="Attestation" className="focus:bg-violet-200">Attestation</SelectItem>
                    <SelectItem value="Autre" className="focus:bg-violet-200">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddDocument} disabled={!newDocTitle.trim()}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Step 5: Progress
  const renderProgressStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Progression de la mission</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{progressPercent}%</div>
              <p className="text-sm text-muted-foreground mt-1">Progression globale</p>
              <Progress value={progressPercent} className="mt-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{completedSteps}/{totalSteps}</div>
              <p className="text-sm text-muted-foreground mt-1">Taches completees</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{missionParticipants?.length || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Participants inscrits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut de la mission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {getStatusBadge(mission.status as MissionStatus)}
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Changer le statut
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusChange("draft")}>
                    Brouillon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("confirmed")}>
                    Confirmee
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                    En cours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                    Terminee
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("cancelled")} className="text-red-600">
                    Annulee
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume des taches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stepStatusConfig).map(([status, config]) => {
              const count = steps?.filter((s: any) => s.status === status).length || 0;
              return (
                <div key={status} className={cn("p-3 rounded-lg text-center", config.bgColor)}>
                  <div className={cn("text-2xl font-bold", config.color)}>{count}</div>
                  <div className={cn("text-xs", config.color)}>{config.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/missions">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{mission.title}</h1>
                  {getStatusBadge(mission.status as MissionStatus)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {mission.reference} - {client?.name || "Client non defini"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 pb-32">
          {renderStepContent()}
        </div>

        {/* Bottom stepper navigation */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card border-t shadow-lg z-20">
          <div className="px-6 py-4">
            {/* Navigation buttons and steps */}
            <div className="flex items-center justify-between max-w-5xl mx-auto gap-4">
              {/* Previous button */}
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Precedent</span>
              </Button>

              {/* Steps */}
              <div className="flex items-center justify-center flex-1 gap-1 sm:gap-2">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      currentStep === step.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold transition-all",
                        currentStep === step.id
                          ? "bg-primary text-primary-foreground shadow-lg scale-110"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {step.id}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium hidden md:block">{step.label}</span>
                  </button>
                ))}
              </div>

              {/* Next button */}
              {currentStep < STEPS.length ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">Etape suivante</span>
                  <span className="sm:hidden">Suivant</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-shrink-0 text-green-600 border-green-600 hover:bg-green-50"
                  disabled
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Termine</span>
                </Button>
              )}
            </div>

            {/* Progress bar between steps */}
            <div className="relative mt-3 max-w-5xl mx-auto">
              <div className="h-1 bg-muted rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
