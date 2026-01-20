import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MessageSquareText,
  Users,
  Mail,
  QrCode,
  Sparkles,
  Send,
  CheckCircle2,
  CalendarDays,
  FileText,
  ChevronRight,
  BarChart3,
  Copy,
  ExternalLink,
  Eye,
  Edit,
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Mission, Participant, FeedbackQuestionnaire, FeedbackQuestion } from "@shared/schema";

interface MissionWithParticipants extends Mission {
  participants?: Array<{
    participant: Participant;
    status: string;
    feedbackStatus?: 'pending' | 'sent' | 'completed';
  }>;
  client?: { name: string };
  program?: { title: string };
  questionnaire?: FeedbackQuestionnaire;
  responseStats?: {
    total: number;
    completed: number;
  };
}

export default function Feedback() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMission, setSelectedMission] = useState<MissionWithParticipants | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isViewQuestionnaireOpen, setIsViewQuestionnaireOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<any[]>([]);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [questionnaireTab, setQuestionnaireTab] = useState<"questions" | "responses">("questions");

  // Fetch missions with participants and feedback data
  const { data: missions, isLoading } = useQuery<MissionWithParticipants[]>({
    queryKey: ["/api/feedback/missions"],
  });

  // Generate AI questionnaire
  const generateQuestionnaire = useMutation({
    mutationFn: async (missionId: number) => {
      const res = await fetch(`/api/feedback/questionnaires/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de la generation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/missions"] });
      setIsGenerateDialogOpen(false);
      toast({
        title: "Questionnaire genere",
        description: "Le questionnaire a ete cree avec succes par l'IA.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de generer le questionnaire.",
        variant: "destructive",
      });
    },
  });

  // Send questionnaire via email
  const sendByEmail = useMutation({
    mutationFn: async ({ missionId, participantIds }: { missionId: number; participantIds: number[] }) => {
      const res = await fetch(`/api/feedback/questionnaires/${missionId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/missions"] });
      setIsSendDialogOpen(false);
      setSelectedParticipantIds([]);
      toast({
        title: "Emails envoyes",
        description: `${data.sent} email(s) envoye(s) avec succes.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les emails.",
        variant: "destructive",
      });
    },
  });

  // Fetch questionnaire details
  const { data: questionnaireDetails, refetch: refetchQuestionnaire } = useQuery({
    queryKey: ["/api/feedback/questionnaires", selectedMission?.id],
    queryFn: async () => {
      if (!selectedMission?.id) return null;
      const res = await fetch(`/api/feedback/questionnaires/${selectedMission.id}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedMission?.id && isViewQuestionnaireOpen,
  });

  // Fetch detailed responses
  const { data: responsesData, isLoading: isLoadingResponses } = useQuery({
    queryKey: ["/api/feedback/questionnaires/responses", selectedMission?.id],
    queryFn: async () => {
      if (!selectedMission?.id) return null;
      const res = await fetch(`/api/feedback/questionnaires/${selectedMission.id}/responses`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedMission?.id && isViewQuestionnaireOpen && questionnaireTab === "responses",
  });

  // Update questionnaire
  const updateQuestionnaire = useMutation({
    mutationFn: async ({ missionId, data }: { missionId: number; data: any }) => {
      const res = await fetch(`/api/feedback/questionnaires/${missionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de la mise a jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/missions"] });
      refetchQuestionnaire();
      setIsEditMode(false);
      toast({
        title: "Questionnaire mis a jour",
        description: "Les modifications ont ete enregistrees.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour le questionnaire.",
        variant: "destructive",
      });
    },
  });

  // Generate QR code
  const generateQRCode = useMutation({
    mutationFn: async (missionId: number) => {
      const res = await fetch(`/api/feedback/questionnaires/${missionId}/qr-code`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de la generation du QR code");
      return res.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setIsQRDialogOpen(true);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de generer le QR code.",
        variant: "destructive",
      });
    },
  });

  const filteredMissions = missions?.filter((mission) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mission.title.toLowerCase().includes(searchLower) ||
      mission.reference?.toLowerCase().includes(searchLower) ||
      mission.client?.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSelectAllParticipants = (mission: MissionWithParticipants) => {
    const allIds = mission.participants?.map(p => p.participant.id) || [];
    setSelectedParticipantIds(
      selectedParticipantIds.length === allIds.length ? [] : allIds
    );
  };

  const toggleParticipant = (participantId: number) => {
    setSelectedParticipantIds(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Complete</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700">Envoye</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">En attente</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copie",
      description: "Le lien a ete copie dans le presse-papier.",
    });
  };

  const handleOpenQuestionnaire = (mission: MissionWithParticipants) => {
    setSelectedMission(mission);
    setIsEditMode(false);
    setQuestionnaireTab("questions");
    setIsViewQuestionnaireOpen(true);
  };

  const handleDownloadExcel = async () => {
    if (!selectedMission) return;
    try {
      const response = await fetch(`/api/feedback/questionnaires/${selectedMission.id}/export-excel`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erreur lors du telechargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_${selectedMission.reference || selectedMission.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export reussi",
        description: "Le fichier Excel a ete telecharge.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de telecharger le fichier.",
        variant: "destructive",
      });
    }
  };

  const formatAnswer = (answer: any, type: string) => {
    if (answer === null || answer === undefined) return "Non repondu";

    switch (type) {
      case "rating":
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= answer ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
            <span className="ml-2 text-sm font-medium">{answer}/5</span>
          </div>
        );
      case "yes_no":
        return answer ? (
          <span className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="w-4 h-4" /> Oui
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600">
            <ThumbsDown className="w-4 h-4" /> Non
          </span>
        );
      case "multiple_choice":
        return Array.isArray(answer) ? answer.join(", ") : answer;
      case "text":
        return <span className="italic">{answer}</span>;
      default:
        return String(answer);
    }
  };

  const handleStartEdit = () => {
    if (questionnaireDetails) {
      setEditedTitle(questionnaireDetails.title || "");
      setEditedDescription(questionnaireDetails.description || "");
      setEditedQuestions(questionnaireDetails.questions?.map((q: any) => ({ ...q })) || []);
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedQuestions([]);
  };

  const handleSaveQuestionnaire = () => {
    if (!selectedMission) return;
    updateQuestionnaire.mutate({
      missionId: selectedMission.id,
      data: {
        title: editedTitle,
        description: editedDescription,
        questions: editedQuestions.map((q, index) => ({
          ...q,
          order: index + 1,
        })),
      },
    });
  };

  const handleAddQuestion = () => {
    setEditedQuestions([
      ...editedQuestions,
      {
        questionText: "",
        questionType: "rating",
        options: null,
        order: editedQuestions.length + 1,
        isRequired: true,
      },
    ]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...editedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setEditedQuestions(editedQuestions.filter((_, i) => i !== index));
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'rating': return 'Note (1-5)';
      case 'text': return 'Texte libre';
      case 'yes_no': return 'Oui/Non';
      case 'multiple_choice': return 'Choix multiple';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Feedback" />

        <div className="flex-1 p-6 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MessageSquareText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Questionnaires</p>
                    <p className="text-2xl font-bold">
                      {missions?.filter(m => m.questionnaire).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reponses recues</p>
                    <p className="text-2xl font-bold">
                      {missions?.reduce((acc, m) => acc + (m.responseStats?.completed || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold">
                      {missions?.reduce((acc, m) =>
                        acc + ((m.responseStats?.total || 0) - (m.responseStats?.completed || 0)), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux reponse</p>
                    <p className="text-2xl font-bold">
                      {missions && missions.length > 0
                        ? Math.round(
                            (missions.reduce((acc, m) => acc + (m.responseStats?.completed || 0), 0) /
                             Math.max(missions.reduce((acc, m) => acc + (m.responseStats?.total || 0), 0), 1)) * 100
                          )
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Missions list */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageSquareText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune mission</h3>
              <p className="text-muted-foreground">
                Les missions avec participants apparaitront ici.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredMissions.map((mission) => (
                <AccordionItem
                  key={mission.id}
                  value={`mission-${mission.id}`}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{mission.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {mission.reference} - {mission.client?.name}
                          </p>
                          {mission.startDate && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(mission.startDate).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                              {mission.endDate && mission.endDate !== mission.startDate && (
                                <> - {new Date(mission.endDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })}</>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {mission.participants?.length || 0} participants
                        </div>
                        {mission.questionnaire ? (
                          <Badge className="bg-green-100 text-green-700">
                            Questionnaire pret
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sans questionnaire</Badge>
                        )}
                        {mission.responseStats && mission.responseStats.total > 0 && (
                          <Badge variant="outline">
                            {mission.responseStats.completed}/{mission.responseStats.total} reponses
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {!mission.questionnaire ? (
                          <Button
                            onClick={() => {
                              setSelectedMission(mission);
                              setIsGenerateDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generer questionnaire IA
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleOpenQuestionnaire(mission)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Voir le questionnaire
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedMission(mission);
                                setSelectedParticipantIds([]);
                                setIsSendDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Envoyer par email
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedMission(mission);
                                generateQRCode.mutate(mission.id);
                              }}
                              className="gap-2"
                            >
                              <QrCode className="w-4 h-4" />
                              Generer QR Code
                            </Button>
                            {mission.responseStats && mission.responseStats.completed > 0 && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedMission(mission);
                                  setTimeout(() => handleDownloadExcel(), 100);
                                }}
                                className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <Download className="w-4 h-4" />
                                Exporter Excel ({mission.responseStats.completed})
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Participants list */}
                      <div className="border rounded-lg divide-y">
                        <div className="px-4 py-3 bg-muted/50 font-medium text-sm">
                          Participants
                        </div>
                        {mission.participants && mission.participants.length > 0 ? (
                          mission.participants.map(({ participant, feedbackStatus }) => (
                            <div
                              key={participant.id}
                              className="px-4 py-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {participant.firstName[0]}{participant.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {participant.firstName} {participant.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {participant.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(feedbackStatus)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-muted-foreground">
                            Aucun participant pour cette mission
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>

      {/* Generate Questionnaire Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generer un questionnaire IA
            </DialogTitle>
            <DialogDescription>
              L'IA va generer automatiquement un questionnaire de satisfaction adapte
              a cette formation: <strong>{selectedMission?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Le questionnaire comprendra des questions sur:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                La qualite du contenu de la formation
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                La pedagogie du formateur
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                L'organisation et la logistique
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                Les attentes et la satisfaction globale
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedMission && generateQuestionnaire.mutate(selectedMission.id)}
              disabled={generateQuestionnaire.isPending}
              className="gap-2"
            >
              {generateQuestionnaire.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generation en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send by Email Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Envoyer le questionnaire par email
            </DialogTitle>
            <DialogDescription>
              Selectionnez les participants qui recevront le questionnaire par email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">
                {selectedParticipantIds.length} selectionne(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedMission && handleSelectAllParticipants(selectedMission)}
              >
                {selectedParticipantIds.length === (selectedMission?.participants?.length || 0)
                  ? "Tout deselectionner"
                  : "Tout selectionner"}
              </Button>
            </div>
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {selectedMission?.participants?.map(({ participant, feedbackStatus }) => (
                <label
                  key={participant.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipantIds.includes(participant.id)}
                    onChange={() => toggleParticipant(participant.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{participant.email}</p>
                  </div>
                  {feedbackStatus === 'completed' && (
                    <Badge className="bg-green-100 text-green-700">Deja repondu</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                selectedMission &&
                sendByEmail.mutate({
                  missionId: selectedMission.id,
                  participantIds: selectedParticipantIds,
                })
              }
              disabled={sendByEmail.isPending || selectedParticipantIds.length === 0}
              className="gap-2"
            >
              {sendByEmail.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer ({selectedParticipantIds.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR Code du questionnaire
            </DialogTitle>
            <DialogDescription>
              Les participants peuvent scanner ce QR code pour acceder au questionnaire.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            {qrCodeUrl ? (
              <>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64 border rounded-lg"
                />
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(qrCodeUrl)}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copier le lien
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(qrCodeUrl, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir
                  </Button>
                </div>
              </>
            ) : (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQRDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Questionnaire Dialog */}
      <Dialog open={isViewQuestionnaireOpen} onOpenChange={(open) => {
        setIsViewQuestionnaireOpen(open);
        if (!open) {
          setIsEditMode(false);
          setEditedQuestions([]);
          setQuestionnaireTab("questions");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {isEditMode ? "Modifier le questionnaire" : "Questionnaire de satisfaction"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!isEditMode && questionnaireDetails && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="gap-2">
                      <Download className="w-4 h-4" />
                      Exporter Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-2">
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Button>
                  </>
                )}
              </div>
            </div>
            {!isEditMode && questionnaireDetails && (
              <DialogDescription>
                {questionnaireDetails.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Tabs */}
          {!isEditMode && questionnaireDetails && (
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setQuestionnaireTab("questions")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  questionnaireTab === "questions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Questions ({questionnaireDetails.questions?.length || 0})
              </button>
              <button
                onClick={() => setQuestionnaireTab("responses")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  questionnaireTab === "responses"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Reponses ({selectedMission?.responseStats?.completed || 0})
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4">
            {!questionnaireDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isEditMode ? (
              /* Edit Mode */
              <div className="space-y-6">
                {/* Title and description */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label>Titre du questionnaire</Label>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Titre du questionnaire"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Description affichee aux participants..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Questions ({editedQuestions.length})</h3>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter une question
                    </Button>
                  </div>

                  {editedQuestions.map((question, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label>Question</Label>
                              <Textarea
                                value={question.questionText}
                                onChange={(e) => handleUpdateQuestion(index, "questionText", e.target.value)}
                                placeholder="Texte de la question..."
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Type de reponse</Label>
                                <Select
                                  value={question.questionType}
                                  onValueChange={(value) => handleUpdateQuestion(index, "questionType", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rating">Note (1-5)</SelectItem>
                                    <SelectItem value="text">Texte libre</SelectItem>
                                    <SelectItem value="yes_no">Oui/Non</SelectItem>
                                    <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2 pt-6">
                                <Switch
                                  checked={question.isRequired}
                                  onCheckedChange={(checked) => handleUpdateQuestion(index, "isRequired", checked)}
                                />
                                <Label className="font-normal">Obligatoire</Label>
                              </div>
                            </div>
                            {question.questionType === "multiple_choice" && (
                              <div>
                                <Label>Options (une par ligne)</Label>
                                <Textarea
                                  value={(question.options || []).join("\n")}
                                  onChange={(e) => handleUpdateQuestion(index, "options", e.target.value.split("\n").filter(o => o.trim()))}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteQuestion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {editedQuestions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucune question. Cliquez sur "Ajouter une question" pour commencer.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : questionnaireTab === "questions" ? (
              /* Questions Tab */
              <div className="space-y-4">
                {questionnaireDetails.generatedByAI && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Questionnaire genere par l'IA</span>
                  </div>
                )}

                <div className="space-y-3">
                  {questionnaireDetails.questions?.map((question: FeedbackQuestion, index: number) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{question.questionText}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                          {question.isRequired && (
                            <span className="text-red-600">* Obligatoire</span>
                          )}
                        </div>
                        {question.questionType === "multiple_choice" && question.options && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(question.options as string[]).map((option, i) => (
                              <Badge key={i} variant="secondary">{option}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(!questionnaireDetails.questions || questionnaireDetails.questions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune question dans ce questionnaire.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Responses Tab */
              <div className="space-y-4">
                {isLoadingResponses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : responsesData && responsesData.responses?.length > 0 ? (
                  <>
                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{responsesData.completedResponses}</p>
                        <p className="text-sm text-muted-foreground">Reponses recues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{responsesData.totalParticipants}</p>
                        <p className="text-sm text-muted-foreground">Total participants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {responsesData.totalParticipants > 0
                            ? Math.round((responsesData.completedResponses / responsesData.totalParticipants) * 100)
                            : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Taux de reponse</p>
                      </div>
                    </div>

                    {/* Individual responses */}
                    <Accordion type="single" collapsible className="space-y-2">
                      {responsesData.responses.map((response: any, idx: number) => (
                        <AccordionItem
                          key={response.participantId}
                          value={`response-${response.participantId}`}
                          className="border rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {response.participant?.firstName?.[0]}{response.participant?.lastName?.[0]}
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-medium">
                                  {response.participant?.firstName} {response.participant?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Repondu le {response.completedAt
                                    ? new Date(response.completedAt).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })
                                    : "Date inconnue"}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3 mt-2">
                              {response.responses?.map((answer: any, ansIdx: number) => (
                                <div key={ansIdx} className="p-3 bg-muted/30 rounded-lg">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">
                                    {ansIdx + 1}. {answer.questionText}
                                  </p>
                                  <div className="text-sm">
                                    {formatAnswer(answer.answer, answer.questionType)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquareText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aucune reponse recue</p>
                    <p className="text-sm">Les reponses des participants apparaitront ici.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveQuestionnaire}
                  disabled={updateQuestionnaire.isPending || editedQuestions.length === 0}
                  className="gap-2"
                >
                  {updateQuestionnaire.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsViewQuestionnaireOpen(false)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
