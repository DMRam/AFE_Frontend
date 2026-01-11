import type { PageSection } from "../../content/types/pageBlocks";

import { HeroSectionView } from "./sections/HeroSectionView";
import { RichTextSectionView } from "./sections/RichTextSectionView";
import { SplitTextImageSectionView } from "./sections/SplitTextImageSectionView";


export function PageRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <div className="flex flex-col">
      {sections
        .filter((s) => s.enabled !== false)
        .map((s) => {
          switch (s.type) {
            case "hero":
              return <HeroSectionView key={s.id} data={s} />;
            case "richText":
              return <RichTextSectionView key={s.id} data={s} />;
            case "split":
              return <SplitTextImageSectionView key={s.id} data={s} />;
            default:
              return null;
          }
        })}
    </div>
  );
}
