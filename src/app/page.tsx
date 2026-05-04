"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Settings } from 'lucide-react';

type GalleryImage = {
  url: string;
  publicId: string;
  createdAt: string;
  order?: number;
};

type GalleryDocument = {
  success?: boolean;
  images: GalleryImage[];
  updatedAt: string;
};

export default function HomePage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});
  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/gallery', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to load gallery');
        }

        const data = (await response.json()) as GalleryDocument;
        setImages(
          (data.images ?? []).map((image, index) => ({
            ...image,
            order: image.order ?? index,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#f8f5ef]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,199,41,0.14),_transparent_40%),linear-gradient(180deg,_#121212_0%,_#0a0a0a_100%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-3xl border border-[#ffc729]/30 bg-[#151515]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5)] sm:p-7">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-[#ffc729]">Restaurant Menu</p>
              <h1 className="text-4xl font-bold tracking-wide text-[#fff4c8] sm:text-5xl">Triple Food</h1>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/triplefood.res?igsh=aGhzN2Q3N201bG8w"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="rounded-full border border-[#ffc729]/60 bg-[#1d1d1d] p-3 text-[#ffc729] transition hover:bg-[#262626]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z"/>
                    <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.81 4.81 0 0 0 12 7.2Zm0 7.7A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9Z"/>
                    <circle cx="17.35" cy="6.65" r="1.05"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61579254001525&ref=PROFILE_EDIT_xav_ig_profile_page_web#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="rounded-full border border-[#ffc729]/60 bg-[#1d1d1d] p-3 text-[#ffc729] transition hover:bg-[#262626]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M13.5 22v-7h2.3l.4-2.9h-2.7V10c0-.8.2-1.4 1.4-1.4H16V6.1c-.4 0-1.1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.7v2.4H8.2V15h2.3v7h3Z"/>
                  </svg>
                </a>
                <a
                  href="tel:+972569810123"
                  aria-label="Call Triple Food"
                  className="rounded-full border border-[#ffc729]/60 bg-[#1d1d1d] p-3 text-[#ffc729] transition hover:bg-[#262626]"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
              <a
                href="https://wa.me/972569810123"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#ffc729]/50 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-[#ffe08a] transition hover:bg-[#232323]"
              >
                WhatsApp: +972 56-981-0123
              </a>
            </div>
          </header>

          <section className="flex-1 rounded-[2rem] border border-[#ffc729]/25 bg-[#151515]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-6">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#ffc729]/35 bg-[#121212]">
                <p className="text-sm uppercase tracking-[0.3em] text-[#ffd65c]">
                  Loading menu images...
                </p>
              </div>
            ) : sortedImages.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#ffc729]/35 bg-[#121212] text-center">
                <p className="text-lg font-medium text-[#ffd65c]">
                  No menu images available yet.
                </p>
              </div>
            ) : (
              <div className="space-y-7">
                {sortedImages.map((image, index) => (
                  <article
                    key={image.publicId || image.url || `image-${index}`}
                    className="overflow-hidden rounded-[1.75rem] border border-[#ffc729]/25 bg-[#0f0f0f] shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
                  >
                    <div className="relative h-[70vh] min-h-[420px] w-full bg-[#151515]">
                      {!failedKeys[image.publicId || image.url || `image-${index}`] ? (
                        <img
                          src={image.url}
                          alt={image.publicId || 'Gallery image'}
                          className="w-full h-full object-contain"
                          loading={index === 0 ? 'eager' : 'lazy'}
                          onError={() => {
                            const key = image.publicId || image.url || `image-${index}`;
                            setFailedKeys((prev) => ({ ...prev, [key]: true }));
                            console.error('Image failed to load:', image.url);
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-base font-medium text-red-400">
                          Image failed to load
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-8 border-t border-[#ffc729]/25 pt-6 pb-2">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-xs text-[#cfc6a2]">Developed by Eng. Nimer Asaad</p>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <a
                  href="https://www.linkin1.com/nimerziad46"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="group rounded-full border border-[#ffc729]/35 bg-[#151515] p-3 text-[#cfc6a2] transition duration-200 hover:scale-110 hover:text-[#ffc729] hover:border-[#ffc729]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M6.94 6.5A1.44 1.44 0 1 1 5.5 5.06 1.44 1.44 0 0 1 6.94 6.5ZM4.9 8.6h4.1V20H4.9ZM10.8 8.6h3.9v1.55h.05a4.3 4.3 0 0 1 3.9-2.15c4.16 0 4.93 2.74 4.93 6.31V20h-4.08v-4.78c0-1.14 0-2.61-1.59-2.61s-1.84 1.24-1.84 2.52V20H10.8Z" />
                  </svg>
                </a>

                <a
                  href="https://www.facebook.com/nimer.assad.10"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="group rounded-full border border-[#ffc729]/35 bg-[#151515] p-3 text-[#cfc6a2] transition duration-200 hover:scale-110 hover:text-[#ffc729] hover:border-[#ffc729]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M13.5 22v-7h2.3l.4-2.9h-2.7V10c0-.8.2-1.4 1.4-1.4H16V6.1c-.4 0-1.1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.7v2.4H8.2V15h2.3v7h3Z" />
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/nimer_asaad42/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="group rounded-full border border-[#ffc729]/35 bg-[#151515] p-3 text-[#cfc6a2] transition duration-200 hover:scale-110 hover:text-[#ffc729] hover:border-[#ffc729]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z"/>
                    <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.81 4.81 0 0 0 12 7.2Zm0 7.7A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9Z"/>
                    <circle cx="17.35" cy="6.65" r="1.05"/>
                  </svg>
                </a>

                <a
                  href="https://github.com/Nimer-Asaad/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="group rounded-full border border-[#ffc729]/35 bg-[#151515] p-3 text-[#cfc6a2] transition duration-200 hover:scale-110 hover:text-[#ffc729] hover:border-[#ffc729]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.21.68-.47v-1.7c-2.77.6-3.36-1.18-3.36-1.18-.46-1.18-1.13-1.49-1.13-1.49-.93-.64.07-.63.07-.63 1.03.07 1.57 1.06 1.57 1.06.92 1.57 2.43 1.12 3.02.86.09-.67.36-1.12.65-1.38-2.2-.25-4.52-1.1-4.52-4.88 0-1.08.39-1.96 1.03-2.65-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.69 1.03 1.57 1.03 2.65 0 3.79-2.33 4.63-4.54 4.87.37.32.7.95.7 1.92v2.84c0 .27.18.57.69.47A10 10 0 0 0 12 2Z" />
                  </svg>
                </a>

                <a
                  href="https://wa.me/970569755546"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="group rounded-full border border-[#ffc729]/35 bg-[#151515] p-3 text-[#cfc6a2] transition duration-200 hover:scale-110 hover:text-[#ffc729] hover:border-[#ffc729]"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </footer>

          <Link
            href="/admin"
            title="Admin"
            aria-label="Admin"
            className="fixed bottom-[10px] left-[10px] z-50 inline-flex items-center gap-1 rounded-full border border-[#ffc729]/30 bg-[#151515] px-2 py-1 text-[10px] font-medium text-[#ffe08a] opacity-20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition duration-200 hover:scale-110 hover:opacity-100 hover:text-[#ffc729]"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
