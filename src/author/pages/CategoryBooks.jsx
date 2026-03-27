// import React from 'react';
// import { motion } from 'motion/react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { ArrowLeft, Eye, List } from 'lucide-react';

// const SAMPLE_BOOKS = [
//   {
//     id: 1,
//     title: 'Crimson Echoes',
//     username: 'writer_studio',
//     reads: '1.2M',
//     parts: 48,
//     excerpt:
//       "A mysterious letter arrives at midnight and pulls two strangers into an old city's secrets. Every chapter reveals a new clue, but the truth is more dangerous than they imagined…",
//     coverUrl: '',
//     tags: ['mystery', 'slow-burn', 'found-family', 'twists', 'urban-fantasy', 'secrets'],
//   },
//   {
//     id: 2,
//     title: 'The Last Train Home',
//     username: 'inkandcoffee',
//     reads: '73.4K',
//     parts: 22,
//     excerpt:
//       'On the final train of the night, a forgotten notebook changes hands. What starts as a quiet ride becomes a journey through memories, choices, and second chances.',
//     coverUrl: '',
//     tags: ['romance', 'slice-of-life', 'comfort', 'drama', 'healing'],
//   },
//   {
//     id: 3,
//     title: 'Blueprints & Breakthroughs',
//     username: 'techscribe',
//     reads: '9.8K',
//     parts: 15,
//     excerpt:
//       "A startup team races against time to ship a product that could change everything. The only problem: the bugs aren't just in the code—they're in the plan.",
//     coverUrl: '',
//     tags: ['business', 'technology', 'teamwork', 'startup-life', 'inspiration'],
//   },
//   {
//     id: 4,
//     title: 'Ashes of the Crown',
//     username: 'paperkingdom',
//     reads: '3.1M',
//     parts: 96,
//     excerpt:
//       'A fallen kingdom. A hidden heir. A promise carved into stone. When the crown burns, the only way forward is through the fire.',
//     coverUrl: '',
//     tags: ['fantasy', 'royalty', 'adventure', 'magic', 'enemies-to-allies', 'war'],
//   },
// ];

// const TagPill = ({ label }) => (
//   <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
//     {label}
//   </span>
// );

// const Cover = ({ title, coverUrl }) => {
//   const initial = String(title || '?').trim().slice(0, 1).toUpperCase();

//   return (
//     <div className="w-28 sm:w-32 shrink-0">
//       {coverUrl ? (
//         <img
//           src={coverUrl}
//           alt={title}
//           className="w-full aspect-[2/3] rounded-2xl object-cover border border-slate-200 shadow-sm"
//           loading="lazy"
//         />
//       ) : (
//         <div className="w-full aspect-[2/3] rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//           <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-700 grid place-items-center">
//             <span className="text-white text-4xl font-extrabold tracking-tight">{initial}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default function CategoryBooks() {
//   const MotionDiv = motion.div;
//   const navigate = useNavigate();
//   const params = useParams();
//   const categoryName = String(params.slug || 'Category').replace(/-/g, ' ');

//   return (
//     <div className="p-8 max-w-7xl mx-auto space-y-8">
//       <div className="flex items-start justify-between gap-4">
//         <div className="space-y-2">
//           <button
//             onClick={() => navigate(-1)}
//             className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
//           >
//             <ArrowLeft className="size-4" />
//             <span>Back</span>
//           </button>

//           <div>
//             <h1 className="text-3xl font-bold tracking-tight capitalize">{categoryName}</h1>
//             <p className="text-slate-500">
//               Browse books in this category. Discover tags, skim summaries, and pick your next read.
//             </p>
//           </div>
//         </div>

//         <div className="hidden sm:flex items-center gap-2">
//           <span className="rounded-full bg-slate-900/5 px-4 py-2 text-xs font-bold text-slate-600">
//             {SAMPLE_BOOKS.length} books
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
//         {SAMPLE_BOOKS.map((book, index) => {
//           const tags = Array.isArray(book.tags) ? book.tags : [];
//           const visibleTags = tags.slice(0, 3);
//           const hiddenCount = Math.max(0, tags.length - visibleTags.length);

//           return (
//             <MotionDiv
//               key={book.id}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.04 }}
//               className="flex gap-6 rounded-2xl hover:bg-slate-900/5 transition-colors p-3 -m-3"
//             >
//               <Cover title={book.title} coverUrl={book.coverUrl} />

//               <div className="flex-1 min-w-0 space-y-3">
//                 <div className="space-y-1">
//                   <h2 className="text-xl font-extrabold text-slate-900 truncate">{book.title}</h2>
//                   <p className="text-sm text-slate-500 truncate">{book.username}</p>
//                 </div>

//                 <div className="flex items-center gap-4 text-sm text-slate-500">
//                   <span className="inline-flex items-center gap-1.5">
//                     <Eye className="size-4" />
//                     {book.reads}
//                   </span>
//                   <span className="inline-flex items-center gap-1.5">
//                     <List className="size-4" />
//                     {book.parts} parts
//                   </span>
//                 </div>

//                 <p className="text-sm text-slate-600 leading-relaxed max-h-[4.5rem] overflow-hidden">
//                   {book.excerpt}
//                 </p>

//                 <div className="flex flex-wrap gap-2">
//                   {visibleTags.map((tag) => (
//                     <TagPill key={tag} label={tag} />
//                   ))}
//                   {hiddenCount > 0 && <TagPill label={`+${hiddenCount} more`} />}
//                 </div>

//                 <div className="pt-1">
//                   <button
//                     type="button"
//                     onClick={() => window.alert('Open book details (wire this to your route).')}
//                     className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
//                   >
//                     Read more
//                   </button>
//                 </div>
//               </div>
//             </MotionDiv>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
