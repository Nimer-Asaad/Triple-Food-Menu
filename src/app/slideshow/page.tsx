'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type SlideshowImage = {
  url: string;
  publicId: string;
  createdAt: string;
  order?: number;
};

type GalleryResponse = {
  success?: boolean;
  images: SlideshowImage[];
};

export default function SlideshowPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSlideshow = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/gallery?type=slideshow', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to load slideshow');
        }

        const data = (await response.json()) as GalleryResponse;
        setImages(data.images ?? []);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Failed to fetch slideshow:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlideshow();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length === 0) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        router.push('/');
      }
    };

    rootRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, router]);

  const currentImage = images[currentIndex];
  const imageKey = currentImage?.publicId || currentImage?.url || `slideshow-${currentIndex}`;
  const isImageFailed = failedKeys[imageKey];

  return (
    <main
      ref={rootRef}
      tabIndex={-1}
      className="fixed inset-0 h-screen w-screen cursor-none overflow-hidden bg-black"
    >
      <style>{`
        @keyframes slowZoom {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.1);
          }
        }

        @keyframes softFadeIn {
          from {
            opacity: 0.75;
          }
          to {
            opacity: 1;
          }
        }

        .slideshow-frame {
          animation: softFadeIn 220ms ease-out;
        }

        .slideshow-zoom {
          animation: slowZoom 5s linear forwards;
          transform-origin: center center;
        }
      `}</style>

      <div className="absolute left-4 top-4 z-30 pointer-events-auto">
        <Link
          href="/"
          aria-label="Back to homepage"
          className="inline-flex items-center justify-center rounded-full border border-[#ffc729]/30 bg-black/40 px-3 py-2 text-sm font-medium text-[#ffe08a] backdrop-blur-sm transition hover:border-[#ffc729] hover:text-[#ffc729]"
        >
          ←
        </Link>
      </div>

      <div className="relative h-full w-full bg-black">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm tracking-[0.2em] text-[#ffc729] uppercase">Loading slideshow…</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-lg text-[#cfc6a2]">No slideshow images available yet.</p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-full border border-[#ffc729]/35 bg-[#0f0f0f] px-6 py-3 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        ) : !isImageFailed ? (
          <div key={imageKey} className="slideshow-frame absolute inset-0">
            <div className="slideshow-zoom absolute inset-0">
              <Image
                src={currentImage.url}
                alt={`Slide ${currentIndex + 1}`}
                fill
                priority
                sizes="100vw"
                quality={92}
                className="object-cover"
                onError={() => {
                  setFailedKeys((prev) => ({ ...prev, [imageKey]: true }));
                  console.error('Image failed to load:', currentImage.url);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <p className="text-sm text-[#cfc6a2]">Image failed to load</p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30" />
      </div>

      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-[#ffc729] scale-125' : 'bg-[#ffc729]/30 hover:bg-[#ffc729]/60'
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-5 right-5 z-30 rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium text-[#ffc729]/90 backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </main>
  );
}
