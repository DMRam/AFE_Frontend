// import type { TeamSection } from "../../../content/types/pageBlocks";

// export function TeamSectionView({ data }: { data: TeamSection }) {
//     return (
//         <div>
//             {data.title ? (
//                 <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
//                     {data.title}
//                 </h2>
//             ) : null}

//             <div className="mt-10 grid gap-10 md:grid-cols-3">
//                 {data.members.map((m, idx) => (
//                     <div key={`${m.name}-${idx}`}>
//                         {m.imageUrl ? (
//                             <img
//                                 src={m.imageUrl}
//                                 alt={m.name}
//                                 className="aspect-square w-full max-w-[260px] object-cover"
//                             />
//                         ) : null}

//                         <div className="mt-4 text-sm font-semibold text-gray-900">{m.name}</div>

//                         {m.role ? (
//                             <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
//                                 {m.role}
//                             </div>
//                         ) : null}

//                         {m.bio ? (
//                             <div className="mt-3 text-sm leading-6 text-gray-700">{m.bio}</div>
//                         ) : null}

//                         {m.email ? (
//                             <a
//                                 className="mt-3 inline-block text-sm font-semibold text-gray-900 underline"
//                                 href={`mailto:${m.email}`}
//                             >
//                                 {m.email}
//                             </a>
//                         ) : null}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
