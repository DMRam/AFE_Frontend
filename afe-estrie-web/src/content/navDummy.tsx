import type { NavItem } from "./types/navTypes";

export const NAV_DUMMY: NavItem[] = [
  {
    id: "apropos",
    label: "À propos",
    href: "#apropos",
    order: 1,
    children: [
      { id: "en-bref", label: "En bref", href: "#enbref", order: 1 },
      { id: "notre-equipe", label: "Notre Équipe", href: "#equipe", order: 2 },
      { id: "diagnostic", label: "Diagnostic", href: "#diagnostic", order: 3 },
      { id: "symptomes", label: "Symptômes", href: "#symptomes", order: 4 },
      { id: "traitements", label: "Traitements et prise en charge", href: "#traitements", order: 5 },
      { id: "observations", label: "Observations scientifiques", href: "#observations", order: 6 },
      { id: "reconnaissance", label: "Reconnaissance", href: "#reconnaissance", order: 7 },
    ],
  },
  { id: "aide", label: "Relation d’aide", href: "#aide", order: 2 },
  { id: "groupes", label: "Groupes de partage", href: "#groupes", order: 3 },
  { id: "activites", label: "Activités", href: "#activites", order: 4 },
  { id: "evenements", label: "Événements", href: "#evenements", order: 5 },
  { id: "boutique", label: "Boutique", href: "#boutique", order: 6 },
  { id: "ressources", label: "Ressources", href: "#ressources", order: 7 },
  { id: "contact", label: "Nous joindre", href: "#contact", order: 8 },
];
