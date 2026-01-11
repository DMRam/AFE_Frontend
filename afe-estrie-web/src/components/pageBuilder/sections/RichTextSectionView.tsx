import ReactMarkdown from "react-markdown";
import type { RichTextSection } from "../../../content/types/pageBlocks";

export function RichTextSectionView({ data }: { data: RichTextSection }) {
    return (
        <section className="mx-auto max-w-4xl px-6 py-12">
            <div className="prose prose-lg">
                <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
        </section>
    );
}
