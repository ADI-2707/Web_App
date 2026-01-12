import { useEffect, useRef, useCallback } from "react";
import { Folder } from "lucide-react";

export default function ProjectSection({
  title,
  projects = [],
  loadMore,
  hasMore,
  onOpenProject,
}) {
  const observerRef = useRef(null);

  const handleIntersect = useCallback(
    ([entry]) => {
      // Only trigger if intersecting AND we actually have a next page
      if (entry.isIntersecting && hasMore && projects.length > 0) {
        loadMore?.();
      }
    },
    [hasMore, loadMore, projects.length]
  );

  useEffect(() => {
    // If no more items or no sentinel, don't observe
    if (!hasMore || !observerRef.current) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1, // Trigger earlier so the user doesn't see a "pop"
      root: null, 
    });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleIntersect, hasMore]);

  if (!projects.length && !hasMore) return null;

  return (
    <section className="project-section">
      <h2 className="project-section-title">{title}</h2>
      <div className="project-row">
        {projects.map((p) => (
          <div
            key={`${title}-${p.id}`}
            className="project-card card-surface"
            onClick={() => onOpenProject?.(p)}
          >
            <div className="project-card-icon"><Folder size={28} /></div>
            <div className="project-card-title">{p.name}</div>
            <div className="project-card-meta">Role: {p.role.toUpperCase()}</div>
          </div>
        ))}

        {/* The sentinel div only exists if there is more to load */}
        {hasMore && (
          <div ref={observerRef} className="project-card skeleton" style={{ minWidth: '10px' }} />
        )}
      </div>
    </section>
  );
}