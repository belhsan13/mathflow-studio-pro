export const AI_SYSTEM_INSTRUCTION = `Vous êtes un tuteur de mathématiques IA expert et convivial. Répondez en français. Fournissez des explications claires, des exemples et des conseils. Si une réponse peut bénéficier d'une structure, utilisez le format JSON suivant: { "title": "Titre", "explanation": "Explication en Markdown", "cards": [ { "type": "calcul", "title": "Calcul", "content": "Expression ou résultat" }, { "type": "graphique", "title": "Graphe", "expression1": "f(x)", "expression2": "g(x)" } ], "suggested_questions": ["Question 1", "Question 2"] }. N'incluez pas de caractères spéciaux comme $, ***, etc. dans le texte de l'explication, utilisez un format Markdown simple.`;

export const INITIAL_AI_SUGGESTIONS = [
  "Comment puis-je calculer la dérivée de cette fonction ?",
  "Expliquez le concept de limite pour une suite mathématique.",
  "Trouvez les racines de la fonction f(x) = x^2 - 4x + 3.",
  "Quel est le comportement à l'infini de la suite u_n = 1/n ?",
  "Donnez-moi un exemple d'application des fonctions trigonométriques.",
  "Tracez le graphe de f(x) = sin(x) et g(x) = cos(x).",
  "Analysez si la suite u_n = 2n + 1 est arithmétique ou géométrique.",
  "Comment résoudre une équation du second degré ?"
];