export interface TaskTemplate {
  title: string;
  priorityDaysBefore: number; // positive = before first session (J-X), negative = after (J+X)
  lateDaysBefore: number;
  assigneeType: 'admin' | 'formateur';
  link?: string;
}

export const INTRA_PRESTA_TASKS: TaskTemplate[] = [
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

export const INTER_PRESTA_TASKS: TaskTemplate[] = [
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

export const INTRA_SALARIE_TASKS: TaskTemplate[] = [
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

export const INTER_SALARIE_TASKS: TaskTemplate[] = [
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

export const CONSEIL_PRESTA_TASKS: TaskTemplate[] = [
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

export const CONSEIL_SALARIE_TASKS: TaskTemplate[] = [
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

export const CONFERENCE_PRESTA_TASKS: TaskTemplate[] = [
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

export const CONFERENCE_SALARIE_TASKS: TaskTemplate[] = [
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

export function getTaskTemplates(typology: string, trainerRole: string): TaskTemplate[] {
  if (typology === "Intra" && trainerRole === "prestataire") return INTRA_PRESTA_TASKS;
  if (typology === "Intra" && trainerRole === "formateur") return INTRA_SALARIE_TASKS;
  if (typology === "Inter" && trainerRole === "prestataire") return INTER_PRESTA_TASKS;
  if (typology === "Inter" && trainerRole === "formateur") return INTER_SALARIE_TASKS;
  if (typology === "Conseil" && trainerRole === "prestataire") return CONSEIL_PRESTA_TASKS;
  if (typology === "Conseil" && trainerRole === "formateur") return CONSEIL_SALARIE_TASKS;
  if (typology === "Conférence" && trainerRole === "prestataire") return CONFERENCE_PRESTA_TASKS;
  if (typology === "Conférence" && trainerRole === "formateur") return CONFERENCE_SALARIE_TASKS;
  return INTRA_PRESTA_TASKS;
}

export function formatDeadlineLabel(days: number): string {
  if (days > 0) return `J-${days}`;
  if (days === 0) return "Jour J";
  return `J+${Math.abs(days)}`;
}
