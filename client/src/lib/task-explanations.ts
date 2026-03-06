export interface TaskExplanation {
  taskName: string;
  explanation: string;
}

export const TASK_EXPLANATIONS: TaskExplanation[] = [
  {
    taskName: "Envoi compte-rendu entretien cadrage",
    explanation: `L'entretien de preparation permet de prendre connaissance du contexte du client et d'ajuster l'approche pedagogique si besoin. Il faut le realiser en amont et le plus vite possible une fois que les coordonnees du client ont ete communiquees pour s'assurer que les demandes du client sont bien dans les axes predefinis, que les attentes et objectifs sont realisables.

L'ideal est de realiser l'entretien telephonique ou en visio rapidement car c'est le point de depart pour ajuster l'approche et preparer le livret. Les consequences d'un appel tardif peuvent etre tres impactantes, voire catastrophiques (annulation de la formation sans indemnisation).

Conseils importants :
- Ne pas appeler en voiture (mal percu par le client)
- Privilegier le contact client via CQFD sans donner votre email personnel
- Les echanges doivent transiter par CQFD pour la tracabilite qualite
- Verifier la coherence du lieu et des horaires avec les informations recues
- En cas de besoin d'equipement dans la salle de formation, prevenir rapidement

Exemple de support : https://www.cqfd-formation.fr/docs/Entretien-diagnostic-support-compte-rendu.pdf
ou https://forms.gle/G2GRpCVVkYTTcfM27`
  },
  {
    taskName: "Envoi programme ajuste et sequencage",
    explanation: `Un questionnaire de positionnement est retourne par chaque participant (sur base du volontariat) pour cerner les attentes des stagiaires.

L'envoi du compte rendu d'entretien de preparation sera l'occasion de communiquer a CQFD la version definitive du PROGRAMME avec, le cas echeant, des objectifs pedagogiques personnalises, contextualises, precis.

CQFD a besoin du SEQUENCAGE du programme : sequence / duree / objectif(s) / contenu programme / methodes et moyens pedagogiques / modalites d'evaluation des acquis. Les objectifs pourront utiliser des verbes d'actions de la taxonomie de Bloom.

Subtilites du sequencage :
- Prevoir environ 30 mn le 1er jour en introduction, presentation du programme, tour de table et evaluation initiale
- Le dernier jour : 30 minutes pour la conclusion, l'evaluation des acquis et le recueil de la satisfaction
- Si formation sur plusieurs jours : 10 mn en debut de chaque journee pour un eveil pedagogique et un bilan rapide en 5 mn a chaque fin de journee

Important : Les echanges doivent transiter par CQFD (mail interne attribue) et non par telephone pour garder des traces ecrites en cas de litige.`
  },
  {
    taskName: "Envoi des adaptations si handicap",
    explanation: `Dans le cas de stagiaires presentant un handicap, il faudra presenter :
- Les difficultes rencontrees par les stagiaires (autonomie, motricite/coordination, expression/comprehension et raisonnement, cognition, socialisation et relation a l'autre, ou autres capacites atteintes)
- Les compensations proposees (amenagements, accessibilite, adaptations pedagogiques du rythme, des outils...)

Pour memoire, CQFD peut etre une ressource d'informations et d'idees pedagogiques et ainsi vous soutenir.`
  },
  {
    taskName: "Envoi contrat de prestation de sous-traitance",
    explanation: `Compte-tenu de la certification QUALIOPI, CQFD ne peut travailler qu'avec des sous-traitants qui repondent aux points du cahier des charges. L'esprit de Qualiopi repose sur l'adaptation du contenu aux besoins reels, la definition d'objectifs pedagogiques mesurables, une evaluation des competences avant/apres, et le recueil des feedbacks.

Il faudra fournir :
- Un devis precisant le detail de la prestation (conception, preparation, animation...) avec les frais de deplacement le cas echeant
- Vos conditions de vente avec les clauses particulieres
- Une attestation de vigilance (au moins une fois par an)
- Une attestation de non assujettissement a TVA (le cas echeant)

Pour une mission en province avec budget deplacement/hebergement, reservez bien en amont pour respecter le budget. Pour une mission a plus de 2 heures, CQFD demande de dormir la veille dans un hotel a proximite.`
  },
  {
    taskName: "Envoi pour impressions livret et annexes",
    explanation: `A propos de l'evaluation des acquis : au-dela de l'obligation legale de prouver que la formation a servi a developper les competences, avoir une evaluation objective (trace ecrite) permet aussi en cas de litige de prouver la progression. Voir : https://www.cqfd-formation.fr/evaluation-des-acquis-de-la-formation.htm

Il est recommande 20 a 40 questions pour une bonne evaluation. Quand un participant n'a pas ete present a toute la formation, indiquer NON EVALUE sur les objectifs vus en son absence.

Livret pour les stagiaires :
- Le fichier doit etre envoye au format Word (pas de PowerPoint ni PDF protege) environ 20 jours avant la formation
- Les documents doivent etre en marque blanche (sans coordonnees directes) avec le logo et les coordonnees de CQFD
- Le livret word doit etre different de la presentation powerpoint : etoffe, detaille, avec zones de prise de notes
- Si le fichier n'est pas envoye a temps, le prestataire assurera a sa charge les impressions et reliures
- Si un retard est prevu, prevenir CQFD des que possible

Outils IA utiles : ChatGPT, Gamma.app, SORA, Perplexity.ai`
  },
  {
    taskName: "Verifier tous les elements en mains",
    explanation: `Le dossier est envoye au formateur (pas chez le client). Si a 10 jours de la formation il n'a pas ete recu, alerter CQFD !

Programme de la formation : en tant que pedagogue independant et autonome, le formateur a la souplesse de s'ajuster sur place. Cependant, pour les ajustements notables, s'assurer aupres du contact referent chez le client de son accord.

Points importants :
- Ne pas modifier sans accord prealable les horaires et/ou dates d'intervention
- La duree pedagogique est contractuelle
- Si le nombre de stagiaires est superieur a celui prevu, prevenir CQFD
- En cas de litige/conflit, contacter CQFD en urgence avant toute decision
- En cas de presence de stagiaires en situation de handicap, evoquer le sujet securite a l'introduction
- Rester dans son role de pedagogue et ne pas tenter de vendre des journees complementaires
- Faire un tour de table au debut pour les attentes specifiques`
  },
  {
    taskName: "Scan feuille de presence + quest. Satisfaction",
    explanation: `Feuille de presence : le formateur doit aussi signer par demi-journee ! S'il y a 2 pages, signer les 2. Faire signer par demi-journee aux stagiaires (ne pas attendre la fin). Si un stagiaire est absent, noter "abs". En cas de retard significatif ou depart en cours de formation, noter les horaires a cote de la signature.

Evaluation de la satisfaction :
- L'auto-evaluation des acquis est a faire remplir meme s'il y a eu une evaluation des acquis
- Prevoir 20 a 30 minutes selon le groupe
- Faire remplir juste apres la conclusion/resume/bilan des points abordes
- Recuperer les questionnaires AVANT de liberer les stagiaires
- Possibilite de remplir via smartphone (QR code) pendant le temps de formation

Dans le cadre de Qualiopi, le recueil des avis est obligatoire, a chaud, avant le depart des participants.

A l'issue de la formation, envoyer par mail au plus vite un scan lisible et exploitable des documents. Verifier que les scans sont complets et lisibles avant de poster les originaux !`
  },
  {
    taskName: "Scan annexes (qcm...)",
    explanation: `Joindre a l'envoi tous les documents annexes : QCM, questionnaires, productions des stagiaires, photos de restitution ou de brainstorming sur paperboard... C'est un point important lors d'un controle administratif.`
  },
  {
    taskName: "Envoi du bilan qualite",
    explanation: `Formulaire CQFD pour le bilan :
- PDF : https://www.cqfd-formation.fr/docs/Evaluation-intervenant.pdf
- Numerique : https://forms.gle/wLRq27F3hN75PWca6

Ou un autre support plus adapte couvrant : conditions materielles, vie du groupe, appreciation de la duree, pertinence de la thematique, objectifs atteints ou pas, pourquoi, demarche d'amelioration continue.

Les verbatim et remarques des stagiaires sont une richesse pour proposer un complement, suivi personnalise et/ou ameliorer la pedagogie dans une demarche d'amelioration continue de la qualite.`
  },
  {
    taskName: "Envoi Synthese eval des acquis",
    explanation: `Au-dela de la feuille d'emargement, la reglementation demande des pieces d'une valeur probante de la realisation : prouver que chaque personne etait bien la, par la production de resultats (exercices realises par les stagiaires, etc.). C'est un point important lors d'un controle administratif.

Completer l'envoi par :
- Des photos des productions des stagiaires, photos des brainstorming au tableau
- Un document ou tableau recapitulatif individuel des evaluations des acquis par stagiaire avec les details sur les modalites d'evaluation

Exemple de support : https://www.cqfd-formation.fr/docs/Evaluation-des-acquis.xlsx`
  },
  {
    taskName: "Envoi des captures d'ecran (distanciel)",
    explanation: `Formation a distance : memes attentes sauf que les documents sont dematerialises. Il faut les gerer pendant la formation.

Nous sollicitons des captures d'ecran avec les temps de connexion, contresignees par le formateur. Les stagiaires ont sur la convocation la demande d'allumer leur camera. Ne pas hesiter a leur demander de le faire en precisant que la presence doit etre validee en fin de formation.`
  },
  {
    taskName: "Envoi des originaux par courrier",
    explanation: `Les documents originaux a envoyer par courrier :
- Feuille de presence
- Questionnaires de satisfaction et d'auto-evaluation des stagiaires
- Feuille de prises de notes pendant la formation (le cas echeant, c'est une preuve)
- QCM, questionnaires et autres productions des stagiaires`
  },
  {
    taskName: "Envoi facture",
    explanation: `La rapidite de paiement de la facture est conditionnee a ce que le dossier soit complet.

Si le delai de paiement semble important, pointer la liste des documents attendus et verifier que le dossier est complet car c'est peut-etre la cause du retard si CQFD est dans l'attente d'un des documents convenus.`
  },
  {
    taskName: "Retour signe de la DUE et du Contrat",
    explanation: `Renvoyer 2 exemplaires signes du contrat de travail avant le premier jour de formation/intervention.

Si la mission est eloignee et qu'un budget deplacement/hebergement/diners a ete defini, reserver bien en amont pour respecter le budget et eviter les mauvaises surprises (augmentation des billets de train, hotels complets).

Pour une mission a plus de 2 heures, CQFD prendra soin de faire dormir le formateur la veille dans un hotel a proximite.`
  },
  {
    taskName: "Envoi du rapport detaille",
    explanation: `A votre rapport comportant les constats, conseils et recommandations, n'hesitez pas a joindre des documents, photos, brainstorming...`
  },
  {
    taskName: "Envoi Solde de tout compte signe",
    explanation: `Ne pas oublier de renvoyer le document "solde de tout compte" signe apres reception du cheque ou virement.`
  },
  {
    taskName: "Envoi livret et annexes",
    explanation: `Les livrets et documents presentes ne doivent pas apporter confusion aupres des clients et participants en mentionnant des coordonnees directes : CQFD sollicite que les documents soient en marque blanche.

Pour les conferences, le format numerique est privilegie. Les supports seront places sur le serveur de CQFD et un lien de telechargement sera communique.

Le fichier doit etre envoye au format Word (pas de PowerPoint ni PDF protege) environ 15 jours avant la conference. Respecter la propriete intellectuelle et les droits sur les oeuvres.

Si une presentation PowerPoint est utilisee, le livret "apprenant" est une version a la fois expurgee (on retire les diapos de guidance pedagogique) et enrichie (on rajoute des textes explicatifs) du support d'animation.`
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

export function getTaskExplanation(taskTitle: string): string | null {
  if (!taskTitle) return null;
  const normalizedTitle = normalize(taskTitle);

  for (const item of TASK_EXPLANATIONS) {
    const normalizedExplanationName = normalize(item.taskName);

    if (normalizedTitle.includes(normalizedExplanationName) || normalizedExplanationName.includes(normalizedTitle)) {
      return item.explanation;
    }
  }
  return null;
}

export function getTaskExplanationWithOverrides(
  taskTitle: string,
  dbExplanations: Array<{ taskName: string; explanation: string; typology?: string | null; trainerRole?: string | null }>,
  typology?: string | null,
  trainerRole?: string | null
): string | null {
  if (!taskTitle) return null;
  const normalizedTitle = normalize(taskTitle);

  // Priority 1: exact match on typology + trainerRole
  if (typology && trainerRole) {
    for (const item of dbExplanations) {
      const normalizedName = normalize(item.taskName);
      if ((normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle))
        && item.typology === typology && item.trainerRole === trainerRole) {
        return item.explanation;
      }
    }
  }

  // Priority 2: match on typology only (any role)
  if (typology) {
    for (const item of dbExplanations) {
      const normalizedName = normalize(item.taskName);
      if ((normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle))
        && item.typology === typology && !item.trainerRole) {
        return item.explanation;
      }
    }
  }

  // Priority 3: match on trainerRole only (any typology)
  if (trainerRole) {
    for (const item of dbExplanations) {
      const normalizedName = normalize(item.taskName);
      if ((normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle))
        && !item.typology && item.trainerRole === trainerRole) {
        return item.explanation;
      }
    }
  }

  // Priority 4: global DB override (no typology, no role)
  for (const item of dbExplanations) {
    const normalizedName = normalize(item.taskName);
    if ((normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle))
      && !item.typology && !item.trainerRole) {
      return item.explanation;
    }
  }

  // Fallback: hardcoded values
  return getTaskExplanation(taskTitle);
}
