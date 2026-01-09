import { useEffect, useState } from "react";
import logoFooter from "../../../../assets/logo/logo-footer.png";

const nav = [
  { label: "À propos", href: "#apropos" },
  { label: "Relation d’aide", href: "#aide" },
  { label: "Groupes de partage", href: "#groupes" },
  { label: "Activités", href: "#activites" },
  { label: "Événements", href: "#evenements" },
  { label: "Boutique", href: "#boutique" },
  { label: "Ressources", href: "#ressources" },
  { label: "Nous joindre", href: "#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Evita scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Left */}
        <a href="#" className="flex items-center gap-3">
          <img
            src={logoFooter}
            alt="AFE"
            className="h-12 sm:h-16 object-contain"
          />

          {/* Texto largo solo desde sm */}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Association de la
            </p>
            <p className="text-2xl font-semibold text-red-700">Fibromyalgie</p>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              de l’Estrie
            </p>
          </div>
        </a>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="#don"
            className="inline-flex items-center rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Faire un don
          </a>
          <a
            href="#membre"
            className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Devenir membre
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="md:hidden">
          {/* Backdrop */}
          <button
            aria-label="Fermer"
            onClick={close}
            className="fixed inset-0 z-40 cursor-default bg-black/40"
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="text-sm font-semibold text-gray-900">Menu</div>
              <button
                onClick={close}
                className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {/* CTAs dentro del menú */}
              <div className="flex gap-2">
                <a
                  href="#don"
                  onClick={close}
                  className="flex-1 rounded-full border border-red-600 px-4 py-2 text-center text-sm font-semibold text-red-600"
                >
                  Faire un don
                </a>
                <a
                  href="#membre"
                  onClick={close}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Devenir membre
                </a>
              </div>

              <div className="mt-4 border-t pt-4">
                <ul className="space-y-2">
                  {nav.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        onClick={close}
                        className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        {item.label}
                        <span className="text-gray-400">›</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
