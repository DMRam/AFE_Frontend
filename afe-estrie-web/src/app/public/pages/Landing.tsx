import { ActivitiesPreview } from "../components/landing/ActivitiesPreview";
import { EventsPreview } from "../components/landing/EventsPreview";
import { Hero } from "../components/landing/Hero";
import { NewsletterCTA } from "../components/landing/NewsletterCTA";
import { PartnersStrip } from "../components/landing/PartnersStrip";
import { QuickCards } from "../components/landing/QuickCards";
import { ResourcesPreview } from "../components/landing/ResourcesPreview";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteNav } from "../components/layout/SiteNav";




export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <SiteNav />

      <main>
        <Hero />
        <QuickCards />
        <PartnersStrip />
        <ActivitiesPreview />
        <EventsPreview />
        <ResourcesPreview />
        <NewsletterCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
