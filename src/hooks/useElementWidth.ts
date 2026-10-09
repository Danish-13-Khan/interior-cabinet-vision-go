import { useEffect, useState, type RefObject } from "react";

/** Live clientWidth of an element, tracked with a ResizeObserver. */
export function useElementWidth(ref: RefObject<HTMLElement | null>, initial: number) {
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
