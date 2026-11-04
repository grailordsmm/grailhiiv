"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, type ReactNode } from "react";

let activeFrame = 0;

function cancelScroll() {
  cancelAnimationFrame(activeFrame);
}

export function useSmoothAnchor() {
  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener("wheel", cancelScroll, { passive: true });
    window.addEventListener("touchstart", cancelScroll, { passive: true });
    window.addEventListener("keydown", cancelScroll);
    return () => {
      cancelScroll();
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchstart", cancelScroll);
      window.removeEventListener("keydown", cancelScroll);
    };
  }, [pathname]);

  return (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    cancelScroll();
    if (window.location.hash !== href) window.history.pushState(window.history.state, "", href);
    target.focus({ preventScroll: true });
    const startY = window.scrollY;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const distance = target.getBoundingClientRect().top - margin;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, startY + distance);
      return;
    }
    let start: number | undefined;
    const step = (time: number) => {
      start ??= time;
      const progress = Math.min((time - start) / 900, 1);
      window.scrollTo(0, startY + distance * (1 - (1 - progress) ** 3));
      if (progress < 1) activeFrame = requestAnimationFrame(step);
    };
    activeFrame = requestAnimationFrame(step);
  };
}

export function SmoothAnchorLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const scroll = useSmoothAnchor();
  return <Link href={href} className={className} onClick={(event) => scroll(event, href)}>{children}</Link>;
}
