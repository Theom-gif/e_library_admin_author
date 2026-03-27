import React, { useState } from "react";
import { BookOpen } from "lucide-react";

const BookCoverFallback = () => (
  <div className="w-10 h-14 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
    <BookOpen size={18} className="text-slate-500" />
  </div>
);

const BookCover = ({ src, alt, className = "w-10 h-14 rounded-md object-cover flex-shrink-0" }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <BookCoverFallback />;

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};

export default BookCover;
