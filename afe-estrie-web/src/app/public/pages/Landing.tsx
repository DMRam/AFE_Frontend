import { useEffect, useMemo, useState } from "react";

import { Hero } from "../components/landing/Hero";
import { QuickCards } from "../components/landing/QuickCards";
import { PartnersStrip } from "../components/landing/PartnersStrip";
import { ActivitiesPreview } from "../components/landing/ActivitiesPreview";

import type { HomePageCMS } from "../../../content/types/homePage";
import { getHomePage, seedHomePage, saveHomePage } from "../../../services/homePageRepo";
import { AutoDrawFeatures } from "../components/landing/AutoDrawFeatures";
import { NewsPreview } from "../components/landing/NewsPreview";
import { HomeContactMap } from "../components/landing/HomeContactCMS";

export default function Landing() {
  const [home, setHome] = useState<HomePageCMS | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getHomePage();
      setHome(data); // IMPORTANT: no fallback here
    })();
  }, []);

  // ONE-TIME initializer (only when doc missing)
  const initHomePage = async () => {
    try {
      setInitializing(true);
      const seed = seedHomePage();
      await saveHomePage(seed);
      const fresh = await getHomePage();
      setHome(fresh);
    } catch (e) {
      console.error("Failed to initialize home page", e);
      alert("Erreur lors de l’initialisation du contenu.");
    } finally {
      setInitializing(false);
    }
  };

  // HERO SLIDES
  const heroSlides = useMemo(() => {
    const slides = home?.hero?.slides ?? [];
    return slides
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        id: s.id,
        enabled: s.enabled,
        order: s.order ?? 0,
        eyebrow: s.eyebrow ?? "",
        title: s.title ?? "",
        description: s.description,
        videoKey: s.videoKey,
        poster: s.poster,
        ctas: s.ctas,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
      }))
      .filter((s) => s.title);
  }, [home]);

  // QUICK CARDS
  const quickCards = useMemo(() => {
    const cards = home?.quickCards?.cards ?? [];
    return cards
      .filter((c) => c.enabled)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({
        id: c.id,
        title: c.title ?? "",
        description: c.description ?? "",
        href: c.href,
      }))
      .filter((c) => c.title);
  }, [home]);

  // ONE-TIME EMPTY STATE (doc missing)
  if (!home) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Page d’accueil non initialisée
        </h1>
        <p className="mt-3 text-gray-600">
          Aucun contenu trouvé dans Firestore pour la page d’accueil.
        </p>

        <button
          onClick={initHomePage}
          disabled={initializing}
          className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {initializing ? "Initialisation…" : "Créer le contenu par défaut"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Cette action est requise une seule fois.
        </p>
      </div>
    );
  }

  // NORMAL RENDER
  return (
    <>
      {home.hero?.enabled && (
        <Hero
          slides={heroSlides}
          intervalSeconds={home.hero.intervalSeconds ?? 9}
          fadeMs={home.hero.fadeMs ?? 1200}
        />
      )}

      {home.quickCards?.enabled && (
        <QuickCards
          heading={home.quickCards.heading}
          cards={quickCards}
        />
      )}

      <AutoDrawFeatures home={home} />


      {home.partners?.enabled && (
        <PartnersStrip home={home} />
      )}

      {home.activities?.enabled && (
        <ActivitiesPreview
          home={home}
        />
      )}

      <NewsPreview home={home} />

      <HomeContactMap home={home} />

      


    </>
  );
}
