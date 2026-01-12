import type { ReactNode } from "react";

export function SectionShell({
    children,
    tone = "default",
}: {
    children: ReactNode;
    tone?: "default" | "soft";
}) {

    console.log("SectionShell tone:", tone);
    return (
        <section className={tone === "soft" ? "bg-[#fbf2f0] border-y border-black/5" : "bg-white"}>
            <div className="mx-auto max-w-6xl px-6 py-14 md:py-18">{children}</div>
        </section>
    );
}