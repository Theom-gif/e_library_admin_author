import React from "react";
import { buildAuthorPhotoCandidates } from "../services/profileStorage";

export default function AuthorAvatarImage({ profile, alt, className }) {
  const candidates = React.useMemo(() => buildAuthorPhotoCandidates(profile), [profile]);
  const [candidateIndex, setCandidateIndex] = React.useState(0);

  React.useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const currentSrc = candidates[candidateIndex] || "";

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        setCandidateIndex((current) =>
          current < candidates.length - 1 ? current + 1 : current,
        );
      }}
    />
  );
}
