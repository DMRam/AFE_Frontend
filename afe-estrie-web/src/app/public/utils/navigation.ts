export function isHash(href?: string): boolean {
    return Boolean(href && href.startsWith("#"));
}

export function scrollToHashWithOffset(href: string, offset = 92): void {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
}

export function isAbsoluteUrl(href?: string): boolean {
    return Boolean(href && /^https?:\/\//i.test(href));
}

export function isSameSiteUrl(href?: string): boolean {
    if (!href || !isAbsoluteUrl(href)) return false;

    try {
        const url = new URL(href);
        const hostname = url.hostname.toLowerCase();

        return (
            hostname === "fibromyalgie.ca" ||
            hostname === "www.fibromyalgie.ca" ||
            hostname === "afe-sherdev.web.app"
        );
    } catch {
        return false;
    }
}

export function isExternalNewTabUrl(href?: string): boolean {
    if (!href || !isAbsoluteUrl(href)) return false;

    try {
        const url = new URL(href);
        const hostname = url.hostname.toLowerCase();

        return !(
            hostname === "fibromyalgie.ca" ||
            hostname === "www.fibromyalgie.ca" ||
            hostname === "afe-sherdev.web.app"
        );
    } catch {
        return false;
    }
}

export function toRelativeAppPath(href: string): string {
    if (!isAbsoluteUrl(href)) return href;

    try {
        const url = new URL(href);
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return href;
    }
}

export function handleSmartNavigation(
    href: string | undefined,
    navigate: (to: string) => void,
    options?: {
        close?: () => void;
        offset?: number;
        delay?: number;
    }
): void {
    if (!href) return;

    const { close, offset = 92, delay = 50 } = options ?? {};

    // external links must open immediately, not inside setTimeout
    if (isExternalNewTabUrl(href)) {
        close?.();
        window.open(href, "_blank", "noopener,noreferrer");
        return;
    }

    close?.();

    window.setTimeout(() => {
        // hash on same page
        if (isHash(href)) {
            scrollToHashWithOffset(href, offset);
            return;
        }

        // same site absolute URL
        if (isSameSiteUrl(href)) {
            const relativePath = toRelativeAppPath(href);
            const [pathname, hash] = relativePath.split("#");

            navigate(pathname || "/");

            if (hash) {
                window.setTimeout(() => {
                    scrollToHashWithOffset(`#${hash}`, offset);
                }, 250);
            }

            return;
        }

        // internal relative path
        const [pathname, hash] = href.split("#");

        navigate(pathname || "/");

        if (hash) {
            window.setTimeout(() => {
                scrollToHashWithOffset(`#${hash}`, offset);
            }, 250);
        }
    }, delay);
}