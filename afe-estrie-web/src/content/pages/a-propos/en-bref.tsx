import type { PageDoc } from "../../types/pageBlocks";

export const enBrefPage: PageDoc = {
  id: "a-propos/en-bref",
  title: "À propos — En bref",
  slug: "/a-propos/en-bref",
  sections: [
    {
      type: "hero",
      id: "hero",
      title: "La fibromyalgie",
      subtitle: "Comprendre, reconnaître et mieux vivre avec la fibromyalgie.",
      backgroundImage: "/images/hero-fibro.jpg",
      align: "center",
    },
    {
      type: "richText",
      id: "intro",
      content: `
La fibromyalgie… Voilà un mot que les gens ont souvent du mal à prononcer...

- Douleur chronique généralisée
- Fatigue, sommeil perturbé
- Autres dysfonctions systémiques
      `.trim(),
    },
    {
      type: "split",
      id: "prevalence",
      title: "Prévalence",
      content: `
On pense que la population canadienne est touchée dans une proportion de 3,3 % à 5 %...
      `.trim(),
      imageUrl: "/images/prevalence.jpg",
      imageAlt: "Personne fatiguée",
      imageSide: "right",
    },
  ],
};
