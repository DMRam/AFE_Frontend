import type { RichTextSection } from "../../../content/types/pageBlocks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    CheckCircle,
    AlertCircle,
    Info,
    Lightbulb,
    ExternalLink,
    ChevronRight,
} from "lucide-react";
import DOMPurify from "dompurify";

type CtaVariant = "primary" | "secondary" | "outline";
type CtaSize = "sm" | "md" | "lg";
type CtaIcon = "none" | "arrow" | "external";

// Be permissive: accept whatever comes from Firestore and normalize safely.
type CTA = {
    id?: string;
    enabled?: boolean;
    label?: string;
    href?: string;
    variant?: CtaVariant | string;
    size?: CtaSize | string;
    icon?: CtaIcon | string;
    newTab?: boolean;
    // allow unknown props without breaking
    [k: string]: any;
};

type RichTextSectionX = RichTextSection & {
    body?: string;
    heading?: string;
    tone?: "standard" | "info" | "important";
    textColorPreset?: "auto" | "dark" | "light" | "red" | "blue";
    textOpacity?: number; // 0..100
    ctas?: CTA[];
};

interface RichTextSectionViewProps {
    data: RichTextSectionX;
    className?: string;
    showTableOfContents?: boolean;
}

function isExternal(href: string) {
    return /^https?:\/\//i.test(href);
}

function getBody(data: RichTextSectionX) {
    return String(data.body ?? data.content ?? "");
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function toneShell(tone: RichTextSectionX["tone"]) {
    switch (tone) {
        case "info":
            return "border-blue-200 bg-blue-50";
        case "important":
            return "border-amber-200 bg-amber-50";
        default:
            return "border-gray-200 bg-white";
    }
}

function normalizeVariant(v: any): CtaVariant {
    return v === "secondary" ? "secondary" : v === "outline" ? "outline" : "primary";
}
function normalizeSize(v: any): CtaSize {
    return v === "sm" ? "sm" : v === "lg" ? "lg" : "md";
}
function normalizeIcon(v: any): CtaIcon {
    return v === "arrow" ? "arrow" : v === "external" ? "external" : "none";
}

function ctaClass(variant: CtaVariant) {
    if (variant === "primary") return "bg-red-700 text-white hover:bg-red-800";
    if (variant === "secondary") return "bg-gray-900 text-white hover:bg-gray-800";
    return "border border-gray-300 text-gray-900 hover:bg-gray-50";
}

function ctaSizeClass(size: CtaSize) {
    // pill buttons, but sized
    if (size === "sm") return "px-4 py-2 text-sm";
    if (size === "lg") return "px-6 py-3 text-base";
    return "px-5 py-2.5 text-sm";
}

function textPresetClasses(preset: RichTextSectionX["textColorPreset"]) {
    switch (preset) {
        case "light":
            return { wrapper: "text-white", prose: "prose-invert" };
        case "red":
            return { wrapper: "text-red-900", prose: "" };
        case "blue":
            return { wrapper: "text-blue-900", prose: "" };
        case "dark":
            return { wrapper: "text-gray-900", prose: "" };
        default:
            return { wrapper: "text-gray-900", prose: "" };
    }
}

function normalizeCtas(input: any): Array<{
    id: string;
    enabled: boolean;
    label: string;
    href: string;
    variant: CtaVariant;
    size: CtaSize;
    icon: CtaIcon;
    newTab: boolean;
}> {
    if (!Array.isArray(input)) return [];

    const out = input
        .filter(Boolean)
        .map((c: any, idx: number) => {
            const label = String(c?.label ?? "").trim();
            const href = String(c?.href ?? "").trim() || "#";
            const enabled = c?.enabled !== false;
            const id = String(c?.id ?? `cta-${idx}-${label || "x"}`);
            return {
                id,
                enabled,
                label,
                href,
                variant: normalizeVariant(c?.variant),
                size: normalizeSize(c?.size),
                icon: normalizeIcon(c?.icon),
                newTab: Boolean(c?.newTab),
            };
        })
        .filter((c) => c.enabled && c.label)
        .slice(0, 3);

    return out;
}

function looksLikeHtml(s: string) {
    const t = (s || "").trim();
    return t.startsWith("<") && /<\/?[a-z][\s\S]*>/i.test(t);
}

export function RichTextSectionView({
    data,
    className = "",
    showTableOfContents = false,
}: RichTextSectionViewProps) {
    const raw = getBody(data);

    const tocHeadings = (() => {
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const matches = Array.from(raw.matchAll(headingRegex));
        return matches.map((match) => ({
            id: match[2].toLowerCase().replace(/[^\w]+/g, "-"),
            text: match[2],
            level: match[1].length,
        }));
    })();

    const opacity = clamp(Number(data.textOpacity ?? 100), 0, 100);
    const textStyle = opacity < 100 ? ({ opacity: opacity / 100 } as const) : undefined;

    const preset = textPresetClasses(data.textColorPreset ?? "auto");

    const visibleCtas = normalizeCtas((data as any).ctas);

    const components = {
        h1: ({ node, ...props }: any) => (
            <h1 id={props.id} className="group relative scroll-mt-24">
                <a
                    href={`#${props.id}`}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                    aria-label="Link to section"
                >
                    #
                </a>
                {props.children}
            </h1>
        ),
        h2: ({ node, ...props }: any) => (
            <h2 id={props.id} className="group relative scroll-mt-20">
                <a
                    href={`#${props.id}`}
                    className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                    aria-label="Link to section"
                >
                    #
                </a>
                {props.children}
            </h2>
        ),
        h3: ({ node, ...props }: any) => (
            <h3 id={props.id} className="group relative scroll-mt-16">
                <a
                    href={`#${props.id}`}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                    aria-label="Link to section"
                >
                    #
                </a>
                {props.children}
            </h3>
        ),

        a: ({ node, href, children, ...props }: any) => {
            const ext = href?.startsWith("http");
            return (
                <a
                    href={href}
                    target={ext ? "_blank" : undefined}
                    rel={ext ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 text-red-700 font-semibold no-underline hover:underline hover:text-red-800 transition-colors"
                    {...props}
                >
                    {children}
                    {ext && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
                </a>
            );
        },

        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            if (inline) {
                return (
                    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono border border-gray-200">
                        {children}
                    </code>
                );
            }

            return (
                <div className="relative group">
                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => navigator.clipboard.writeText(String(children))}
                            className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                            type="button"
                        >
                            Copy
                        </button>
                    </div>
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        className="rounded-lg !mt-0 !mb-0"
                        showLineNumbers
                        lineNumberStyle={{ minWidth: "3em" }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                </div>
            );
        },

        blockquote: ({ children }: any) => {
            const text = String(children);
            let type: "info" | "warning" | "tip" | "success" = "info";
            let icon = <Info className="w-5 h-5" />;

            if (text.includes("⚠️") || text.includes("Warning:")) {
                type = "warning";
                icon = <AlertCircle className="w-5 h-5" />;
            } else if (text.includes("💡") || text.includes("Tip:")) {
                type = "tip";
                icon = <Lightbulb className="w-5 h-5" />;
            } else if (text.includes("✅") || text.includes("Success:")) {
                type = "success";
                icon = <CheckCircle className="w-5 h-5" />;
            }

            const typeStyles = {
                info: "border-blue-200 bg-blue-50 text-blue-800",
                warning: "border-amber-200 bg-amber-50 text-amber-800",
                tip: "border-emerald-200 bg-emerald-50 text-emerald-800",
                success: "border-green-200 bg-green-50 text-green-800",
            };

            return (
                <blockquote
                    className={`relative my-6 pl-4 pr-4 py-3 rounded-lg border-l-4 ${typeStyles[type]} not-italic`}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                        <div className="flex-1">
                            <div className="prose-sm prose-strong:font-semibold">{children}</div>
                        </div>
                    </div>
                </blockquote>
            );
        },

        table: ({ node, children, ...props }: any) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200" {...props}>
                    {children}
                </table>
            </div>
        ),
        th: ({ node, children, ...props }: any) => (
            <th
                className="px-4 py-3 bg-gray-50 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200"
                {...props}
            >
                {children}
            </th>
        ),
        td: ({ node, children, ...props }: any) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200" {...props}>
                {children}
            </td>
        ),

        ul: ({ node, children, depth = 0, ...props }: any) => {
            const isNested = depth > 0;
            return (
                <ul className={`my-4 space-y-2 ${isNested ? "ml-6" : ""}`} {...props}>
                    {children}
                </ul>
            );
        },
        ol: ({ node, children, depth = 0, ...props }: any) => {
            const isNested = depth > 0;
            return (
                <ol className={`my-4 space-y-2 list-decimal ${isNested ? "ml-6" : ""}`} {...props}>
                    {children}
                </ol>
            );
        },
        li: ({ node, children, ordered, ...props }: any) => (
            <li className="relative pl-1" {...props}>
                {!ordered && <ChevronRight className="absolute -left-4 top-2 w-3 h-3 text-gray-400" />}
                <div className="pl-2">{children}</div>
            </li>
        ),

        img: ({ node, src, alt, ...props }: any) => (
            <div className="my-6">
                <img
                    src={src}
                    alt={alt}
                    className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
                    loading="lazy"
                    {...props}
                />
                {alt && <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>}
            </div>
        ),
    };

    return (
        <div className={`mx-auto max-w-5xl px-4 sm:px-6 ${className}`}>
            <div
                className={`rounded-2xl border p-6 sm:p-8 ${toneShell(data.tone)} ${preset.wrapper}`}
                style={textStyle}
            >
                {data.heading ? (
                    <h2 className="mb-4 text-2xl font-semibold text-gray-900">{data.heading}</h2>
                ) : null}

                {showTableOfContents && tocHeadings.length > 0 && (
                    <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                            Table of Contents
                        </h3>
                        <nav className="space-y-1.5">
                            {tocHeadings.map((heading) => (
                                <a
                                    key={heading.id}
                                    href={`#${heading.id}`}
                                    className={`flex items-center gap-2 text-sm transition-colors hover:text-red-700 ${heading.level === 1
                                        ? "font-semibold text-gray-900"
                                        : heading.level === 2
                                            ? "font-medium text-gray-800 ml-2"
                                            : "text-gray-600 ml-4"
                                        }`}
                                >
                                    <div
                                        className={`w-1 h-1 rounded-full ${heading.level === 1 ? "bg-red-500" : heading.level === 2 ? "bg-blue-500" : "bg-gray-400"
                                            }`}
                                    />
                                    {heading.text}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}

                <div
                    className={[
                        "prose prose-lg prose-slate max-w-none",
                        preset.prose,
                        "prose-headings:font-semibold prose-headings:text-gray-900",
                        "prose-p:leading-7 prose-p:text-gray-700",
                        "prose-strong:text-gray-900 prose-strong:font-semibold",
                        "prose-a:text-red-700 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
                        "prose-code:before:content-none prose-code:after:content-none",
                    ].join(" ")}
                >
                    {looksLikeHtml(raw) ? (
                        <div
                            className={[
                                "prose prose-lg prose-slate max-w-none",
                                preset.prose,
                                "prose-headings:font-semibold prose-headings:text-gray-900",
                                "prose-p:leading-7 prose-p:text-gray-700",
                                "prose-strong:text-gray-900 prose-strong:font-semibold",
                                "prose-a:text-red-700 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
                                "prose-code:before:content-none prose-code:after:content-none",

                                // list styling (important for Tiptap HTML lists)
                                "[&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc",
                                "[&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal",
                                "[&_li]:my-1",

                                "[&_p]:my-3 [&_p:first-child]:mt-0",
                            ].join(" ")}
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(raw),
                            }}
                        />
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
                            components={components as any}
                        >
                            {raw}
                        </ReactMarkdown>
                    )}
                </div>

                {/* CTAs (supports enabled, newTab, size, icon, id) */}
                {visibleCtas.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-3">
                        {visibleCtas.map((cta) => {
                            const external = isExternal(cta.href);
                            const openBlank = cta.newTab || external;

                            return (
                                <a
                                    key={cta.id}
                                    href={cta.href}
                                    target={openBlank ? "_blank" : undefined}
                                    rel={openBlank ? "noopener noreferrer" : undefined}
                                    className={[
                                        "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                                        ctaSizeClass(cta.size),
                                        ctaClass(cta.variant),
                                    ].join(" ")}
                                >
                                    <span>{cta.label}</span>

                                    {cta.icon === "external" || (cta.icon === "none" ? false : external) ? (
                                        <ExternalLink className="h-4 w-4" />
                                    ) : cta.icon === "arrow" ? (
                                        <ChevronRight className="h-4 w-4" />
                                    ) : null}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 flex items-center justify-between">
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="text-red-700 hover:text-red-800 font-medium"
                        type="button"
                    >
                        Back to top ↑
                    </button>
                </div>
            </div>
        </div>
    );
}
