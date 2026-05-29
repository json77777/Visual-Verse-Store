"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

function shuffle(array: number[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function PixelTransitionHero({ images }: { images: string[] }) {
  const [isClient, setIsClient] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(images.length > 1 ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [rect, setRect] = useState({ width: 1200, height: 800 });
  const [grid, setGrid] = useState({ columns: 24, rows: 16 });
  const containerRef = useRef<HTMLDivElement>(null);

  const totalBlocks = grid.columns * grid.rows;

  const shuffledIndices = useMemo(() => {
    return shuffle(Array.from({ length: totalBlocks }, (_, i) => i));
  }, [totalBlocks]);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        setRect({ width: w, height: h });
        
        // If mobile, collapse the grid to a single block (crossfade) to save battery/GPU.
        // Otherwise, target ~50px squares for the premium shatter effect.
        const isMobile = window.innerWidth < 768;
        const targetSize = isMobile ? Math.max(w, h) : 50;
        
        const newCols = Math.max(1, Math.round(w / targetSize));
        const newRows = Math.max(1, Math.round(h / targetSize));
        
        setGrid(prev => prev.columns === newCols && prev.rows === newRows ? prev : { columns: newCols, rows: newRows });
      }
    }
    
    setIsClient(true);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      // 1. The grid (next image) starts fading IN
      setIsTransitioning(true);

      // 2. Wait for pieces to fully assemble (slower animation)
      setTimeout(() => {
        // Instantly make the bottom image the new image, reset grid to invisible
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setNextIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false); 
      }, 2400); 

    }, 5500); 

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden">
      {/* 
        Bottom Layer: The CURRENT Image.
        This stays perfectly still while the new image pieces assemble on top.
      */}
      <Image
        src={images[currentIndex]}
        alt="Hero background"
        fill
        priority
        className="object-cover object-center"
      />

      {/* 
        Top Layer: A grid of pieces of the NEXT Image fading IN
      */}
      <div className="absolute inset-0 pointer-events-none" style={{ display: "grid", gridTemplateColumns: `repeat(${grid.columns}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)` }}>
        {isClient ? Array.from({ length: totalBlocks }).map((_, i) => {
          const c = i % grid.columns;
          const r = Math.floor(i / grid.columns);

          const shufflePosition = shuffledIndices.indexOf(i);
          const delay = (shufflePosition / totalBlocks) * 1.5;

          return (
            <div
              key={i}
              className="relative w-full h-full overflow-hidden"
              style={{
                opacity: isTransitioning ? 1 : 0,
                transform: `scale(${isTransitioning ? 1 : 0.3})`,
                transitionProperty: "opacity, transform",
                transitionDuration: isTransitioning ? "0.8s" : "0s", // Smoother longer duration
                transitionDelay: isTransitioning ? `${delay}s` : "0s",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Buttery smooth ease-out curve
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: rect.width,
                  height: rect.height,
                  left: -(c * (rect.width / grid.columns)),
                  top: -(r * (rect.height / grid.rows)),
                }}
              >
                <img
                  src={images[nextIndex]}
                  alt=""
                  decoding="async"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              </div>
            </div>
          );
        }) : null}
      </div>

      {/* Hidden preloader to force browser to cache and decode images into GPU memory */}
      <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, overflow: "hidden" }}>
        {images.map((src, idx) => (
          <Image key={idx} src={src} alt="" fill priority />
        ))}
      </div>
    </div>
  );
}
