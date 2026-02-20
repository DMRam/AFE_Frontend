import { useEffect, useMemo, useState, useRef } from "react";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../../../../services/firebase";
import type { HomePageCMS } from "../../../../content/types/homePage";

function isHttp(s: string) {
  return /^https?:\/\//i.test(s);
}

async function resolveSrc(src: string): Promise<string> {
  if (!src) return "";
  if (isHttp(src)) return src;
  return await getDownloadURL(storageRef(storage, src));
}

export function PartnersStrip({ home }: { home?: HomePageCMS | null }) {
  const block = home?.partners;
  if (block?.enabled === false) return null;

  const heading = block?.heading || "Nos partenaires financiers";
  const logos = block?.logos ?? [];

  const sorted = useMemo(
    () =>
      logos
        .filter((l: any) => l?.enabled !== false)
        .slice()
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)),
    [logos]
  );

  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate items per page (4 columns × 3 rows = 12 items per page)
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);

  // Get current page items
  const currentItems = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  // Measure and set container height based on content including padding
  useEffect(() => {
    if (contentRef.current && outerContainerRef.current) {
      // Get the actual content height
      const contentHeight = contentRef.current.offsetHeight;
      // Add the vertical padding (2.5rem = 40px top + 40px bottom = 80px total)
      const totalHeight = contentHeight + 80;
      setContainerHeight(totalHeight);
    }
  }, [currentItems]);

  // Update height when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current && outerContainerRef.current) {
        const contentHeight = contentRef.current.offsetHeight;
        const totalHeight = contentHeight + 80;
        setContainerHeight(totalHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        sorted.map(async (l: any) => {
          try {
            next[l.id] = await resolveSrc(l.src);
          } catch {
            next[l.id] = "";
          }
        })
      );
      if (alive) setResolved(next);
    })();
    return () => {
      alive = false;
    };
  }, [sorted]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handlePrevPage = () => {
    if (currentPage === 0 || isAnimating) return;

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIsAnimating(true);

    // Trigger slide out animation
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(100%)'; // Slide out to the right
      containerRef.current.style.opacity = '0';
    }

    // Change page after slide out
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentPage((prev) => prev - 1);

      // Reset position for new content (prepare for slide in)
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateX(-100%)'; // Start from left
        containerRef.current.style.opacity = '0';

        // Force reflow
        void containerRef.current.offsetHeight;

        // Slide in from left
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transform = 'translateX(0)';
            containerRef.current.style.opacity = '1';
          }

          // Update container height based on new content including padding
          if (contentRef.current && outerContainerRef.current) {
            const contentHeight = contentRef.current.offsetHeight;
            const totalHeight = contentHeight + 80;
            setContainerHeight(totalHeight);
          }

          setIsAnimating(false);
        }, 50);
      }
    }, 400); // Wait for slide out to complete
  };

  const handleNextPage = () => {
    if (currentPage === totalPages - 1 || isAnimating) return;

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIsAnimating(true);

    // Trigger slide out animation
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(-100%)'; // Slide out to the left
      containerRef.current.style.opacity = '0';
    }

    // Change page after slide out
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentPage((prev) => prev + 1);

      // Reset position for new content (prepare for slide in)
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateX(100%)'; // Start from right
        containerRef.current.style.opacity = '0';

        // Force reflow
        void containerRef.current.offsetHeight;

        // Slide in from right
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transform = 'translateX(0)';
            containerRef.current.style.opacity = '1';
          }

          // Update container height based on new content including padding
          if (contentRef.current && outerContainerRef.current) {
            const contentHeight = contentRef.current.offsetHeight;
            const totalHeight = contentHeight + 80;
            setContainerHeight(totalHeight);
          }

          setIsAnimating(false);
        }, 50);
      }
    }, 400); // Wait for slide out to complete
  };

  const handlePageClick = (index: number) => {
    if (index === currentPage || isAnimating) return;

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIsAnimating(true);

    // Determine slide out direction
    const slideOutX = index > currentPage ? '-100%' : '100%';

    // Trigger slide out animation
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${slideOutX})`;
      containerRef.current.style.opacity = '0';
    }

    // Change page after slide out
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentPage(index);

      // Reset position for new content (prepare for slide in)
      if (containerRef.current) {
        // Start from opposite direction
        const startX = index > currentPage ? '100%' : '-100%';
        containerRef.current.style.transform = `translateX(${startX})`;
        containerRef.current.style.opacity = '0';

        // Force reflow
        void containerRef.current.offsetHeight;

        // Slide in from correct direction
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transform = 'translateX(0)';
            containerRef.current.style.opacity = '1';
          }

          // Update container height based on new content including padding
          if (contentRef.current && outerContainerRef.current) {
            const contentHeight = contentRef.current.offsetHeight;
            const totalHeight = contentHeight + 80;
            setContainerHeight(totalHeight);
          }

          setIsAnimating(false);
        }, 50);
      }
    }, 400);
  };

  // Don't show navigation if there's only one page
  const showNavigation = totalPages > 1;

  return (
    <section id="partenaires" className="bg-white py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Grâce à l’appui de nos partenaires, nous pouvons poursuivre notre
            mission auprès des personnes touchées par la fibromyalgie.
          </p>
        </div>

        {/* Logos container with navigation arrows */}
        <div className="relative group">
          {/* Left Arrow */}
          {showNavigation && (
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isAnimating}
              className={`
                absolute -left-4 top-1/2 z-20 -translate-y-1/2
                flex h-12 w-12 items-center justify-center
                rounded-full bg-white shadow-lg
                border border-gray-200
                transition-all duration-500 ease-out
                opacity-0 group-hover:opacity-100
                ${currentPage === 0 || isAnimating
                  ? 'opacity-30 cursor-not-allowed group-hover:opacity-30'
                  : 'hover:bg-gray-100 hover:border-[#af2511]/40 hover:scale-110 hover:shadow-xl cursor-pointer opacity-100'
                }
              `}
              aria-label="Voir les partenaires précédents"
            >
              <svg
                className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Logos container with slide animation and fixed height */}
          <div
            ref={outerContainerRef}
            className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden transition-all duration-700 ease-in-out p-6 sm:p-8 lg:p-10"
            style={{ height: containerHeight ? `${containerHeight}px` : "auto" }}
          >
            <div
              ref={containerRef}
              className="transition-all duration-700 ease-in-out"
              style={{
                transform: 'translateX(0)',
                opacity: 1
              }}
            >
              <div ref={contentRef} className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {currentItems.map((l: any) => {
                  const src = resolved[l.id];
                  const clickable = !!l.href;
                  const Tile = clickable ? "a" : "div";

                  return (
                    <Tile
                      key={l.id}
                      href={clickable ? l.href : undefined}
                      target={clickable && l.href?.startsWith("http") ? "_blank" : undefined}
                      rel={clickable && l.href?.startsWith("http") ? "noreferrer" : undefined}
                      className={[
                        "flex items-center justify-center rounded-xl bg-white px-4 py-6",
                        "border border-gray-200",
                        "transition-all duration-500 ease-out",
                        clickable
                          ? "hover:border-[#af2511]/40 hover:bg-gray-100 hover:scale-105 hover:shadow-md"
                          : "",
                        isAnimating ? 'opacity-90' : '',
                      ].join(" ")}
                      title={l.alt || "Partenaire"}
                      style={{
                        transitionDelay: isAnimating ? '100ms' : '0ms'
                      }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={l.alt ?? "Logo partenaire"}
                          className="h-14 w-auto object-contain opacity-90 transition-all duration-500 hover:opacity-100 hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-14 w-36 animate-pulse rounded bg-gray-200" />
                      )}
                    </Tile>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          {showNavigation && (
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1 || isAnimating}
              className={`
                absolute -right-4 top-1/2 z-20 -translate-y-1/2
                flex h-12 w-12 items-center justify-center
                rounded-full bg-white shadow-lg
                border border-gray-200
                transition-all duration-500 ease-out
                opacity-0 group-hover:opacity-100
                ${currentPage === totalPages - 1 || isAnimating
                  ? 'opacity-30 cursor-not-allowed group-hover:opacity-30'
                  : 'hover:bg-gray-100 hover:border-[#af2511]/40 hover:scale-110 hover:shadow-xl cursor-pointer opacity-100'
                }
              `}
              aria-label="Voir les partenaires suivants"
            >
              <svg
                className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Pagination indicators with animations */}
        {showNavigation && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(index)}
                disabled={isAnimating}
                className={`
                  h-2 rounded-full transition-all duration-500 ease-out
                  ${currentPage === index
                    ? 'w-8 bg-[#af2511]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400 hover:scale-125'
                  }
                  ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}
                  hover:shadow-md
                `}
                aria-label={`Aller à la page ${index + 1}`}
              >
                <span className="sr-only">Page {index + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Soft closing line */}
        <p className="mt-8 max-w-3xl text-sm text-gray-600">
          Vous souhaitez soutenir notre mission ou devenir partenaire?{" "}
          <a
            href="#contact"
            className="font-semibold text-[#af2511] transition-all duration-500 hover:underline hover:opacity-80"
          >
            Communiquez avec nous
          </a>
          .
        </p>
      </div>
    </section>
  );
}