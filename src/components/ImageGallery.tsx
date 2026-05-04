'use client';

import { useState } from 'react';

interface ImageData {
  url: string;
  publicId: string;
  createdAt: Date;
  order?: number;
}

interface ImageGalleryProps {
  images: ImageData[];
  onDelete?: (publicId: string) => void;
  onMoveUp?: (publicId: string) => void;
  onMoveDown?: (publicId: string) => void;
  busyPublicId?: string | null;
  actionsDisabled?: boolean;
  showDeleteButton?: boolean;
}

export default function ImageGallery({
  images,
  onDelete,
  onMoveUp,
  onMoveDown,
  busyPublicId,
  actionsDisabled = false,
  showDeleteButton = false,
}: ImageGalleryProps) {
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-[#cfc6a2]">No images found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {images.map((image, index) => (
        <div
          key={image.publicId || image.url || `image-${index}`}
          className="overflow-hidden rounded-3xl border border-[#ffc729]/20 bg-[#0f0f0f] shadow-[0_14px_45px_rgba(0,0,0,0.35)]"
        >
          {image.url ? (
            <div className="relative h-64 w-full bg-[#0b0b0b]">
              {!failedKeys[image.publicId || image.url || `image-${index}`] ? (
                <img
                  src={image.url}
                  alt={image.publicId || 'Gallery image'}
                  className="w-full h-full object-contain"
                  onError={() => {
                    const key = image.publicId || image.url || `image-${index}`;
                    setFailedKeys((prev) => ({ ...prev, [key]: true }));
                    console.error('Image failed to load:', image.url);
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-sm font-medium text-red-300">
                  Image failed to load
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm font-medium text-[#cfc6a2]">
              Missing image URL
            </div>
          )}

          <div className="space-y-3 border-t border-[#2b2618] bg-[#121212] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.22em] text-[#ffc729]">
                Image {index + 1}
              </p>
              {image.url && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(image.url);
                    const key = image.publicId || image.url || `image-${index}`;
                    setCopiedKey(key);
                    window.setTimeout(() => setCopiedKey(null), 1500);
                  }}
                  className="rounded-full border border-[#ffc729]/30 bg-[#0f0f0f] px-3 py-1 text-[11px] font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
                >
                  {copiedKey === (image.publicId || image.url || `image-${index}`) ? 'Copied' : 'Copy URL'}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onMoveUp?.(image.publicId)}
                disabled={index === 0 || !onMoveUp || actionsDisabled}
                className="flex-1 rounded-full border border-[#ffc729]/30 bg-[#0f0f0f] px-3 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move Up
              </button>
              <button
                type="button"
                onClick={() => onMoveDown?.(image.publicId)}
                disabled={index === images.length - 1 || !onMoveDown || actionsDisabled}
                className="flex-1 rounded-full border border-[#ffc729]/30 bg-[#0f0f0f] px-3 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move Down
              </button>
            </div>

            {showDeleteButton && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(image.publicId)}
                disabled={busyPublicId === image.publicId || actionsDisabled}
                className="w-full rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
