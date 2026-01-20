import type { Express } from "express";
import { isAuthenticated } from "./auth";
import { requireRole } from "./middleware/rbac";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";

// AI-generated questions template for training feedback
const AI_QUESTIONS = [
  {
    questionText: "Comment evaluez-vous la qualite globale de cette formation ?",
    questionType: "rating",
    order: 1,
    isRequired: true,
  },
  {
    questionText: "Le contenu de la formation correspondait-il a vos attentes ?",
    questionType: "rating",
    order: 2,
    isRequired: true,
  },
  {
    questionText: "Comment evaluez-vous la clarte des explications du formateur ?",
    questionType: "rating",
    order: 3,
    isRequired: true,
  },
  {
    questionText: "Le formateur etait-il a l'ecoute et disponible pour repondre a vos questions ?",
    questionType: "yes_no",
    order: 4,
    isRequired: true,
  },
  {
    questionText: "Les supports pedagogiques (documents, presentations) etaient-ils adaptes ?",
    questionType: "rating",
    order: 5,
    isRequired: true,
  },
  {
    questionText: "La duree de la formation etait-elle adaptee au contenu ?",
    questionType: "multiple_choice",
    options: ["Trop courte", "Adaptee", "Trop longue"],
    order: 6,
    isRequired: true,
  },
  {
    questionText: "Pensez-vous pouvoir appliquer les connaissances acquises dans votre travail quotidien ?",
    questionType: "yes_no",
    order: 7,
    isRequired: true,
  },
  {
    questionText: "Recommanderiez-vous cette formation a un collegue ?",
    questionType: "yes_no",
    order: 8,
    isRequired: true,
  },
  {
    questionText: "Quels sont les points forts de cette formation ?",
    questionType: "text",
    order: 9,
    isRequired: false,
  },
  {
    questionText: "Quelles ameliorations suggereriez-vous pour cette formation ?",
    questionType: "text",
    order: 10,
    isRequired: false,
  },
];

export function registerFeedbackRoutes(app: Express) {
  // Get all missions with participants and feedback data
  app.get("/api/feedback/missions", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missions = await storage.getMissions();

      const missionsWithData = await Promise.all(
        missions.map(async (mission) => {
          // Get participants
          const missionParticipants = await storage.getMissionParticipants(mission.id);

          // Get client
          const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

          // Get program
          const program = mission.programId ? await storage.getTrainingProgram(mission.programId) : null;

          // Get questionnaire
          const questionnaire = await storage.getFeedbackQuestionnaireByMission(mission.id);

          // Get response stats if questionnaire exists
          let responseStats = null;
          if (questionnaire) {
            const tokens = await storage.getFeedbackTokensByQuestionnaire(questionnaire.id);
            responseStats = {
              total: tokens.length,
              completed: tokens.filter(t => t.completedAt).length,
            };
          }

          // Get feedback status for each participant
          const participantsWithFeedback = await Promise.all(
            missionParticipants.map(async (mp) => {
              let feedbackStatus: 'pending' | 'sent' | 'completed' = 'pending';

              if (questionnaire) {
                const token = await storage.getFeedbackTokenByParticipant(
                  questionnaire.id,
                  mp.participantId
                );
                if (token) {
                  feedbackStatus = token.completedAt ? 'completed' : 'sent';
                }
              }

              const participant = await storage.getParticipant(mp.participantId);
              return {
                participant,
                status: mp.status,
                feedbackStatus,
              };
            })
          );

          return {
            ...mission,
            participants: participantsWithFeedback.filter(p => p.participant),
            client: client ? { name: client.name } : null,
            program: program ? { title: program.title } : null,
            questionnaire,
            responseStats,
          };
        })
      );

      // Filter to only show missions with participants
      const missionsWithParticipants = missionsWithData.filter(
        m => m.participants && m.participants.length > 0
      );

      res.json(missionsWithParticipants);
    } catch (error) {
      console.error("Error fetching feedback missions:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Generate AI questionnaire for a mission
  app.post("/api/feedback/questionnaires/generate", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { missionId } = req.body;

      if (!missionId) {
        return res.status(400).json({ message: "missionId requis" });
      }

      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission non trouvee" });
      }

      // Check if questionnaire already exists
      const existing = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (existing) {
        return res.status(400).json({ message: "Un questionnaire existe deja pour cette mission" });
      }

      // Create questionnaire
      const questionnaire = await storage.createFeedbackQuestionnaire({
        missionId,
        title: `Questionnaire de satisfaction - ${mission.title}`,
        description: "Merci de prendre quelques minutes pour evaluer cette formation. Vos retours nous aident a ameliorer nos services.",
        status: "active",
        generatedByAI: true,
      });

      // Create questions
      for (const q of AI_QUESTIONS) {
        await storage.createFeedbackQuestion({
          questionnaireId: questionnaire.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          order: q.order,
          isRequired: q.isRequired,
        });
      }

      res.status(201).json(questionnaire);
    } catch (error) {
      console.error("Error generating questionnaire:", error);
      res.status(500).json({ message: "Erreur lors de la generation" });
    }
  });

  // Send questionnaire by email to selected participants
  app.post("/api/feedback/questionnaires/:missionId/send-email", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);
      const { participantIds } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "participantIds requis" });
      }

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission non trouvee" });
      }

      let sent = 0;
      const errors: string[] = [];

      for (const participantId of participantIds) {
        try {
          const participant = await storage.getParticipant(participantId);
          if (!participant || !participant.email) {
            errors.push(`Participant ${participantId}: email manquant`);
            continue;
          }

          // Check if token already exists
          let token = await storage.getFeedbackTokenByParticipant(questionnaire.id, participantId);

          if (!token) {
            // Generate unique token
            const tokenString = randomBytes(32).toString("hex");
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

            token = await storage.createFeedbackResponseToken({
              questionnaireId: questionnaire.id,
              participantId,
              token: tokenString,
              sentAt: new Date(),
              sentVia: "email",
              expiresAt,
            });
          } else if (!token.sentAt) {
            // Update sent info
            await storage.updateFeedbackResponseToken(token.id, {
              sentAt: new Date(),
              sentVia: "email",
            });
          }

          // Note: In production, you would send an actual email here
          // For now, we just mark it as sent
          // await sendFeedbackEmail(participant, mission, token.token);

          sent++;
        } catch (err) {
          errors.push(`Participant ${participantId}: ${(err as Error).message}`);
        }
      }

      res.json({ sent, errors });
    } catch (error) {
      console.error("Error sending questionnaire emails:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi" });
    }
  });

  // Generate QR code for questionnaire
  app.post("/api/feedback/questionnaires/:missionId/qr-code", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      // Get or create a generic token for QR code access
      // This creates a token that can be used by any participant
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission non trouvee" });
      }

      // Generate the questionnaire URL
      const baseUrl = process.env.BASE_URL || `https://${req.get("host")}`;

      // For QR code, we'll create a special URL that allows selecting participant
      // Or we can use the first participant as default
      const participants = await storage.getMissionParticipants(missionId);
      if (participants.length === 0) {
        return res.status(400).json({ message: "Aucun participant dans cette mission" });
      }

      // Create tokens for all participants if not exist
      for (const mp of participants) {
        let token = await storage.getFeedbackTokenByParticipant(questionnaire.id, mp.participantId);
        if (!token) {
          const tokenString = randomBytes(32).toString("hex");
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await storage.createFeedbackResponseToken({
            questionnaireId: questionnaire.id,
            participantId: mp.participantId,
            token: tokenString,
            sentVia: "qr_code",
            expiresAt,
          });
        }
      }

      // Generate a "selector" URL that lists all participants
      // For simplicity, we'll use the first participant's token
      const firstParticipant = participants[0];
      const token = await storage.getFeedbackTokenByParticipant(questionnaire.id, firstParticipant.participantId);

      if (!token) {
        return res.status(500).json({ message: "Erreur lors de la generation du token" });
      }

      const questionnaireUrl = `${baseUrl}/questionnaire/${token.token}`;

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(questionnaireUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      res.json({
        qrCodeUrl: qrCodeDataUrl,
        questionnaireUrl,
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Erreur lors de la generation du QR code" });
    }
  });

  // Public: Get questionnaire for response
  app.get("/api/feedback/respond/:token", async (req, res) => {
    try {
      const tokenString = req.params.token;

      const token = await storage.getFeedbackResponseTokenByToken(tokenString);
      if (!token) {
        return res.status(404).json({ message: "Lien invalide" });
      }

      // Check expiry
      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Ce lien a expire" });
      }

      // Check if already completed
      if (token.completedAt) {
        return res.json({ alreadyCompleted: true });
      }

      const questionnaire = await storage.getFeedbackQuestionnaire(token.questionnaireId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const questions = await storage.getFeedbackQuestions(questionnaire.id);
      const mission = await storage.getMission(questionnaire.missionId);
      const participant = await storage.getParticipant(token.participantId);

      res.json({
        questionnaire: {
          id: questionnaire.id,
          title: questionnaire.title,
          description: questionnaire.description,
        },
        questions: questions.sort((a, b) => a.order - b.order),
        mission: mission ? {
          title: mission.title,
          startDate: mission.startDate,
          endDate: mission.endDate,
        } : null,
        participant: participant ? {
          firstName: participant.firstName,
          lastName: participant.lastName,
        } : null,
        alreadyCompleted: false,
      });
    } catch (error) {
      console.error("Error fetching questionnaire for response:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Public: Submit questionnaire responses
  app.post("/api/feedback/respond/:token", async (req, res) => {
    try {
      const tokenString = req.params.token;
      const { responses } = req.body;

      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({ message: "Reponses manquantes" });
      }

      const token = await storage.getFeedbackResponseTokenByToken(tokenString);
      if (!token) {
        return res.status(404).json({ message: "Lien invalide" });
      }

      // Check expiry
      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Ce lien a expire" });
      }

      // Check if already completed
      if (token.completedAt) {
        return res.status(400).json({ message: "Vous avez deja repondu a ce questionnaire" });
      }

      // Save responses
      for (const response of responses) {
        await storage.createFeedbackResponse({
          tokenId: token.id,
          questionId: response.questionId,
          ratingValue: response.ratingValue || null,
          textValue: response.textValue || null,
          selectedOptions: response.selectedOptions || null,
          booleanValue: response.booleanValue !== undefined ? response.booleanValue : null,
        });
      }

      // Mark token as completed
      await storage.updateFeedbackResponseToken(token.id, {
        completedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting responses:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi des reponses" });
    }
  });

  // Get questionnaire with questions
  app.get("/api/feedback/questionnaires/:missionId", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const questions = await storage.getFeedbackQuestions(questionnaire.id);

      res.json({
        ...questionnaire,
        questions: questions.sort((a, b) => a.order - b.order),
      });
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Update questionnaire questions
  app.put("/api/feedback/questionnaires/:missionId", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);
      const { title, description, questions } = req.body;

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      // Update questionnaire title/description if provided
      if (title || description) {
        await storage.updateFeedbackQuestionnaire(questionnaire.id, {
          title: title || questionnaire.title,
          description: description !== undefined ? description : questionnaire.description,
        });
      }

      // Update questions if provided
      if (questions && Array.isArray(questions)) {
        // Delete existing questions
        await storage.deleteFeedbackQuestions(questionnaire.id);

        // Create new questions
        for (const q of questions) {
          await storage.createFeedbackQuestion({
            questionnaireId: questionnaire.id,
            questionText: q.questionText,
            questionType: q.questionType || "rating",
            options: q.options || null,
            order: q.order,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
          });
        }
      }

      // Return updated questionnaire
      const updatedQuestionnaire = await storage.getFeedbackQuestionnaire(questionnaire.id);
      const updatedQuestions = await storage.getFeedbackQuestions(questionnaire.id);

      res.json({
        ...updatedQuestionnaire,
        questions: updatedQuestions.sort((a, b) => a.order - b.order),
      });
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      res.status(500).json({ message: "Erreur lors de la mise a jour" });
    }
  });

  // Get questionnaire results/statistics
  app.get("/api/feedback/questionnaires/:missionId/results", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const questions = await storage.getFeedbackQuestions(questionnaire.id);
      const tokens = await storage.getFeedbackTokensByQuestionnaire(questionnaire.id);
      const completedTokens = tokens.filter(t => t.completedAt);

      // Get all responses
      const results = await Promise.all(
        questions.map(async (question) => {
          const responses = await storage.getFeedbackResponsesByQuestion(question.id);

          let summary: any = { questionId: question.id, question: question.questionText, type: question.questionType };

          if (question.questionType === "rating") {
            const ratings = responses.filter(r => r.ratingValue).map(r => r.ratingValue!);
            summary.average = ratings.length > 0
              ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
              : 0;
            summary.distribution = [1, 2, 3, 4, 5].map(r => ({
              rating: r,
              count: ratings.filter(v => v === r).length,
            }));
          } else if (question.questionType === "yes_no") {
            const yes = responses.filter(r => r.booleanValue === true).length;
            const no = responses.filter(r => r.booleanValue === false).length;
            summary.yes = yes;
            summary.no = no;
            summary.yesPercentage = yes + no > 0 ? Math.round((yes / (yes + no)) * 100) : 0;
          } else if (question.questionType === "text") {
            summary.responses = responses.filter(r => r.textValue).map(r => r.textValue);
          } else if (question.questionType === "multiple_choice") {
            const options = question.options as string[] || [];
            summary.distribution = options.map(opt => ({
              option: opt,
              count: responses.filter(r => r.selectedOptions?.includes(opt)).length,
            }));
          }

          return summary;
        })
      );

      res.json({
        totalParticipants: tokens.length,
        completedResponses: completedTokens.length,
        completionRate: tokens.length > 0
          ? Math.round((completedTokens.length / tokens.length) * 100)
          : 0,
        results,
      });
    } catch (error) {
      console.error("Error fetching questionnaire results:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get detailed responses for a questionnaire
  app.get("/api/feedback/questionnaires/:missionId/responses", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const questions = await storage.getFeedbackQuestions(questionnaire.id);
      const tokens = await storage.getFeedbackTokensByQuestionnaire(questionnaire.id);
      const completedTokens = tokens.filter(t => t.completedAt);

      // Get detailed responses for each completed participant
      const detailedResponses = await Promise.all(
        completedTokens.map(async (token) => {
          const participant = await storage.getParticipant(token.participantId);
          const responses = await storage.getFeedbackResponsesByToken(token.id);

          // Map responses to questions
          const answeredQuestions = questions.map(question => {
            const response = responses.find(r => r.questionId === question.id);
            let answer: any = null;

            if (response) {
              if (question.questionType === "rating") {
                answer = response.ratingValue;
              } else if (question.questionType === "text") {
                answer = response.textValue;
              } else if (question.questionType === "yes_no") {
                answer = response.booleanValue;
              } else if (question.questionType === "multiple_choice") {
                answer = response.selectedOptions;
              }
            }

            return {
              questionId: question.id,
              questionText: question.questionText,
              questionType: question.questionType,
              answer,
            };
          });

          return {
            participantId: token.participantId,
            participant: participant ? {
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
            } : null,
            completedAt: token.completedAt,
            responses: answeredQuestions,
          };
        })
      );

      res.json({
        questionnaire: {
          id: questionnaire.id,
          title: questionnaire.title,
          missionId: questionnaire.missionId,
        },
        questions: questions.sort((a, b) => a.order - b.order),
        totalParticipants: tokens.length,
        completedResponses: completedTokens.length,
        responses: detailedResponses,
      });
    } catch (error) {
      console.error("Error fetching detailed responses:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Export responses to Excel
  app.get("/api/feedback/questionnaires/:missionId/export-excel", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);

      const questionnaire = await storage.getFeedbackQuestionnaireByMission(missionId);
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire non trouve" });
      }

      const mission = await storage.getMission(missionId);
      const questions = await storage.getFeedbackQuestions(questionnaire.id);
      const sortedQuestions = questions.sort((a, b) => a.order - b.order);
      const tokens = await storage.getFeedbackTokensByQuestionnaire(questionnaire.id);
      const completedTokens = tokens.filter(t => t.completedAt);

      // Build Excel data
      const excelData: any[] = [];

      // Header row
      const headerRow = [
        "Participant",
        "Email",
        "Date de reponse",
        ...sortedQuestions.map(q => q.questionText)
      ];
      excelData.push(headerRow);

      // Data rows
      for (const token of completedTokens) {
        const participant = await storage.getParticipant(token.participantId);
        const responses = await storage.getFeedbackResponsesByToken(token.id);

        const row = [
          participant ? `${participant.firstName} ${participant.lastName}` : "Inconnu",
          participant?.email || "",
          token.completedAt ? new Date(token.completedAt).toLocaleDateString("fr-FR") : "",
        ];

        // Add answers for each question
        for (const question of sortedQuestions) {
          const response = responses.find(r => r.questionId === question.id);
          let answer = "";

          if (response) {
            if (question.questionType === "rating") {
              answer = response.ratingValue?.toString() || "";
            } else if (question.questionType === "text") {
              answer = response.textValue || "";
            } else if (question.questionType === "yes_no") {
              answer = response.booleanValue === true ? "Oui" : response.booleanValue === false ? "Non" : "";
            } else if (question.questionType === "multiple_choice") {
              answer = (response.selectedOptions as string[] || []).join(", ");
            }
          }

          row.push(answer);
        }

        excelData.push(row);
      }

      // Create summary sheet
      const summaryData: any[] = [
        ["Questionnaire de satisfaction"],
        [""],
        ["Mission", mission?.title || ""],
        ["Reference", mission?.reference || ""],
        ["Total participants", tokens.length],
        ["Reponses recues", completedTokens.length],
        ["Taux de reponse", `${tokens.length > 0 ? Math.round((completedTokens.length / tokens.length) * 100) : 0}%`],
        [""],
        ["Resume par question"],
        [""],
      ];

      // Add summary for each question
      for (const question of sortedQuestions) {
        summaryData.push([question.questionText]);

        const allResponses = await storage.getFeedbackResponsesByQuestion(question.id);

        if (question.questionType === "rating") {
          const ratings = allResponses.filter(r => r.ratingValue).map(r => r.ratingValue!);
          const avg = ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : "N/A";
          summaryData.push(["Moyenne", avg]);
          summaryData.push(["Distribution"]);
          for (let i = 1; i <= 5; i++) {
            const count = ratings.filter(r => r === i).length;
            summaryData.push([`  ${i} etoile(s)`, count]);
          }
        } else if (question.questionType === "yes_no") {
          const yes = allResponses.filter(r => r.booleanValue === true).length;
          const no = allResponses.filter(r => r.booleanValue === false).length;
          summaryData.push(["Oui", yes]);
          summaryData.push(["Non", no]);
        } else if (question.questionType === "multiple_choice") {
          const options = question.options as string[] || [];
          for (const opt of options) {
            const count = allResponses.filter(r => (r.selectedOptions as string[] || []).includes(opt)).length;
            summaryData.push([opt, count]);
          }
        } else if (question.questionType === "text") {
          summaryData.push(["Reponses textuelles", allResponses.filter(r => r.textValue).length]);
        }

        summaryData.push([""]);
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add responses sheet
      const wsResponses = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, wsResponses, "Reponses");

      // Add summary sheet
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resume");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      // Set headers for download
      const filename = `feedback_${mission?.reference || missionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Erreur lors de l'export" });
    }
  });
}
