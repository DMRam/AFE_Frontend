import type { PageDoc } from "../content/types/pageBlocks";
import { upsertPage } from "../services/pageRepo";

export async function seedEquipePage() {
  const page: PageDoc = {
    id: "a-propos__equipe",
    title: "Équipe",
    slug: "/a-propos/equipe",
    sections: [
      {
        type: "hero",
        id: "hero",
        enabled: true,
        title: "Équipe – Association de la fibromyalgie de l’Estrie",
        subtitle: "",
        backgroundImage: "/images/hero-fibro.jpg",
        align: "left",
        textColor: "dark",
      },

      // Person 1
      {
        type: "split",
        id: "lucie",
        enabled: true,
        variant: "default",
        title: "Lucie Cousineau",
        content:
          "B. Éd.\nDirectrice Générale\n\nAvec plus de 30 ans d’expérience en intervention, en gestion communautaire et en animation. Elle met son parcours riche et humain au service des membres.\n\ndirection@fibromyalgie.ca",
        imageUrl: "/images/team/lucie.jpg",
        imageAlt: "Lucie Cousineau",
        imageSide: "left",
      },

      // Person 2
      {
        type: "split",
        id: "cathy",
        enabled: true,
        variant: "default",
        title: "Cathy D. Lemieux",
        content:
          "B. Éd.\nAdjointe Administrative\n\nAvec une expérience en santé mentale dans le milieu communautaire, elle a rejoint notre organisme, où elle met ses compétences au service de l’équipe.\n\ninfo@fibromyalgie.ca",
        imageUrl: "/images/team/cathy.jpg",
        imageAlt: "Cathy D. Lemieux",
        imageSide: "right",
      },

      // Person 3
      {
        type: "split",
        id: "felipe",
        enabled: true,
        variant: "default",
        title: "Felipe Rodriguez A.",
        content:
          "M.Sc. B. Ps.\nCoordinateur Intervenant\n\nSpécialiste en développement et éducation environnementale axée sur la santé écosystémique, il apporte son engagement et sa sensibilité pour impulser des changements.\n\nintervention@fibromyalgie.ca",
        imageUrl: "/images/team/felipe.jpg",
        imageAlt: "Felipe Rodriguez A.",
        imageSide: "left",
      },
    ],
  };

  await upsertPage(page);
}
