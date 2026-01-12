import { ActivitiesPreview } from "../components/landing/ActivitiesPreview";
import { EventsPreview } from "../components/landing/EventsPreview";
import { Hero } from "../components/landing/Hero";
import { NewsletterCTA } from "../components/landing/NewsletterCTA";
import { PartnersStrip } from "../components/landing/PartnersStrip";
import { QuickCards } from "../components/landing/QuickCards";
import { ResourcesPreview } from "../components/landing/ResourcesPreview";

export default function Landing() {
  return (
    <>
      <Hero />
      <QuickCards />
      <PartnersStrip />
      <ActivitiesPreview />
      <EventsPreview />
      <ResourcesPreview />
      {/* <NewsletterCTA /> */}
    </>
  );
}
