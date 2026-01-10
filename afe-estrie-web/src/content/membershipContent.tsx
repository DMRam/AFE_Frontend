export type MembershipPlan = {
  name: string;
  desc: string;
  price: string;
  period?: string;
};

export type MembershipContent = {
  title: string;
  subtitle: string;
  intro: string;
  pricingIntro: string;
  infoFiboNote: string;
  plans: MembershipPlan[];
  ctaLabel: string;
  ctaHref: string; // later can be an external URL too
};

export const MEMBERSHIP_DUMMY: MembershipContent = {
  title: "Devenir membre",
  subtitle: "Être membre pour avoir accès à plusieurs activités et services.",
  intro:
    "Devenir membre de l’Association de la Fibromyalgie de l’Estrie vous permet d’avoir accès à tous les activités et services adaptés à votre condition à des coûts abordables. Participer à des conférences, ateliers et activités sociales. Sortir de l’isolement et être en contact avec d’autres personnes atteintes de fibromyalgie et une équipe professionnelle. Vous aurez accès à un centre de documentation qui vous permettra de mieux comprendre ce qu’est la fibromyalgie. Avoir accès à de l’aide selon vos besoins.",
  pricingIntro:
    "Le coût d’adhésion à vie pour le membre actif (personne atteinte de fibromyalgie) est de 20 $. Le coût d’adhésion annuel du membre soutien (personne qui supporte une personne atteinte de fibromyalgie) est de 20 $ et est renouvelable à chaque année à partir du 1er avril. Le coût annuel d’adhésion du membre associé (personne soutenant la cause) est de 30 $ et est renouvelable à chaque année à partir du 1er avril.",
  infoFiboNote:
    "En étant membre, vous recevez automatiquement, par courriel, notre journal INFO-FIBRO (4 fois/an). Les membres qui désirent recevoir le journal par la poste devront payer un montant supplémentaire de 10 $ au moment de l’adhésion ou du renouvellement.",
  plans: [
    {
      name: "Membre actif",
      desc: "Personne atteinte de la fibromyalgie",
      price: "20 $",
      period: "à vie",
    },
    {
      name: "Membre soutien",
      desc: "Personne non atteinte de la fibromyalgie qui soutient une personne atteinte",
      price: "20 $",
      period: "par an",
    },
    {
      name: "Membre associé",
      desc: "Personne non atteinte de la fibromyalgie qui s’associe à la cause",
      price: "30 $",
      period: "par an",
    },
  ],
  ctaLabel: "Cliquez ici pour devenir membre",
  ctaHref: "#membre",
};
