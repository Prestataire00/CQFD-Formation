import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  Search,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Send,
  Loader2,
  ArrowUp,
  ArrowDown,
  Video,
} from "lucide-react";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useSendStepLink,
  useMissionDocuments,
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
  useUploadDocument,
  useReattachDocuments,
  useMissionTrainers,
  useAddTrainerToMission,
  useRemoveTrainerFromMission,
  useMissionSessions,
  useCreateMissionSession,
  useUpdateMissionSession,
  useDeleteMissionSession,
  useDuplicateMissionSimple,
  useDuplicateMissionMulti,
  useChildMissions,
  useParentMission,
  useMissionParticipants,
  useParticipants,
  useCreateParticipant,
  useAddParticipantToMission,
  useRemoveParticipantFromMission,
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTaskExplanationWithOverrides } from "@/lib/task-explanations";

// Step configuration
const STEPS = [
  { id: 1, label: "Informations", icon: Info, description: "Dates et details" },
  { id: 2, label: "Description", icon: ClipboardList, description: "Demande client" },
  { id: 3, label: "Taches", icon: ListTodo, description: "Etapes a realiser" },
  { id: 4, label: "Documents", icon: FolderOpen, description: "Documents de la mission" },
  { id: 5, label: "Progression", icon: TrendingUp, description: "Suivi et avancement" },
];

// Status badge helper
function getStatusBadge(status: MissionStatus) {
  const styles: Record<MissionStatus, { label: string; className: string }> = {
    draft: { label: "En option", className: "bg-slate-100 text-slate-700" },
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

// Get task status - auto-computed from due date when status is 'todo', manual override otherwise
function getAutoStatus(task: any): StepStatus {
  // Manual overrides (user explicitly set a status)
  if (task.isCompleted || task.status === 'done') return 'done';
  if (task.status === 'na') return 'na';
  if (task.status === 'priority') return 'priority';
  if (task.status === 'late') return 'late';

  // Auto-compute for tasks in 'todo' status
  if (!task.dueDate) return 'todo';
  const now = new Date();

  // If lateDate exists, use per-task thresholds: past lateDate → late, past dueDate → priority
  if (task.lateDate) {
    const lateDate = new Date(task.lateDate);
    if (now >= lateDate) return 'late';
    const dueDate = new Date(task.dueDate);
    if (now >= dueDate) return 'priority';
    return 'todo';
  }

  // Fallback: generic thresholds (dueDate only)
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'late';
  if (diffDays <= 3) return 'priority';
  return 'todo';
}

// Check if status was manually overridden (not 'todo' which is the auto-compute default)
function isManualStatus(task: any): boolean {
  return task.status !== 'todo' && !task.isCompleted;
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

// Intra + Prestataire predefined tasks
interface IntraPrestaTaskTemplate {
  title: string;
  priorityDaysBefore: number; // positive = before first session (J-X), negative = after (J+X)
  lateDaysBefore: number;
  assigneeType: 'admin' | 'formateur';
  link?: string;
}

const INTRA_PRESTA_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse de formation", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaire de cadrage", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaires de positionnement", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Cahier des charges et Consignes", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi contrat de prestation de sous-traitance", priorityDaysBefore: 40, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi pour impressions livret et annexes", priorityDaysBefore: 35, lateDaysBefore: 21, assigneeType: "formateur" },
  { title: "Impression docs et envoi dossier", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Scan annexes (qcm...)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi Synthèse éval des acquis + détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des originaux par courrier", priorityDaysBefore: -5, lateDaysBefore: -10, assigneeType: "formateur" },
  { title: "Envoi facture", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

const INTER_PRESTA_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Pub et communications", priorityDaysBefore: 180, lateDaysBefore: 90, assigneeType: "admin" },
  { title: "Horaires et adresse de formation", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaires de positionnement", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants et coordonnées", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Cahier des charges et Consignes", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi contrat de prestation de sous-traitance", priorityDaysBefore: 40, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi pour impressions livret et annexes", priorityDaysBefore: 35, lateDaysBefore: 21, assigneeType: "formateur" },
  { title: "Impression docs et envoi dossier", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Scan annexes (qcm...)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi Synthèse éval des acquis + détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des originaux par courrier", priorityDaysBefore: -5, lateDaysBefore: -10, assigneeType: "formateur" },
  { title: "Envoi facture", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

const INTRA_SALARIE_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse de formation", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaire de cadrage", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaires de positionnement", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "DUE et Contrat de travail", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Retour signé de la DUE et du Contrat", priorityDaysBefore: 30, lateDaysBefore: 20, assigneeType: "formateur" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi pour impressions livret et annexes", priorityDaysBefore: 35, lateDaysBefore: 21, assigneeType: "formateur" },
  { title: "Impression docs et envoi dossier", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Scan annexes (qcm...)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi Synthèse éval des acquis + détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des originaux par courrier", priorityDaysBefore: -5, lateDaysBefore: -10, assigneeType: "formateur" },
  { title: "Fiche de paie et paiement", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "admin" },
  { title: "Envoi solde de tout compte signé", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isIntraPrestataire(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Intra") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "prestataire";
}

function isInterPrestataire(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Inter") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "prestataire";
}

function isIntraSalarie(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Intra") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "formateur";
}

const INTER_SALARIE_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Pub et communications", priorityDaysBefore: 180, lateDaysBefore: 90, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse de formation", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Questionnaires de positionnement", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants et coordonnées", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "DUE et Contrat de travail", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Retour signé de la DUE et du Contrat", priorityDaysBefore: 30, lateDaysBefore: 20, assigneeType: "formateur" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi pour impressions livret et annexes", priorityDaysBefore: 35, lateDaysBefore: 21, assigneeType: "formateur" },
  { title: "Impression docs et envoi dossier", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Scan annexes (qcm...)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi Synthèse éval des acquis + détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des originaux par courrier", priorityDaysBefore: -5, lateDaysBefore: -10, assigneeType: "formateur" },
  { title: "Fiche de paie et paiement", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "admin" },
  { title: "Envoi solde de tout compte signé", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isInterSalarie(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Inter") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "formateur";
}

const CONSEIL_PRESTA_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Cahier des charges et Consignes", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi contrat de prestation de sous-traitance", priorityDaysBefore: 40, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Envoi du rapport détaillé", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi facture", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isConseilPrestataire(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Conseil") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "prestataire";
}

const CONSEIL_SALARIE_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "DUE et Contrat de travail", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Retour signé de la DUE et du Contrat", priorityDaysBefore: 30, lateDaysBefore: 20, assigneeType: "formateur" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Envoi du rapport détaillé", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Fiche de paie et paiement", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "admin" },
  { title: "Envoi solde de tout compte signé", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isConseilSalarie(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Conseil") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "formateur";
}

const CONFERENCE_PRESTA_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Cahier des charges et Consignes", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi contrat de prestation de sous-traitance", priorityDaysBefore: 40, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi livret et annexes", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "formateur" },
  { title: "Envoi lien, info, dossier si impression (f. présence)", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi facture", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isConferencePrestataire(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Conférence") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "prestataire";
}

const CONFERENCE_SALARIE_TASKS: IntraPrestaTaskTemplate[] = [
  { title: "Programme initial", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Convention et modalités", priorityDaysBefore: 80, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Horaires et adresse", priorityDaysBefore: 70, lateDaysBefore: 60, assigneeType: "admin" },
  { title: "Envoi compte-rendu entretien cadrage", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur", link: "https://forms.gle/G2GRpCVVkYTTcfM27" },
  { title: "Envoi programme ajusté et séquençage", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Envoi des adaptations si handicap", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "formateur" },
  { title: "Saisie dans Récap", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Engagement financier", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Liste des participants", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Exprimer besoins salles, matériel, MP, et repas", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Commande particulière", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "Lien visio (distanciel)", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "formateur" },
  { title: "Envoi de la convocation et programme ajusté", priorityDaysBefore: 50, lateDaysBefore: 30, assigneeType: "admin" },
  { title: "DUE et Contrat de travail", priorityDaysBefore: 40, lateDaysBefore: 20, assigneeType: "admin" },
  { title: "Retour signé de la DUE et du Contrat", priorityDaysBefore: 30, lateDaysBefore: 20, assigneeType: "formateur" },
  { title: "Informer formateur budget dépl/héb", priorityDaysBefore: 60, lateDaysBefore: 40, assigneeType: "admin" },
  { title: "Envoi livret et annexes", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "formateur" },
  { title: "Envoi lien, info, dossier si impression (f. présence)", priorityDaysBefore: 25, lateDaysBefore: 15, assigneeType: "admin" },
  { title: "Vérifier tous les éléments en mains", priorityDaysBefore: 7, lateDaysBefore: 2, assigneeType: "formateur" },
  { title: "Scan feuille de présence + quest. Satisfaction", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi du bilan qualité", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur", link: "https://forms.gle/wLRq27F3hN75PWca6" },
  { title: "Envoi détail des énoncés/études de cas/mises en situation + photos des travaux réalisés", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Envoi des captures d'écran (distanciel)", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "formateur" },
  { title: "Fiche de paie et paiement", priorityDaysBefore: -3, lateDaysBefore: -5, assigneeType: "admin" },
  { title: "Envoi solde de tout compte signé", priorityDaysBefore: -10, lateDaysBefore: -15, assigneeType: "formateur" },
];

function isConferenceSalarie(mission: any, allUsers: any[]): boolean {
  if (mission?.typology !== "Conférence") return false;
  if (!mission?.trainerId) return false;
  const trainer = allUsers?.find((u: any) => u.id === mission.trainerId);
  return trainer?.role === "formateur";
}

// TaskItem component
interface TaskItemProps {
  task: any;
  missionId: number;
  isAdmin: boolean;
  users: any[];
  assignableUsers: any[];
  currentUserId: string;
  dbExplanations: Array<{ taskName: string; explanation: string }>;
  onUpdate: (taskId: number, data: any) => void;
  onDelete: (taskId: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function TaskItem({ task, missionId, isAdmin, users, assignableUsers, currentUserId, dbExplanations, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: TaskItemProps) {
  const { toast } = useToast();
  const sendStepLink = useSendStepLink();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [comment, setComment] = useState(isAdmin ? (task.comment || "") : (task.trainerComment || ""));
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadline, setDeadline] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);

  const autoStatus = getAutoStatus(task);
  const config = stepStatusConfig[autoStatus] || stepStatusConfig.todo;
  const isManual = isManualStatus(task);
  const assignee = users?.find((u: any) => u.id === task.assigneeId);
  const commentAuthor = users?.find((u: any) => u.id === task.commentAuthorId);
  const trainerCommentAuthor = users?.find((u: any) => u.id === task.trainerCommentAuthorId);

  // Filter status options: non-admin cannot set 'na'
  const availableStatuses = isAdmin
    ? Object.entries(stepStatusConfig) as [StepStatus, typeof stepStatusConfig[StepStatus]][]
    : (Object.entries(stepStatusConfig) as [StepStatus, typeof stepStatusConfig[StepStatus]][]).filter(([status]) => status !== 'na');

  const handleStatusChange = (newStatus: StepStatus) => {
    if (newStatus === 'done') {
      onUpdate(task.id, { status: 'done', isCompleted: true });
    } else {
      onUpdate(task.id, { status: newStatus, isCompleted: false });
    }
  };

  const handleSaveComment = () => {
    if (isAdmin) {
      // Admin edits the main comment
      onUpdate(task.id, {
        comment: comment || null,
        commentAuthorId: comment ? currentUserId : null,
      });
    } else {
      // Formateur edits the trainer reply comment
      onUpdate(task.id, {
        trainerComment: comment || null,
        trainerCommentAuthorId: comment ? currentUserId : null,
      });
    }
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

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status selector dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-0.5 flex-shrink-0 cursor-pointer" title="Changer le statut">
                {config.icon}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {isManual && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange('todo')}
                    className="text-violet-600"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Revenir en automatique
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {availableStatuses.map(([status, statusConfig]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={autoStatus === status ? 'bg-accent font-medium' : ''}
                >
                  <span className="mr-2">{statusConfig.icon}</span>
                  {statusConfig.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-medium ${task.isCompleted || autoStatus === 'done' ? 'line-through text-green-700' : config.color}`}>
                {task.title}
              </h4>
              {(() => {
                const explanation = getTaskExplanationWithOverrides(task.title, dbExplanations);
                if (!explanation) return null;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex-shrink-0 text-muted-foreground transition-colors"
                        title="Voir les consignes"
                        data-testid={`btn-task-info-${task.id}`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-[420px] max-h-[400px] overflow-y-auto p-4"
                    >
                      <div className="space-y-2">
                        <h5 className="font-semibold text-sm" data-testid={`text-task-info-title-${task.id}`}>{task.title}</h5>
                        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed" data-testid={`text-task-info-content-${task.id}`}>
                          {explanation}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
              {task.link && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                  title={task.link}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                {config.label}{isManual ? ' (manuel)' : ''}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              {isAdmin && isEditingAssignee ? (
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
                      {assignableUsers?.slice().sort((a: any, b: any) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "fr")).map((u: any) => (
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
                  onClick={() => isAdmin && setIsEditingAssignee(true)}
                  className={`flex items-center gap-1 text-sm text-muted-foreground ${isAdmin ? 'hover:text-foreground cursor-pointer' : 'cursor-default'}`}
                >
                  <User className="w-4 h-4" />
                  {assignee ? (
                    <span className="font-medium text-foreground">{assignee.firstName}</span>
                  ) : isAdmin ? (
                    <span className="italic">Assigner</span>
                  ) : null}
                </button>
              )}

              {isAdmin && isEditingDeadline ? (
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
              ) : task.dueDate ? (
                <button
                  onClick={() => isAdmin && setIsEditingDeadline(true)}
                  className={`flex items-center gap-1 text-sm text-muted-foreground ${isAdmin ? 'hover:text-foreground cursor-pointer' : 'cursor-default'}`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className={autoStatus === 'late' ? 'text-red-600 font-medium' : ''}>
                    {format(new Date(task.dueDate), "d MMM yyyy", { locale: fr })}
                  </span>
                </button>
              ) : isAdmin ? (
                <button
                  onClick={() => setIsEditingDeadline(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="italic">Deadline</span>
                </button>
              ) : null}
            </div>

            {/* Admin comment - read-only for formateur */}
            {task.comment && (
              <div className="mt-3 bg-white/50 p-3 rounded-lg border border-gray-100">
                {isAdmin && isEditingComment ? null : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Trainer reply comment - read-only for admin */}
            {task.trainerComment && !((!isAdmin) && isEditingComment) && (
              <div className="mt-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-600 mb-1">Reponse formateur</p>
                <RichTextDisplay content={task.trainerComment} className="text-sm" />
                {trainerCommentAuthor && (
                  <p className="text-xs text-muted-foreground mt-2">
                    — {trainerCommentAuthor.firstName} {trainerCommentAuthor.lastName}
                    {task.trainerCommentUpdatedAt && (
                      <span className="ml-1">
                        le {format(new Date(task.trainerCommentUpdatedAt), "d MMM yyyy", { locale: fr })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Comment editor */}
            {isEditingComment && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {isAdmin ? "Commentaire admin" : "Votre reponse"}
                </p>
                <RichTextEditor
                  value={comment}
                  onChange={setComment}
                  placeholder={isAdmin ? "Ajouter un commentaire..." : "Ajouter votre reponse..."}
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
            {/* Move up/down buttons */}
            <div className="flex flex-col">
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className={`p-0.5 rounded hover:bg-white/50 ${isFirst ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                title="Monter"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className={`p-0.5 rounded hover:bg-white/50 ${isLast ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                title="Descendre"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {task.link && (
              <button
                onClick={async () => {
                  try {
                    const result = await sendStepLink.mutateAsync({ missionId, stepId: task.id });
                    toast({
                      title: result.sent > 0
                        ? `Lien envoye a ${result.sent} destinataire(s)`
                        : "Aucun destinataire trouve",
                    });
                  } catch (error) {
                    toast({ title: "Erreur lors de l'envoi", variant: "destructive" });
                  }
                }}
                disabled={sendStepLink.isPending}
                className="p-1.5 text-blue-400 hover:text-blue-600 rounded hover:bg-white/50 disabled:opacity-50"
                title="Envoyer le lien par email"
              >
                {sendStepLink.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => {
                if (!isEditingComment) {
                  setComment(isAdmin ? (task.comment || "") : (task.trainerComment || ""));
                }
                setIsEditingComment(!isEditingComment);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-white/50"
              title={isAdmin ? "Commentaire" : "Repondre"}
            >
              <MessageSquare className="w-4 h-4" />
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
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({ date: "", startTime: "09:00", endTime: "17:00" });

  // Task explanations from DB (editable consignes)
  const [dbExplanations, setDbExplanations] = useState<Array<{ taskName: string; explanation: string }>>([]);
  useEffect(() => {
    fetch("/api/task-explanations", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setDbExplanations(data))
      .catch(() => {});
  }, []);

  // Data queries
  const { data: mission, isLoading } = useMission(missionId);
  const { data: clients } = useClients();
  const { data: trainers } = useTrainers();
  const { data: programs } = usePrograms();
  const { data: steps } = useMissionSteps(missionId);
  const { data: documents, isLoading: isLoadingDocuments } = useMissionDocuments(missionId);
  const { data: missionTrainers } = useMissionTrainers(missionId);
  const { data: allUsers } = useUsers();
  const { data: missionSessions } = useMissionSessions(missionId);
  const { data: missionParticipants } = useMissionParticipants(missionId);
  const { data: allParticipants } = useParticipants();
  const createParticipant = useCreateParticipant();
  const addParticipantToMission = useAddParticipantToMission();
  const removeParticipantFromMission = useRemoveParticipantFromMission();

  // Participant management state
  const [participantSearchOpen, setParticipantSearchOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [showNewParticipantForm, setShowNewParticipantForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ firstName: "", lastName: "", email: "", address: "" });

  // Task deadline defaults
  const [deadlineDefaults, setDeadlineDefaults] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch("/api/task-deadline-defaults", { credentials: "include" })
      .then((res) => res.json())
      .then((data: any[]) => {
        const map: Record<string, number> = {};
        data.forEach((d) => { if (d.isActive) map[d.taskTitle] = d.daysBefore; });
        setDeadlineDefaults(map);
      })
      .catch(() => {});
  }, []);

  // Duplication queries
  const { data: childMissions } = useChildMissions(missionId);
  const { data: parentMission } = useParentMission(missionId, !!mission?.parentMissionId);
  const duplicateMissionMulti = useDuplicateMissionMulti();
  const duplicateMissionSimple = useDuplicateMissionSimple();

  // Duplication dialog state
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [duplicateTrainerSearch, setDuplicateTrainerSearch] = useState("");
  const [duplicateTrainerOpen, setDuplicateTrainerOpen] = useState(false);

  // Mutations
  const updateMission = useUpdateMission();
  const updateStatus = useUpdateMissionStatus();
  const createStep = useCreateMissionStep();
  const updateStep = useUpdateMissionStep();
  const deleteStep = useDeleteMissionStep();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const updateDocument = useUpdateDocument();
  const uploadDocument = useUploadDocument();
  const reattachDocuments = useReattachDocuments();
  const addTrainer = useAddTrainerToMission();
  const removeTrainer = useRemoveTrainerFromMission();
  const createSession = useCreateMissionSession();
  const updateSession = useUpdateMissionSession();
  const deleteSession = useDeleteMissionSession();

  // Initialize edit form when mission loads
  useEffect(() => {
    if (mission) {
      setEditForm({
        title: mission.title || "",
        description: mission.description || "",
        startDate: mission.startDate ? format(new Date(mission.startDate), "yyyy-MM-dd") : "",
        endDate: mission.endDate ? format(new Date(mission.endDate), "yyyy-MM-dd") : "",
        typology: mission.typology || "Intra",
        location: mission.location || "",
        locationType: mission.locationType || "presentiel",
        videoLink: mission.videoLink || "",
        totalHours: mission.totalHours || "",
        clientId: mission.clientId?.toString() || "",
        trainerId: mission.trainerId || "",
        programId: mission.programId?.toString() || "",
        programTitle: mission.programTitle || "",
        expectedParticipants: mission.expectedParticipants || "",
        participantsList: mission.participantsList || "",
      });
    }
  }, [mission]);

  // ==================== UNSAVED CHANGES GUARD ====================
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const [, setLocation] = useLocation();

  // Build the "original" form values from the current mission data (same logic as the useEffect above)
  const originalForm = useMemo(() => {
    if (!mission) return null;
    return {
      title: mission.title || "",
      description: mission.description || "",
      startDate: mission.startDate ? format(new Date(mission.startDate), "yyyy-MM-dd") : "",
      endDate: mission.endDate ? format(new Date(mission.endDate), "yyyy-MM-dd") : "",
      typology: mission.typology || "Intra",
      location: mission.location || "",
      locationType: mission.locationType || "presentiel",
      videoLink: mission.videoLink || "",
      totalHours: mission.totalHours || "",
      clientId: mission.clientId?.toString() || "",
      trainerId: mission.trainerId || "",
      programId: mission.programId?.toString() || "",
      programTitle: mission.programTitle || "",
      expectedParticipants: mission.expectedParticipants || "",
      participantsList: mission.participantsList || "",
    };
  }, [mission]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalForm) return false;
    if (!isEditingInfo && !isEditingDescription) return false;
    if (isEditingInfo) {
      // Check info fields (all except description)
      const infoKeys = ["title", "startDate", "endDate", "typology", "location", "locationType", "videoLink", "totalHours", "clientId", "trainerId", "programId", "programTitle", "expectedParticipants", "participantsList"];
      for (const key of infoKeys) {
        if (String(editForm[key] ?? "") !== String(originalForm[key] ?? "")) return true;
      }
    }
    if (isEditingDescription) {
      if (String(editForm.description ?? "") !== String(originalForm.description ?? "")) return true;
    }
    return false;
  }, [editForm, originalForm, isEditingInfo, isEditingDescription]);

  // Browser beforeunload guard
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Navigation guard helper
  const guardedNavigate = useCallback((href: string) => {
    if (hasUnsavedChanges) {
      pendingNavigationRef.current = href;
      setShowUnsavedDialog(true);
    } else {
      setLocation(href);
    }
  }, [hasUnsavedChanges, setLocation]);

  const handleConfirmLeave = useCallback(() => {
    // Reset edit states
    setIsEditingInfo(false);
    setIsEditingDescription(false);
    // Restore original form
    if (originalForm) setEditForm({ ...originalForm });
    setShowUnsavedDialog(false);
    if (pendingNavigationRef.current) {
      setLocation(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  }, [originalForm, setLocation]);

  const handleCancelInfo = useCallback(() => {
    if (hasUnsavedChanges && isEditingInfo) {
      pendingNavigationRef.current = null;
      setShowUnsavedDialog(true);
    } else {
      setIsEditingInfo(false);
      if (originalForm) setEditForm((prev: any) => ({ ...prev, ...originalForm }));
    }
  }, [hasUnsavedChanges, isEditingInfo, originalForm]);

  const handleCancelDescription = useCallback(() => {
    if (hasUnsavedChanges && isEditingDescription) {
      pendingNavigationRef.current = null;
      setShowUnsavedDialog(true);
    } else {
      setIsEditingDescription(false);
      if (originalForm) setEditForm((prev: any) => ({ ...prev, description: originalForm.description }));
    }
  }, [hasUnsavedChanges, isEditingDescription, originalForm]);

  const handleConfirmDiscard = useCallback(() => {
    setIsEditingInfo(false);
    setIsEditingDescription(false);
    if (originalForm) setEditForm({ ...originalForm });
    setShowUnsavedDialog(false);
    if (pendingNavigationRef.current) {
      setLocation(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  }, [originalForm, setLocation]);

  // Filter steps for non-admin users (formateurs only see tasks assigned to them)
  const visibleSteps = isAdmin
    ? steps
    : steps?.filter((s: any) => s.assigneeId === user?.id);

  // Calculate progress based on visible steps
  const completedSteps = visibleSteps?.filter((s: any) => s.status === "done" || s.isCompleted).length || 0;
  const totalSteps = visibleSteps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Get related data
  const client = clients?.find((c: any) => c.id === mission?.clientId);
  const trainer = trainers?.find((t: any) => t.id === mission?.trainerId);
  const program = programs?.find((p: any) => p.id === mission?.programId);

  // Handlers
  const recalculateTaskDeadlines = async (startDateStr: string) => {
    if (!steps || steps.length === 0) return 0;
    const referenceDate = new Date(startDateStr);
    // Build lookup from INTRA_PRESTA_TASKS and INTER_PRESTA_TASKS
    const intraPrestaMap = new Map<string, { priorityDaysBefore: number; lateDaysBefore: number }>();
    for (const t of INTRA_PRESTA_TASKS) {
      intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
    }
    for (const t of INTER_PRESTA_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of INTRA_SALARIE_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of INTER_SALARIE_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of CONSEIL_PRESTA_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of CONSEIL_SALARIE_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of CONFERENCE_PRESTA_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }
    for (const t of CONFERENCE_SALARIE_TASKS) {
      if (!intraPrestaMap.has(t.title)) {
        intraPrestaMap.set(t.title, { priorityDaysBefore: t.priorityDaysBefore, lateDaysBefore: t.lateDaysBefore });
      }
    }

    let updatedCount = 0;
    for (const step of steps) {
      const template = intraPrestaMap.get(step.title);
      if (template) {
        const d = new Date(referenceDate);
        d.setDate(d.getDate() - template.priorityDaysBefore);
        const ld = new Date(referenceDate);
        ld.setDate(ld.getDate() - template.lateDaysBefore);
        await updateStep.mutateAsync({
          missionId,
          stepId: step.id,
          data: { dueDate: d.toISOString(), lateDate: ld.toISOString() },
        });
        updatedCount++;
      } else if (deadlineDefaults[step.title] !== undefined) {
        const days = deadlineDefaults[step.title];
        const d = new Date(referenceDate);
        d.setDate(d.getDate() - days);
        await updateStep.mutateAsync({
          missionId,
          stepId: step.id,
          data: { dueDate: d.toISOString() },
        });
        updatedCount++;
      }
    }
    return updatedCount;
  };

  const handleSaveInfo = async () => {
    try {
      const newStartDate = editForm.startDate || null;
      const typologyChanged = originalForm && editForm.typology !== originalForm.typology;
      const trainerChanged = originalForm && editForm.trainerId !== originalForm.trainerId;

      await updateMission.mutateAsync({
        id: missionId,
        data: {
          title: editForm.title,
          typology: editForm.typology,
          startDate: editForm.startDate ? new Date(editForm.startDate) : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate) : undefined,
          location: editForm.location,
          locationType: editForm.locationType,
          videoLink: editForm.videoLink || null,
          totalHours: editForm.totalHours ? Number(editForm.totalHours) : undefined,
          clientId: editForm.clientId ? Number(editForm.clientId) : undefined,
          trainerId: editForm.trainerId || undefined,
          programId: editForm.programId ? Number(editForm.programId) : undefined,
          programTitle: editForm.programTitle || undefined,
          expectedParticipants: editForm.expectedParticipants ? Number(editForm.expectedParticipants) : undefined,
          participantsList: editForm.participantsList || undefined,
        },
      });

      // If typology or trainer changed, replace all tasks with the correct template
      if ((typologyChanged || trainerChanged) && steps) {
        // Delete all existing tasks
        for (const step of steps) {
          await deleteStep.mutateAsync({ missionId, stepId: step.id });
        }

        // Determine the correct task template based on new typology + trainer role
        const newTrainer = allUsers?.find((u: any) => u.id === editForm.trainerId);
        const trainerRole = newTrainer?.role;
        const typology = editForm.typology;

        let taskList: IntraPrestaTaskTemplate[] | null = null;
        if (typology === "Intra" && trainerRole === "prestataire") taskList = INTRA_PRESTA_TASKS;
        else if (typology === "Intra" && trainerRole === "formateur") taskList = INTRA_SALARIE_TASKS;
        else if (typology === "Inter" && trainerRole === "prestataire") taskList = INTER_PRESTA_TASKS;
        else if (typology === "Inter" && trainerRole === "formateur") taskList = INTER_SALARIE_TASKS;
        else if (typology === "Conseil" && trainerRole === "prestataire") taskList = CONSEIL_PRESTA_TASKS;
        else if (typology === "Conseil" && trainerRole === "formateur") taskList = CONSEIL_SALARIE_TASKS;
        else if (typology === "Conférence" && trainerRole === "prestataire") taskList = CONFERENCE_PRESTA_TASKS;
        else if (typology === "Conférence" && trainerRole === "formateur") taskList = CONFERENCE_SALARIE_TASKS;

        if (taskList) {
          const adminId = user?.id || null;
          const formateurId = editForm.trainerId || null;
          const startDateRef = newStartDate ? new Date(newStartDate) : null;

          let order = 0;
          for (const task of taskList) {
            order++;
            const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
            let dueDate: string | undefined;
            let lateDate: string | undefined;
            if (startDateRef) {
              const d = new Date(startDateRef);
              d.setDate(d.getDate() - task.priorityDaysBefore);
              dueDate = d.toISOString();
              const ld = new Date(startDateRef);
              ld.setDate(ld.getDate() - task.lateDaysBefore);
              lateDate = ld.toISOString();
            }
            await createStep.mutateAsync({
              missionId,
              data: {
                title: task.title,
                status: "todo",
                order,
                assigneeId,
                dueDate,
                lateDate,
                link: task.link || undefined,
              },
            });
          }
          toast({ title: `Taches mises a jour (${taskList.length} taches)` });
        } else {
          toast({ title: "Taches supprimees (aucun template correspondant)" });
        }
      } else {
        // Recalculate all task deadlines based on new startDate (only if tasks weren't replaced)
        if (newStartDate && steps && steps.length > 0) {
          const updatedCount = await recalculateTaskDeadlines(newStartDate);
          if (updatedCount > 0) {
            toast({ title: `${updatedCount} deadline(s) recalculee(s)` });
          }
        }
      }

      // Reattach template documents when typology or trainer changes
      if (typologyChanged || trainerChanged) {
        try {
          await reattachDocuments.mutateAsync({ missionId });
        } catch (e) {
          console.error('Failed to reattach documents:', e);
        }
      }

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

  // Compute due date based on mission start date and deadline defaults
  const computeDueDate = (taskTitle: string): string | null => {
    const daysBefore = deadlineDefaults[taskTitle];
    if (daysBefore === undefined || !mission?.startDate) return null;

    const referenceDate = new Date(mission.startDate);

    // daysBefore > 0 means before end date, < 0 means after, 0 means same day
    const dueDate = new Date(referenceDate);
    dueDate.setDate(dueDate.getDate() - daysBefore);
    return dueDate.toISOString();
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;
    try {
      const maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      const dueDate = computeDueDate(newStepTitle.trim());
      await createStep.mutateAsync({
        missionId,
        data: {
          title: newStepTitle.trim(),
          status: "todo",
          order: maxOrder + 1,
          assigneeId: mission?.trainerId || null,
          dueDate: dueDate || undefined,
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

  const handleMoveTask = async (taskId: number, direction: 'up' | 'down') => {
    if (!visibleSteps) return;
    const sorted = [...visibleSteps].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((s: any) => s.id === taskId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const currentTask = sorted[idx];
    const swapTask = sorted[swapIdx];
    try {
      await updateStep.mutateAsync({ missionId, stepId: currentTask.id, data: { order: swapTask.order || 0 } });
      await updateStep.mutateAsync({ missionId, stepId: swapTask.id, data: { order: currentTask.order || 0 } });
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

  const handleAddQuickAction = async (actionTitle: string, overrideDaysBefore?: number, overrideAssigneeId?: string | null, overrideLateDaysBefore?: number, overrideLink?: string) => {
    try {
      const maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      let dueDate: string | null = null;
      let lateDate: string | null = null;
      if (overrideDaysBefore !== undefined && mission?.startDate) {
        const referenceDate = new Date(mission.startDate);
        const d = new Date(referenceDate);
        d.setDate(d.getDate() - overrideDaysBefore);
        dueDate = d.toISOString();
        if (overrideLateDaysBefore !== undefined) {
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - overrideLateDaysBefore);
          lateDate = ld.toISOString();
        }
      } else {
        dueDate = computeDueDate(actionTitle);
      }
      const assigneeId = overrideAssigneeId !== undefined ? overrideAssigneeId : (mission?.trainerId || null);
      await createStep.mutateAsync({
        missionId,
        data: {
          title: actionTitle,
          status: "todo",
          order: maxOrder + 1,
          assigneeId,
          dueDate: dueDate || undefined,
          lateDate: lateDate || undefined,
          link: overrideLink || undefined,
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
        const dueDate = computeDueDate(action);
        await createStep.mutateAsync({
          missionId,
          data: {
            title: action,
            status: "todo",
            order: maxOrder,
            assigneeId: mission?.trainerId || null,
            dueDate: dueDate || undefined,
          },
        });
      }
      toast({ title: `${categoryData.actions.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllIntraPrestaTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of INTRA_PRESTA_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${INTRA_PRESTA_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllInterPrestaTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of INTER_PRESTA_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${INTER_PRESTA_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllIntraSalarieTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of INTRA_SALARIE_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${INTRA_SALARIE_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllInterSalarieTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of INTER_SALARIE_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${INTER_SALARIE_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllConseilPrestaTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of CONSEIL_PRESTA_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${CONSEIL_PRESTA_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllConseilSalarieTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of CONSEIL_SALARIE_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${CONSEIL_SALARIE_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllConferencePrestaTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of CONFERENCE_PRESTA_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${CONFERENCE_PRESTA_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddAllConferenceSalarieTasks = async () => {
    const adminId = user?.id || null;
    const formateurId = mission?.trainerId || null;

    try {
      let maxOrder = steps?.reduce((max: number, s: any) => Math.max(max, s.order || 0), 0) || 0;
      for (const task of CONFERENCE_SALARIE_TASKS) {
        maxOrder++;
        const assigneeId = task.assigneeType === "admin" ? adminId : formateurId;
        let dueDate: string | undefined;
        let lateDate: string | undefined;
        if (mission?.startDate) {
          const referenceDate = new Date(mission.startDate);
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - task.priorityDaysBefore);
          dueDate = d.toISOString();
          const ld = new Date(referenceDate);
          ld.setDate(ld.getDate() - task.lateDaysBefore);
          lateDate = ld.toISOString();
        }
        await createStep.mutateAsync({
          missionId,
          data: {
            title: task.title,
            status: "todo",
            order: maxOrder,
            assigneeId,
            dueDate,
            lateDate,
            link: task.link || undefined,
          },
        });
      }
      toast({ title: `${CONFERENCE_SALARIE_TASKS.length} taches ajoutees` });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleAddDocument = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const docType = newDocType || "Autre";
      // Versioning: check existing docs with same title+type
      const baseTitle = newDocTitle.trim();
      const matchingDocs = documents?.filter((d: any) => {
        const titleMatch = d.title === baseTitle || d.title.match(new RegExp(`^${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} V\\d+$`));
        return titleMatch && d.type === docType;
      }) || [];
      let finalTitle = baseTitle;
      if (matchingDocs.length > 0) {
        // Find highest existing version
        let maxVersion = 1;
        for (const d of matchingDocs) {
          const vMatch = d.title.match(/ V(\d+)$/);
          if (vMatch) {
            maxVersion = Math.max(maxVersion, parseInt(vMatch[1]));
          }
        }
        // Rename the first doc to V1 if it doesn't have a version yet
        const unversioned = matchingDocs.find((d: any) => d.title === baseTitle);
        if (unversioned) {
          await updateDocument.mutateAsync({ id: unversioned.id, missionId, data: { title: `${baseTitle} V1` } });
          maxVersion = Math.max(maxVersion, 1);
        }
        finalTitle = `${baseTitle} V${maxVersion + 1}`;
      }

      const newDoc = await createDocument.mutateAsync({
        missionId,
        data: {
          title: finalTitle,
          type: docType,
          url: "",
        },
      });
      if (newDocFile && newDoc?.id) {
        await uploadDocument.mutateAsync({ id: newDoc.id, file: newDocFile, missionId });
      }
      setNewDocTitle("");
      setNewDocType("");
      setNewDocFile(null);
      setIsAddDocumentOpen(false);
      toast({ title: newDocFile ? "Document ajoute avec fichier" : "Document ajoute" });
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


  const handleStatusChange = async (newStatus: MissionStatus) => {
    try {
      await updateStatus.mutateAsync({ id: missionId, status: newStatus });
      toast({ title: "Statut mis a jour" });
    } catch (error: any) {
      if (error?.data?.issues) {
        toast({
          title: error.data.message || "Impossible de cloturer la mission",
          description: error.data.issues.join(" | "),
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({ title: "Erreur", variant: "destructive" });
      }
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

  // Trainers already assigned via child missions
  const assignedTrainerIds = new Set<string>();
  if (mission?.trainerId) assignedTrainerIds.add(mission.trainerId);
  if (childMissions) {
    for (const child of childMissions) {
      if (child.trainerId) assignedTrainerIds.add(child.trainerId);
    }
  }

  const availableTrainersForDuplication = trainers?.filter((t: any) => {
    if (assignedTrainerIds.has(t.id)) return false;
    if (!duplicateTrainerSearch) return true;
    const search = duplicateTrainerSearch.toLowerCase();
    return `${t.firstName} ${t.lastName}`.toLowerCase().includes(search) || t.email?.toLowerCase().includes(search);
  }) || [];

  const handleDuplicateMission = async () => {
    if (selectedTrainerIds.length === 0) return;
    try {
      const result = await duplicateMissionMulti.mutateAsync({
        missionId,
        trainerIds: selectedTrainerIds,
      });
      setIsDuplicateOpen(false);
      setSelectedTrainerIds([]);
      toast({
        title: "Duplication reussie",
        description: `${result.created?.length || 0} copie(s) creee(s)${result.errors?.length > 0 ? `, ${result.errors.length} erreur(s)` : ""}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer la mission",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateSimple = async () => {
    try {
      const newMission = await duplicateMissionSimple.mutateAsync({ missionId });
      toast({
        title: "Duplication reussie",
        description: "La copie de la mission a ete creee avec succes.",
      });
      setLocation(`/missions/${newMission.id}`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer la mission",
        variant: "destructive",
      });
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
        return renderDocumentsStep();
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
            <Button variant="outline" onClick={handleCancelInfo}>
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

            {isAdmin && (mission.rateBase || mission.financialTerms) && (
              <div className="pt-3 border-t space-y-1 text-sm">
                {mission.rateBase && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Base tarifaire :</span>
                    <span>{mission.rateBase}</span>
                  </div>
                )}
                {mission.financialTerms && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Modalite financiere :</span>
                    <span>{mission.financialTerms}</span>
                  </div>
                )}
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
              <Calendar className="w-4 h-4" />
              Dates de la mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingInfo ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de debut</Label>
                  <Input
                    type="date"
                    value={editForm.startDate || ""}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de fin (deadline)</Label>
                  <Input
                    type="date"
                    value={editForm.endDate || ""}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Les deadlines des taches se calent sur cette date.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date de debut</p>
                  <p className="font-medium">
                    {mission.startDate
                      ? format(new Date(mission.startDate), "d MMMM yyyy", { locale: fr })
                      : "Non definie"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin (deadline)</p>
                  <p className="font-medium">
                    {mission.endDate
                      ? format(new Date(mission.endDate), "d MMMM yyyy", { locale: fr })
                      : "Non definie"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Typologie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingInfo ? (
              <Select
                value={editForm.typology}
                onValueChange={(value) => setEditForm({ ...editForm, typology: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="Intra" className="focus:bg-violet-200">Intra</SelectItem>
                  <SelectItem value="Inter" className="focus:bg-violet-200">Inter</SelectItem>
                  <SelectItem value="Conseil" className="focus:bg-violet-200">Conseil</SelectItem>
                  <SelectItem value="Conférence" className="focus:bg-violet-200">Conférence</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="capitalize">
                {mission.typology || "Non definie"}
              </Badge>
            )}
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
                {(editForm.locationType === "presentiel" || editForm.locationType === "hybride") && (
                  <div>
                    <Label>Adresse</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Adresse du lieu"
                    />
                  </div>
                )}
                {(editForm.locationType === "distanciel" || editForm.locationType === "hybride") && (
                  <div>
                    <Label>Lien visioconference</Label>
                    <Input
                      value={editForm.videoLink}
                      onChange={(e) => setEditForm({ ...editForm, videoLink: e.target.value })}
                      placeholder="https://teams.microsoft.com/... ou https://zoom.us/..."
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <Badge variant="outline" className="capitalize">
                  {mission.locationType || "Presentiel"}
                </Badge>
                {mission.location && (
                  <p className="text-sm text-muted-foreground">{mission.location}</p>
                )}
                {mission.videoLink && (
                  <a
                    href={mission.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
                  >
                    <Video className="w-4 h-4" />
                    Rejoindre la visioconference
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
              <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {editForm.clientId ? (
                      (() => {
                        const c = clients?.find((c: any) => c.id.toString() === editForm.clientId);
                        return c ? c.name : "Selectionner...";
                      })()
                    ) : (
                      <span className="text-muted-foreground">Taper pour rechercher...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Rechercher un client..."
                      value={clientSearchTerm}
                      onValueChange={setClientSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Aucun client trouve</CommandEmpty>
                      <CommandGroup>
                        {clients?.filter((c: any) => {
                          if (!clientSearchTerm) return true;
                          const search = clientSearchTerm.toLowerCase();
                          return (
                            c.name?.toLowerCase().includes(search) ||
                            c.contactEmail?.toLowerCase().includes(search) ||
                            c.city?.toLowerCase().includes(search)
                          );
                        }).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "", "fr")).map((c: any) => (
                          <CommandItem
                            key={c.id}
                            value={c.id.toString()}
                            onSelect={() => {
                              setEditForm({ ...editForm, clientId: c.id.toString() });
                              setClientComboOpen(false);
                              setClientSearchTerm("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editForm.clientId === c.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{c.name}</span>
                              {(c.contactEmail || c.city) && (
                                <span className="text-xs text-muted-foreground">
                                  {[c.contactEmail, c.city].filter(Boolean).join(" • ")}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                value={editForm.trainerId || "_none_"}
                onValueChange={(value) => setEditForm({ ...editForm, trainerId: value === "_none_" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un formateur" />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="_none_" className="focus:bg-violet-200">Aucun formateur</SelectItem>
                  {trainers?.slice().sort((a: any, b: any) =>
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "fr")
                  ).map((t: any) => (
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
              <Users className="w-4 h-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingInfo ? (
              <>
                <div className="space-y-2">
                  <Label>Nombre de participants prevus</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.expectedParticipants}
                    onChange={(e) => setEditForm({ ...editForm, expectedParticipants: e.target.value })}
                    placeholder="Ex: 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Liste des participants</Label>
                  <Textarea
                    placeholder="Saisir la liste des participants (un par ligne ou separes par des virgules)..."
                    value={editForm.participantsList}
                    onChange={(e) => setEditForm({ ...editForm, participantsList: e.target.value })}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Liste libre des participants pour cette mission
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Nombre prevu :</span>
                  <span className="font-medium">{mission.expectedParticipants ?? "Non defini"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground font-medium">Liste :</span>
                  <p className="font-medium whitespace-pre-line mt-1">{mission.participantsList || "Non defini"}</p>
                </div>
              </>
            )}

            {mission.hasDisability && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-amber-700">Situation de handicap</span>
                  {mission.disabilityDetails && (
                    <p className="text-amber-600 text-xs mt-0.5">{mission.disabilityDetails}</p>
                  )}
                </div>
              </div>
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
            <Button variant="outline" onClick={handleCancelDescription}>
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
    // Get users from mission trainers or all users (for display of names)
    const missionTrainerUsers = missionTrainers?.map((mt: any) => mt.trainer).filter(Boolean) || [];
    const availableUsers = missionTrainerUsers.length > 0 ? missionTrainerUsers : allUsers || [];

    // Assignable users: only Admin(s) + the mission's trainer
    const assignableUsers: any[] = [];
    const seenIds = new Set<string>();
    // Add admins
    allUsers?.filter((u: any) => u.role === 'admin').forEach((u: any) => {
      if (!seenIds.has(u.id)) { assignableUsers.push(u); seenIds.add(u.id); }
    });
    // Add mission's main trainer
    if (mission?.trainerId) {
      const t = allUsers?.find((u: any) => u.id === mission.trainerId);
      if (t && !seenIds.has(t.id)) { assignableUsers.push(t); seenIds.add(t.id); }
    }

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
            {isAdmin && mission?.startDate && steps && steps.length > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const startDateStr = format(new Date(mission.startDate), "yyyy-MM-dd");
                    const count = await recalculateTaskDeadlines(startDateStr);
                    toast({ title: count > 0 ? `${count} deadline(s) recalculee(s)` : "Aucune tache a recalculer" });
                  } catch {
                    toast({ title: "Erreur", variant: "destructive" });
                  }
                }}
                disabled={updateStep.isPending}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Recalculer deadlines
              </Button>
            )}
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
                {isIntraPrestataire(mission, allUsers || [])
                  ? "Taches predefinies pour mission Intra + Prestataire. Cliquez pour ajouter."
                  : isInterPrestataire(mission, allUsers || [])
                  ? "Taches predefinies pour mission Inter + Prestataire. Cliquez pour ajouter."
                  : isIntraSalarie(mission, allUsers || [])
                  ? "Taches predefinies pour mission Intra + Salarie. Cliquez pour ajouter."
                  : isInterSalarie(mission, allUsers || [])
                  ? "Taches predefinies pour mission Inter + Salarie. Cliquez pour ajouter."
                  : isConseilPrestataire(mission, allUsers || [])
                  ? "Taches predefinies pour mission Conseil + Prestataire. Cliquez pour ajouter."
                  : isConseilSalarie(mission, allUsers || [])
                  ? "Taches predefinies pour mission Conseil + Salarie. Cliquez pour ajouter."
                  : isConferencePrestataire(mission, allUsers || [])
                  ? "Taches predefinies pour mission Conference + Prestataire. Cliquez pour ajouter."
                  : isConferenceSalarie(mission, allUsers || [])
                  ? "Taches predefinies pour mission Conference + Salarie. Cliquez pour ajouter."
                  : "Cliquez sur une action pour l'ajouter ou ajoutez toutes les actions d'une categorie"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isIntraPrestataire(mission, allUsers || []) || isInterPrestataire(mission, allUsers || []) || isIntraSalarie(mission, allUsers || []) || isInterSalarie(mission, allUsers || []) || isConseilPrestataire(mission, allUsers || []) || isConseilSalarie(mission, allUsers || []) || isConferencePrestataire(mission, allUsers || []) || isConferenceSalarie(mission, allUsers || []) ? (() => {
                const taskList = isIntraPrestataire(mission, allUsers || []) ? INTRA_PRESTA_TASKS
                  : isInterPrestataire(mission, allUsers || []) ? INTER_PRESTA_TASKS
                  : isIntraSalarie(mission, allUsers || []) ? INTRA_SALARIE_TASKS
                  : isInterSalarie(mission, allUsers || []) ? INTER_SALARIE_TASKS
                  : isConseilPrestataire(mission, allUsers || []) ? CONSEIL_PRESTA_TASKS
                  : isConseilSalarie(mission, allUsers || []) ? CONSEIL_SALARIE_TASKS
                  : isConferencePrestataire(mission, allUsers || []) ? CONFERENCE_PRESTA_TASKS
                  : CONFERENCE_SALARIE_TASKS;
                const handleAddAll = isIntraPrestataire(mission, allUsers || []) ? handleAddAllIntraPrestaTasks
                  : isInterPrestataire(mission, allUsers || []) ? handleAddAllInterPrestaTasks
                  : isIntraSalarie(mission, allUsers || []) ? handleAddAllIntraSalarieTasks
                  : isInterSalarie(mission, allUsers || []) ? handleAddAllInterSalarieTasks
                  : isConseilPrestataire(mission, allUsers || []) ? handleAddAllConseilPrestaTasks
                  : isConseilSalarie(mission, allUsers || []) ? handleAddAllConseilSalarieTasks
                  : isConferencePrestataire(mission, allUsers || []) ? handleAddAllConferencePrestaTasks
                  : handleAddAllConferenceSalarieTasks;
                return (
                <div>
                  <Button
                    className="w-full mb-4"
                    onClick={handleAddAll}
                    disabled={createStep.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tout ajouter ({taskList.length} taches)
                  </Button>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {taskList.map((task, idx) => {
                        const assigneeId = task.assigneeType === "admin" ? (user?.id || null) : (mission?.trainerId || null);
                        const deadlineLabel = task.priorityDaysBefore >= 0
                          ? `J-${task.priorityDaysBefore}`
                          : `J+${Math.abs(task.priorityDaysBefore)}`;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleAddQuickAction(task.title, task.priorityDaysBefore, assigneeId, task.lateDaysBefore, task.link)}
                            className="w-full text-left text-sm p-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2 group"
                            disabled={createStep.isPending}
                          >
                            <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate">{task.title}</span>
                            <Badge variant="outline" className="text-xs flex-shrink-0 font-mono">
                              {deadlineLabel}
                            </Badge>
                            <Badge
                              className={`text-xs flex-shrink-0 ${
                                task.assigneeType === "admin"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                  : "bg-green-100 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {task.assigneeType === "admin" ? "Admin" : "Formateur"}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
                );
              })() : (
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Status summary */}
        {visibleSteps && visibleSteps.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span>{visibleSteps.filter((s: any) => getAutoStatus(s) === 'todo').length} A faire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>{visibleSteps.filter((s: any) => getAutoStatus(s) === 'priority').length} Prioritaire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>{visibleSteps.filter((s: any) => getAutoStatus(s) === 'late').length} En retard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>{visibleSteps.filter((s: any) => getAutoStatus(s) === 'done').length} Termine</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>{visibleSteps.filter((s: any) => getAutoStatus(s) === 'na').length} Sans objet</span>
              </div>
            </div>
          </div>
        )}

        {/* Tasks list with workflow */}
        {visibleSteps && visibleSteps.length > 0 ? (
          <div className="relative">
            {/* Vertical workflow line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-300 via-violet-400 to-violet-300" />

            <div className="space-y-4">
              {(() => {
                const sortedTasks = [...visibleSteps].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                return sortedTasks.map((task: any, index: number) => (
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
                        assignableUsers={assignableUsers}
                        currentUserId={user?.id || ""}
                        dbExplanations={dbExplanations}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteStep}
                        onMoveUp={() => handleMoveTask(task.id, 'up')}
                        onMoveDown={() => handleMoveTask(task.id, 'down')}
                        isFirst={index === 0}
                        isLast={index === sortedTasks.length - 1}
                      />
                    </div>
                  </div>
                ));
              })()}
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
  const renderDocumentsStep = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Documents</h2>
          <Button variant="outline" onClick={() => setIsAddDocumentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {isLoadingDocuments ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Chargement des documents...</p>
            </CardContent>
          </Card>
        ) : documents && documents.length > 0 ? (
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

        {/* Add document dialog */}
        <Dialog open={isAddDocumentOpen} onOpenChange={(open) => {
          setIsAddDocumentOpen(open);
          if (!open) { setNewDocTitle(""); setNewDocType(""); setNewDocFile(null); }
        }}>
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
                    <SelectItem value="Bilan de fin du formateur" className="focus:bg-violet-200">Bilan de fin du formateur</SelectItem>
                    <SelectItem value="Compte rendu de l'entretien preparatoire" className="focus:bg-violet-200">Compte rendu de l'entretien preparatoire</SelectItem>
                    <SelectItem value="Contrat" className="focus:bg-violet-200">Contrat</SelectItem>
                    <SelectItem value="Evaluations des acquis : Preuves" className="focus:bg-violet-200">Evaluations des acquis : Preuves</SelectItem>
                    <SelectItem value="Evaluations des acquis : Synthese" className="focus:bg-violet-200">Evaluations des acquis : Synthese</SelectItem>
                    <SelectItem value="Facture" className="focus:bg-violet-200">Facture</SelectItem>
                    <SelectItem value="Feuille de presence" className="focus:bg-violet-200">Feuille de presence</SelectItem>
                    <SelectItem value="Impression : Annexes" className="focus:bg-violet-200">Impression : Annexes</SelectItem>
                    <SelectItem value="Impression : Livret" className="focus:bg-violet-200">Impression : Livret</SelectItem>
                    <SelectItem value="Liste des participants" className="focus:bg-violet-200">Liste des participants</SelectItem>
                    <SelectItem value="Programme" className="focus:bg-violet-200">Programme</SelectItem>
                    <SelectItem value="Questionnaire referent de preparation" className="focus:bg-violet-200">Questionnaire referent de preparation</SelectItem>
                    <SelectItem value="Questionnaires de satisfaction des stagiaires" className="focus:bg-violet-200">Questionnaires de satisfaction des stagiaires</SelectItem>
                    <SelectItem value="Questionnaires stagiaires de positionnement" className="focus:bg-violet-200">Questionnaires stagiaires de positionnement</SelectItem>
                    <SelectItem value="Sequencage" className="focus:bg-violet-200">Sequencage</SelectItem>
                    <SelectItem value="Autre" className="focus:bg-violet-200">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fichier</Label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="cursor-pointer flex-1">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted/50 text-sm">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className={newDocFile ? "text-foreground" : "text-muted-foreground"}>
                        {newDocFile ? newDocFile.name : "Parcourir..."}
                      </span>
                    </div>
                  </label>
                  {newDocFile && (
                    <Button variant="ghost" size="sm" onClick={() => setNewDocFile(null)} className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddDocument} disabled={!newDocTitle.trim() || createDocument.isPending || uploadDocument.isPending}>
                {(createDocument.isPending || uploadDocument.isPending) ? "Envoi..." : "Ajouter"}
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
              <div className="text-4xl font-bold">{mission.expectedParticipants || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Participants prevus</p>
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
                    En option
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
              const count = visibleSteps?.filter((s: any) => s.status === status).length || 0;
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
              <Button variant="ghost" size="sm" onClick={() => guardedNavigate("/missions")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{mission.title}</h1>
                  {getStatusBadge(mission.status as MissionStatus)}
                  {mission.isOriginal && childMissions && childMissions.length > 0 && (
                    <Badge className="bg-purple-100 text-purple-700 border border-purple-300">Original</Badge>
                  )}
                  {mission.parentMissionId && (
                    <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300">Copie</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {client?.name || "Client non defini"}
                </p>
              </div>
              {isAdmin && !mission.parentMissionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateSimple}
                  disabled={duplicateMissionSimple.isPending}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {duplicateMissionSimple.isPending ? "Duplication..." : "Dupliquer"}
                </Button>
              )}
            </div>

            {/* Banner if this is a copy */}
            {mission.parentMissionId && parentMission && (
              <div className="mt-2 flex items-center gap-2 text-sm bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <Copy className="w-4 h-4 text-indigo-500" />
                <span className="text-indigo-700">
                  Copie de{" "}
                  <Link href={`/missions/${parentMission.id}`} className="font-medium underline hover:text-indigo-900">
                    {parentMission.title}
                  </Link>
                </span>
                <Link href={`/missions/${parentMission.id}`}>
                  <ExternalLink className="w-3 h-3 text-indigo-500" />
                </Link>
              </div>
            )}

            {/* Child missions list for originals */}
            {isAdmin && mission.isOriginal && childMissions && childMissions.length > 0 && (
              <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="text-sm font-medium text-purple-700 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Copies formateurs ({childMissions.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {childMissions.map((child: any) => {
                    const childTrainer = trainers?.find((t: any) => t.id === child.trainerId);
                    return (
                      <Link key={child.id} href={`/missions/${child.id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-purple-100 border-purple-300 text-purple-700">
                          {childTrainer ? `${childTrainer.firstName} ${childTrainer.lastName}` : `Mission #${child.id}`}
                          {" - "}
                          {getStatusBadge(child.status as MissionStatus)}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 pb-32">
          {renderStepContent()}
        </div>

        {/* Duplication dialog */}
        <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Dupliquer pour des formateurs</DialogTitle>
              <DialogDescription>
                Selectionnez un ou plusieurs formateurs. Chaque formateur recevra une copie independante de cette mission avec ses sessions et participants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Popover open={duplicateTrainerOpen} onOpenChange={setDuplicateTrainerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Rechercher un formateur...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Rechercher un formateur..."
                      value={duplicateTrainerSearch}
                      onValueChange={setDuplicateTrainerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Aucun formateur disponible</CommandEmpty>
                      <CommandGroup>
                        {availableTrainersForDuplication
                          .filter((t: any) => !selectedTrainerIds.includes(t.id))
                          .sort((a: any, b: any) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "fr"))
                          .map((t: any) => (
                            <CommandItem
                              key={t.id}
                              value={t.id}
                              onSelect={() => {
                                setSelectedTrainerIds([...selectedTrainerIds, t.id]);
                                setDuplicateTrainerSearch("");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{t.firstName} {t.lastName}</span>
                                {t.email && <span className="text-xs text-muted-foreground">{t.email}</span>}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedTrainerIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTrainerIds.map((id) => {
                    const t = trainers?.find((tr: any) => tr.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1 py-1">
                        <span>{t ? `${t.firstName} ${t.lastName}` : id}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTrainerIds(selectedTrainerIds.filter(tid => tid !== id))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedTrainerIds.length} formateur(s) selectionne(s)
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDuplicateOpen(false); setSelectedTrainerIds([]); }}>
                Annuler
              </Button>
              <Button
                onClick={handleDuplicateMission}
                disabled={selectedTrainerIds.length === 0 || duplicateMissionMulti.isPending}
              >
                {duplicateMissionMulti.isPending
                  ? "Duplication..."
                  : `Dupliquer (${selectedTrainerIds.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrees</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrees. Si vous quittez maintenant, vos changements seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Rester sur la page
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
