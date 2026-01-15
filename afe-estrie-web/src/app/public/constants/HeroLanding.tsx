// import { useMemo } from "react";
// import v1 from "../../../../assets/videos/hero/v1.mp4";
// import v2 from "../../../../assets/videos/hero/v2.mp4";
// import v3 from "../../../../assets/videos/hero/v3.mp4";
// import type { HeroSlide } from "../components/landing/Hero";

// const POSTER = "/images/afe-hero.jpg";

// export const heroSlides = useMemo<HeroSlide[]>(
//     () =>
//       slides?.length
//         ? slides
//         : [
//           {
//             videoSrc: v1,
//             poster: POSTER,
//             eyebrow: "Association • Estrie",
//             title:
//               "Bienvenue sur le site de l'association de la fibromyalgie de l'Estrie !",
//             description:
//               "Groupes de partage, ateliers, événements et information pour mieux vivre au quotidien.",
//             ctas: [
//               { label: "Voir les activités", href: "#activites", variant: "primary" },
//               { label: "Nous contacter", href: "#contact", variant: "secondary" },
//             ],
//           },
//           {
//             videoSrc: v2,
//             poster: POSTER,
//             eyebrow: "Rencontres",
//             title:
//               "Rencontres d’information Association de la fibromyalgie de l'Estrie",
//             description:
//               "Des moments pour comprendre, poser vos questions et trouver du soutien.",
//             ctas: [
//               { label: "Prochains événements", href: "#evenements", variant: "primary" },
//               { label: "Ressources", href: "#ressources", variant: "secondary" },
//             ],
//           },
//           {
//             videoSrc: v3,
//             poster: POSTER,
//             eyebrow: "Soutien",
//             title: "Un accompagnement humain et des services concrets",
//             description:
//               "Relation d’aide, écoute, activités et communauté — selon vos besoins.",
//             ctas: [
//               { label: "Devenir membre", href: "#membre", variant: "primary" },
//               { label: "Faire un don", href: "#don", variant: "secondary" },
//             ],
//           },
//         ],
//     [slides]
//   );