import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";


declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (fontSize: string) => ReturnType;
            unsetFontSize: () => ReturnType;
        };
    }
}

const FontSize = Extension.create({
    name: "fontSize",

    addGlobalAttributes() {
        return [
            {
                types: ["textStyle"],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) => element.style.fontSize?.replace(/['"]/g, "") || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                (size: string) =>
                    ({ chain }) =>
                        chain().setMark("textStyle", { fontSize: size }).run(),

            unsetFontSize:
                () =>
                    ({ chain }) =>
                        chain()
                            .setMark("textStyle", { fontSize: null })
                            // provided by TextStyle extension:
                            .removeEmptyTextStyle()
                            .run(),
        };
    },
});

function cx(...arr: Array<string | false | undefined | null>) {
    return arr.filter(Boolean).join(" ");
}

export function RichTextInput({
    value,
    onChange,
    placeholder = "Écrivez ici…",
}: {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {},
                orderedList: {},
                listItem: {},
            }),
            Underline,
            TextStyle,
            FontSize,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Placeholder.configure({ placeholder }),
        ],
        content: value || "",
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cx(
                    "min-h-[140px] w-full outline-none p-3 text-sm leading-relaxed",
                    // ✅ Make lists look like lists (Tailwind-friendly)
                    "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
                    "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
                    "[&_li]:my-1",
                    // links + headings look decent
                    "[&_a]:text-red-700 [&_a]:underline",
                    "[&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:my-2",
                    "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2",
                    "[&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2"
                ),
            },
        },
    });

    if (!editor) return null;

    const btn = (active?: boolean) =>
        cx(
            "rounded-lg border px-2 py-1 text-xs font-semibold transition",
            active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        );

    const iconBtn = (active?: boolean) =>
        cx(
            "rounded-lg border px-2 py-1 text-xs font-semibold transition",
            active ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        );

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Lien (URL) :", previousUrl || "");
        if (url === null) return; // cancel
        if (url.trim() === "") {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor.chain().focus().setLink({ href: url.trim() }).run();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-2">
                <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
                    Gras
                </button>
                <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    Italique
                </button>
                <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    Souligné
                </button>

                <span className="mx-1 h-5 w-px bg-gray-200" />

                <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    • Liste
                </button>
                <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    1. Liste
                </button>

                <span className="mx-1 h-5 w-px bg-gray-200" />

                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs">
                    Couleur
                    <input
                        type="color"
                        className="h-5 w-8 cursor-pointer border-0 bg-transparent p-0"
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    />
                </label>

                <button type="button" className={btn(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight().run()}>
                    Surligner
                </button>

                <select
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                    onChange={(e) => {
                        const v = e.target.value;
                        if (!v) (editor as any).chain().focus().setFontSize("16px").run();
                        else (editor as any).chain().focus().fontSize.setFontSize(v).run();
                    }}
                    defaultValue=""
                >
                    <option value="">Taille</option>
                    <option value="12px">12</option>
                    <option value="14px">14</option>
                    <option value="16px">16</option>
                    <option value="18px">18</option>
                    <option value="20px">20</option>
                    <option value="24px">24</option>
                </select>

                <span className="mx-1 h-5 w-px bg-gray-200" />

                <button type="button" className={iconBtn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                    ↤
                </button>
                <button type="button" className={iconBtn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                    ↔
                </button>
                <button type="button" className={iconBtn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                    ↦
                </button>

                <button type="button" className={btn(editor.isActive("link"))} onClick={setLink}>
                    Lien
                </button>

                <span className="mx-1 h-5 w-px bg-gray-200" />

                <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    Annuler
                </button>
                <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    Rétablir
                </button>

                <button
                    type="button"
                    className="ml-auto rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                >
                    Effacer le style
                </button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}