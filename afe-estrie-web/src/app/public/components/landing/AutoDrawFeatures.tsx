import { useEffect, useMemo, useRef, useState } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";

type IconKey = "pain" | "sleep" | "scales" | "stairs";

type CMSItem = {
  id?: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  description?: string; // ✅ your DB/seed uses this
  body?: string;        // ✅ legacy
  icon?: any;           // (can be messy coming from DB)
};

type Block = {
  enabled?: boolean;
  heading?: string;
  subheading?: string;
  items?: CMSItem[];
};

function useInViewOnce<T extends HTMLElement>(rootMargin = "-10% 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

/** Default content (if CMS block not present yet) */
const FALLBACK: Array<{ id: string; icon: IconKey; title: string; body: string }> = [
  {
    id: "f1",
    icon: "pain",
    title: "Douleur",
    body:
      "Le symptôme numéro un de la fibromyalgie est la douleur. Elle touche toutes les personnes atteintes de fibromyalgie.",
  },
  {
    id: "f2",
    icon: "sleep",
    title: "Troubles du sommeil",
    body:
      "80 % des personnes ayant la fibromyalgie éprouvent des troubles du sommeil prenant différentes formes.",
  },
  {
    id: "f3",
    icon: "scales",
    title: "Fatigue",
    body:
      "La fatigue est le troisième principal symptôme de la fibromyalgie et touche quelque 75 % des personnes atteintes.",
  },
  {
    id: "f4",
    icon: "stairs",
    title: "Troubles concomitants",
    body:
      "Plusieurs autres troubles peuvent toucher les personnes atteintes. Le mieux connu est un trouble de cognition qu’on surnomme le fibrofog.",
  },
];

// ✅ normalize whatever comes from DB (old keys / weird spaces / casing)
function normalizeIcon(raw: any, fallback: IconKey): IconKey {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();

  // accept correct keys
  if (v === "pain" || v === "sleep" || v === "scales" || v === "stairs") return v;

  // map old names -> new ones (from your previous seed)
  // brain -> pain, balance -> scales
  if (v === "brain") return "pain";
  if (v === "balance") return "scales";

  // sometimes people store "scale" singular
  if (v === "scale") return "scales";

  return fallback;
}

function CircleIcon({ icon, animate }: { icon: IconKey; animate: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className={["text-white/90", "draw", animate ? "draw-on" : "draw-off"].join(" ")}
        pathLength={1}
      />

      {icon === "pain" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          <path d="M52 86c-8 0-14-6-14-14V57c0-14 10-25 24-25 12 0 22 9 24 21 1 6-1 12-5 16l-6 6v11H52Z" />
          <path d="M52 86v-9h23" />
          <circle cx="78" cy="52" r="9" />
          <circle cx="78" cy="52" r="4" />
          <path d="M78 43v-6" />
          <path d="M87 52h6" />
          <path d="M84 46l4-4" />
        </g>
      )}

      {icon === "sleep" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          <path d="M30 70h60" />
          <path d="M34 70V58c0-7 6-12 13-12h26c7 0 13 5 13 12v12" />
          <path d="M34 58h52" />
          <path d="M30 70v10" />
          <path d="M90 70v10" />
          <path d="M46 54c2-4 6-6 12-6h6" />
        </g>
      )}

      {icon === "scales" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          <path d="M60 30v55" />
          <path d="M44 85h32" />
          <path d="M36 42h48" />
          <path d="M44 42l-10 16h20l-10-16Z" />
          <path d="M76 42l-10 16h20l-10-16Z" />
          <path d="M60 42v-6" />
        </g>
      )}

      {icon === "stairs" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          <path d="M34 84h20V70h14V56h14V42h4" />
          <circle cx="78" cy="46" r="4" />
          <path d="M78 50l-6 10" />
          <path d="M72 60l-10 6" />
          <path d="M72 60l10 12" />
          <path d="M66 78l-10 6" />
          <path d="M82 72l10 6" />
        </g>
      )}
    </svg>
  );
}

export function AutoDrawFeatures({ home }: { home?: HomePageCMS | null }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  // ✅ prefer features (your seed), but still support symptoms if you used that earlier
  const block = (((home as any)?.features ?? (home as any)?.symptoms) as Block | undefined) ?? undefined;
  if (block?.enabled === false) return null;

  const heading = block?.heading ?? "Les symptômes de la fibromyalgie";
  const subheading =
    block?.subheading ??
    "Trois principaux symptômes sont récurrents. Les douleurs diffuses, les troubles du sommeil et la fatigue chronique. Plusieurs autres symptômes sont liés à la fibromyalgie et diffèrent selon les personnes.";

  const items = useMemo(() => {
    const raw = (block?.items ?? [])
      .filter((x) => x?.enabled !== false)
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

    if (raw.length === 0) return FALLBACK;

    const defaultIcons: IconKey[] = ["pain", "sleep", "scales", "stairs"];

    return raw.map((it, idx) => {
      const fallbackIcon = defaultIcons[idx] ?? "pain";
      return {
        id: it.id ?? `f${idx + 1}`, // ✅ stable key
        icon: normalizeIcon(it.icon, fallbackIcon),
        title: it.title ?? "",
        // ✅ support both DB fields
        body: (it.description ?? it.body ?? "") as string,
      };
    });
  }, [block?.items]);

  return (
    <section className="bg-[#b33a22] py-16">
      <style>{`
        .draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .draw-off { opacity: 0; }
        .draw-on { opacity: 1; animation: dash 1.1s ease forwards; }
        .delay-150 { animation-delay: .15s; }
        @keyframes dash { to { stroke-dashoffset: 0; } }
      `}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">{heading}</h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/85">{subheading}</p>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col items-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full">
                <CircleIcon icon={it.icon} animate={inView} />
              </div>

              <h3 className="mt-4 text-base font-bold text-white">{it.title}</h3>

              <p className="mt-3 max-w-[280px] text-xs leading-relaxed text-white/80">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
