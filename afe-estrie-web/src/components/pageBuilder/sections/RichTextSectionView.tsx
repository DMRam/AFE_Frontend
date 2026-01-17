import type { RichTextSection } from "../../../content/types/pageBlocks";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle, AlertCircle, Info, Lightbulb, ExternalLink, ChevronRight } from 'lucide-react';

interface RichTextSectionViewProps {
    data: RichTextSection;
    className?: string;
    showTableOfContents?: boolean;
}

export function RichTextSectionView({ 
    data, 
    className = "",
    showTableOfContents = false 
}: RichTextSectionViewProps) {

    // Extract headings for table of contents
    const extractHeadings = (markdown: string) => {
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const matches = Array.from(markdown.matchAll(headingRegex));
        return matches.map(match => ({
            id: match[2].toLowerCase().replace(/[^\w]+/g, '-'),
            text: match[2],
            level: match[1].length
        }));
    };

    const tocHeadings = extractHeadings(data.content);

    const components = {
        // Custom heading renderer with anchor links
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
        
        // Enhanced links with external link indicator
        a: ({ node, href, children, ...props }: any) => {
            const isExternal = href?.startsWith('http');
            return (
                <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 text-red-700 font-semibold no-underline hover:underline hover:text-red-800 transition-colors"
                    {...props}
                >
                    {children}
                    {isExternal && (
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    )}
                </a>
            );
        },
        
        // Code blocks with syntax highlighting
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
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
                            onClick={() => {
                                navigator.clipboard.writeText(String(children));
                            }}
                            className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
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
                        lineNumberStyle={{ minWidth: '3em' }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            );
        },
        
        // Enhanced blockquotes with different styles based on content
        blockquote: ({ children }: any) => {
            const text = String(children);
            let type: 'info' | 'warning' | 'tip' | 'success' = 'info';
            let icon = <Info className="w-5 h-5" />;
            
            if (text.includes('⚠️') || text.includes('Warning:')) {
                type = 'warning';
                icon = <AlertCircle className="w-5 h-5" />;
            } else if (text.includes('💡') || text.includes('Tip:')) {
                type = 'tip';
                icon = <Lightbulb className="w-5 h-5" />;
            } else if (text.includes('✅') || text.includes('Success:')) {
                type = 'success';
                icon = <CheckCircle className="w-5 h-5" />;
            }
            
            const typeStyles = {
                info: 'border-blue-200 bg-blue-50 text-blue-800',
                warning: 'border-amber-200 bg-amber-50 text-amber-800',
                tip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                success: 'border-green-200 bg-green-50 text-green-800'
            };
            
            return (
                <blockquote className={`relative my-6 pl-4 pr-4 py-3 rounded-lg border-l-4 ${typeStyles[type]} not-italic`}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                        <div className="flex-1">
                            <div className="prose-sm prose-strong:font-semibold">
                                {children}
                            </div>
                        </div>
                    </div>
                </blockquote>
            );
        },
        
        // Enhanced tables
        table: ({ node, children, ...props }: any) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200" {...props}>
                    {children}
                </table>
            </div>
        ),
        th: ({ node, children, ...props }: any) => (
            <th className="px-4 py-3 bg-gray-50 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200" {...props}>
                {children}
            </th>
        ),
        td: ({ node, children, ...props }: any) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200" {...props}>
                {children}
            </td>
        ),
        
        // Enhanced lists
        ul: ({ node, children, depth = 0, ...props }: any) => {
            const isNested = depth > 0;
            return (
                <ul className={`my-4 space-y-2 ${isNested ? 'ml-6' : ''}`} {...props}>
                    {children}
                </ul>
            );
        },
        ol: ({ node, children, depth = 0, ...props }: any) => {
            const isNested = depth > 0;
            return (
                <ol className={`my-4 space-y-2 list-decimal ${isNested ? 'ml-6' : ''}`} {...props}>
                    {children}
                </ol>
            );
        },
        li: ({ node, children, ordered, ...props }: any) => (
            <li className="relative pl-1" {...props}>
                {!ordered && (
                    <ChevronRight className="absolute -left-4 top-2 w-3 h-3 text-gray-400" />
                )}
                <div className="pl-2">{children}</div>
            </li>
        ),
        
        // Enhanced images
        img: ({ node, src, alt, ...props }: any) => (
            <div className="my-6">
                <img
                    src={src}
                    alt={alt}
                    className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
                    loading="lazy"
                    {...props}
                />
                {alt && (
                    <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
                )}
            </div>
        ),
    };

    return (
        <div className={`mx-auto max-w-1xl ${className}`}>
            {showTableOfContents && tocHeadings.length > 0 && (
                <div className="sticky top-6 mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>Table of Contents</span>
                    </h3>
                    <nav className="space-y-1.5">
                        {tocHeadings.map((heading) => (
                            <a
                                key={heading.id}
                                href={`#${heading.id}`}
                                className={`flex items-center gap-2 text-sm transition-colors hover:text-red-700 ${
                                    heading.level === 1 
                                        ? 'font-semibold text-gray-900' 
                                        : heading.level === 2 
                                        ? 'font-medium text-gray-800 ml-2' 
                                        : 'text-gray-600 ml-4'
                                }`}
                            >
                                <div className={`w-1 h-1 rounded-full ${
                                    heading.level === 1 ? 'bg-red-500' :
                                    heading.level === 2 ? 'bg-blue-500' : 'bg-gray-400'
                                }`} />
                                {heading.text}
                            </a>
                        ))}
                    </nav>
                </div>
            )}
            
            <div className={`
                prose
                prose-lg 
                prose-slate 
                max-w-none
                
                /* Headings */
                prose-headings:font-semibold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-6
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2
                
                /* Paragraphs */
                prose-p:leading-7 prose-p:text-gray-700
                prose-lead:text-lg prose-lead:text-gray-600
                
                /* Links */
                prose-a:text-red-700 prose-a:font-semibold
                prose-a:no-underline hover:prose-a:underline
                
                /* Strong and emphasis */
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-em:text-gray-700 prose-em:italic
                
                /* Lists */
                prose-ul:mt-4 prose-ul:mb-4
                prose-ol:mt-4 prose-ol:mb-4
                prose-li:my-1.5
                
                /* Code */
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-code:before:content-none prose-code:after:content-none
                
                /* Blockquotes */
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300
                prose-blockquote:text-gray-600 prose-blockquote:not-italic
                
                /* Tables */
                prose-table:border-separate prose-table:border-spacing-0
                prose-th:bg-gray-50 prose-th:text-gray-900
                prose-td:border-t prose-td:border-gray-200
                
                /* Images */
                prose-img:rounded-lg prose-img:shadow-md
                
                /* Horizontal rules */
                prose-hr:border-gray-200 prose-hr:my-8
                
                /* Responsive */
                md:prose-base
                lg:prose-lg
                xl:prose-xl
                
                /* Print */
                print:prose-sm
            `}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
                    components={components}
                >
                    {data.content}
                </ReactMarkdown>
            </div>
            
            {/* Reading progress */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500 flex items-center justify-between">
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-red-700 hover:text-red-800 font-medium flex items-center gap-1"
                    >
                        Back to top ↑
                    </button>
                </div>
            </div>
        </div>
    );
}

// Optional: Export a simplified version for basic use
export function SimpleRichTextView({ data }: { data: RichTextSection }) {
    return (
        <div className="mx-auto max-w-3xl">
            <div className="prose prose-gray max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {data.content}
                </ReactMarkdown>
            </div>
        </div>
    );
}