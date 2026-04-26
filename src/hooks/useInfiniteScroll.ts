import { useEffect, useRef } from "react";

/**
 * Calls `onLoadMore` when the sentinel element enters the viewport.
 * Attach `sentinelRef` to a div at the bottom of your list.
 */
export function useInfiniteScroll(onLoadMore: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, enabled]);

  return sentinelRef;
}
