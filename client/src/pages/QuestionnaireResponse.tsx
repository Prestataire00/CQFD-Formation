import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Star,
  Send,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import type { FeedbackQuestion } from "@shared/schema";

interface QuestionnaireData {
  questionnaire: {
    id: number;
    title: string;
    description: string;
  };
  questions: FeedbackQuestion[];
  mission: {
    title: string;
    startDate: string;
    endDate: string;
  };
  participant: {
    firstName: string;
    lastName: string;
  };
  alreadyCompleted: boolean;
}

interface ResponseValue {
  questionId: number;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: string[];
  booleanValue?: boolean;
}

export default function QuestionnaireResponse() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<number, ResponseValue>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch questionnaire data
  const { data, isLoading, error } = useQuery<QuestionnaireData>({
    queryKey: [`/api/feedback/respond/${token}`],
    retry: false,
  });

  // Submit responses
  const submitResponses = useMutation({
    mutationFn: async (answers: ResponseValue[]) => {
      const res = await fetch(`/api/feedback/respond/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: answers }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur lors de l'envoi");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Merci !",
        description: "Vos reponses ont ete enregistrees avec succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRatingChange = (questionId: number, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { questionId, ratingValue: value },
    }));
  };

  const handleTextChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { questionId, textValue: value },
    }));
  };

  const handleBooleanChange = (questionId: number, value: boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { questionId, booleanValue: value },
    }));
  };

  const handleMultipleChoiceChange = (questionId: number, option: string) => {
    setResponses(prev => {
      const current = prev[questionId]?.selectedOptions || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return {
        ...prev,
        [questionId]: { questionId, selectedOptions: updated },
      };
    });
  };

  const handleSubmit = () => {
    const answers = Object.values(responses);

    // Check required questions
    const requiredQuestions = data?.questions.filter(q => q.isRequired) || [];
    const missingResponses = requiredQuestions.filter(q => !responses[q.id]);

    if (missingResponses.length > 0) {
      toast({
        title: "Questions obligatoires",
        description: `Veuillez repondre a toutes les questions obligatoires (${missingResponses.length} manquante(s))`,
        variant: "destructive",
      });
      return;
    }

    submitResponses.mutate(answers);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Lien invalide</h2>
            <p className="text-muted-foreground">
              Ce lien de questionnaire est invalide, expire ou a deja ete utilise.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.alreadyCompleted || isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Merci pour vos reponses !</h2>
            <p className="text-muted-foreground">
              Votre avis a bien ete enregistre. Il nous aide a ameliorer la qualite de nos formations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{data.questionnaire.title}</CardTitle>
            <CardDescription className="text-base">
              {data.questionnaire.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <strong>Formation:</strong> {data.mission.title}
              </p>
              <p className="text-sm">
                <strong>Participant:</strong> {data.participant.firstName} {data.participant.lastName}
              </p>
              {data.mission.startDate && (
                <p className="text-sm">
                  <strong>Date:</strong>{" "}
                  {new Date(data.mission.startDate).toLocaleDateString("fr-FR")}
                  {data.mission.endDate && data.mission.endDate !== data.mission.startDate && (
                    <> - {new Date(data.mission.endDate).toLocaleDateString("fr-FR")}</>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        {data.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  {index + 1}
                </span>
                <span>
                  {question.questionText}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.questionType === "rating" && (
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(question.id, rating)}
                      className={`p-3 rounded-lg transition-all ${
                        responses[question.id]?.ratingValue === rating
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          responses[question.id]?.ratingValue &&
                          responses[question.id].ratingValue! >= rating
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {question.questionType === "text" && (
                <Textarea
                  placeholder="Votre reponse..."
                  value={responses[question.id]?.textValue || ""}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                  rows={4}
                />
              )}

              {question.questionType === "yes_no" && (
                <RadioGroup
                  value={responses[question.id]?.booleanValue?.toString()}
                  onValueChange={(value) =>
                    handleBooleanChange(question.id, value === "true")
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${question.id}-yes`} />
                    <Label htmlFor={`${question.id}-yes`}>Oui</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${question.id}-no`} />
                    <Label htmlFor={`${question.id}-no`}>Non</Label>
                  </div>
                </RadioGroup>
              )}

              {question.questionType === "multiple_choice" && question.options && (
                <div className="space-y-2">
                  {(question.options as string[]).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          responses[question.id]?.selectedOptions?.includes(option) || false
                        }
                        onChange={() => handleMultipleChoiceChange(question.id, option)}
                        className="rounded"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Submit button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitResponses.isPending}
              className="w-full gap-2"
              size="lg"
            >
              {submitResponses.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer mes reponses
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          CQFD Formation - Questionnaire de satisfaction
        </p>
      </div>
    </div>
  );
}
