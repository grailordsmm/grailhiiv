"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
const animations = [
  () => import("@/data/process-conversation.json"),
  () => import("@/data/process-plan.json"),
  () => import("@/data/process-work.json"),
  () => import("@/data/process-results.json"),
];

const motionQuery = "(prefers-reduced-motion: reduce)";
const stillConversation: [number, number] = [20, 21];
const stillChecklist: [number, number] = [96, 97];
const stillGraph: [number, number] = [45, 46];

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function ProcessIcon({ index, className }: { index: number; className?: string }) {
  const reduced = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
  const container = useRef<HTMLDivElement>(null);
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void animations[index]().then((module) => {
        if (!cancelled) setAnimationData(module.default);
      }).catch((error) => {
        if (!cancelled) console.error("Unable to load process animation", error);
      });
    }, { rootMargin: "800px" });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [index]);

  return (
    <div ref={container} className={className} aria-hidden="true">
      {animationData !== null && (
        <Lottie key={reduced ? "still" : "animated"} animationData={animationData} loop={!reduced} autoplay={!reduced} initialSegment={reduced ? (index === 0 ? stillConversation : index === 2 ? stillChecklist : index === 3 ? stillGraph : undefined) : undefined} style={{ width: "100%", height: "100%" }} />
      )}
    </div>
  );
}
