import { SectionShell } from "./SectionShell";
import type { PageSection } from "../../content/types/pageBlocks";
import { HeroSectionView } from "./sections/HeroSectionView";
import { RichTextSectionView } from "./sections/RichTextSectionView";
import { SplitTextImageSectionView } from "./sections/SplitTextImageSectionView";
import { TeamSectionView } from "./sections/TeamSectionView";

export function PageRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <div className="flex flex-col">
      {sections
        .filter((s) => s.enabled !== false)
        .map((s) => {
          // HERO 
          if (s.type === "hero") {
            return <HeroSectionView key={s.id} data={s} />;
          }

          // Any non-hero section can opt into soft background via `variant`
          const tone: "default" | "soft" =
            "variant" in s && s.variant === "soft" ? "soft" : "default";

          return (
            <SectionShell key={s.id} tone={tone}>
              {s.type === "richText" ? (
                <RichTextSectionView data={s} />
              ) : s.type === "split" ? (
                <SplitTextImageSectionView data={s} />
              ) : s.type === "team" ? (
                <TeamSectionView data={s} />
              ) : null}
            </SectionShell>
          );
        })}
    </div>
  );
}
