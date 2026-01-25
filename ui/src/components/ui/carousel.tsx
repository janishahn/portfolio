"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { cn } from "@/lib/utils";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  showControls?: boolean;
}

export function Carousel({ children, className, showControls = true, ...props }: CarouselProps) {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    renderMode: "performance",
    slides: { origin: "center", perView: 1.2, spacing: 16 },
    loop: true,
    mode: "snap",
  });

  return (
    <div className={cn("relative group", className)} {...props}>
      <div ref={sliderRef} className="keen-slider rounded">
        {React.Children.map(children, (child, idx) => (
          <div key={idx} className="keen-slider__slide flex justify-center items-center">
            {child}
          </div>
        ))}
      </div>
      {showControls && (
        <>
          <button
            type="button"
            onClick={() => instanceRef.current?.prev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow backdrop-blur hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => instanceRef.current?.next()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow backdrop-blur hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
} 