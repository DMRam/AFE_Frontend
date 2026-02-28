import type { ReactNode } from "react";

type ShellWidth = "narrow" | "normal" | "wide" | "full";

function widthClass(width: ShellWidth) {
    switch (width) {
        case "narrow":
            return "max-w-5xl";
        case "normal":
            return "max-w-6xl";
        case "wide":
            return "max-w-[1600px]";
        case "full":
            return "max-w-none";
    }
}

export function SectionShell({
    children,
    tone = "default",
    width = "wide",
}: {
    children: ReactNode;
    tone?: "default" | "soft";
    width?: ShellWidth;
}) {
    return (
        <section
            className={tone === "soft" ? "bg-[#fbf2f0] border-y border-black/5" : "bg-white"}
        >
            <div
                className={[
                    "mx-auto w-full",
                    widthClass(width),
                    // tighter side padding (reduced whitespace)
                    "px-2 sm:px-3 lg:px-5",
                    // vertical spacing
                    "py-12 md:py-16",
                ].join(" ")}
            >
                {children}
            </div>
        </section>
    );
}