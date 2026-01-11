import ReactMarkdown from "react-markdown";
import type { SplitTextImageSection } from "../../../content/types/pageBlocks";

export function SplitTextImageSectionView({
    data,
}: {
    data: SplitTextImageSection;
}) {
    const imageLeft = data.imageSide === "left";

    return (
        <section className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                {imageLeft && data.imageUrl && (
                    <img
                        src={data.imageUrl}
                        alt={data.imageAlt || ""}
                        className="rounded-lg shadow"
                    />
                )}

                <div>
                    {data.title && (
                        <h2 className="text-3xl font-semibold mb-4">
                            {data.title}
                        </h2>
                    )}

                    <div className="prose prose-lg text-gray-700">
                        <ReactMarkdown>{data.content}</ReactMarkdown>
                    </div>
                </div>

                {!imageLeft && data.imageUrl && (
                    <img
                        src={data.imageUrl}
                        alt={data.imageAlt || ""}
                        className="rounded-lg shadow"
                    />
                )}
            </div>
        </section>
    );
}
