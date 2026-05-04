'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageData {
  url: string;
  publicId: string;
  createdAt: Date;
}

interface ImageUploadProps {
  onUploadSuccess: (galleryImages: ImageData[]) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

export default function ImageUpload({ onUploadSuccess, disabled, onUploadingChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      setError(null);
      return;
    }

    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json().catch(() => null);
        throw new Error(data?.error || 'Upload failed');
      }

      const gallery = await uploadResponse.json();
      onUploadSuccess(gallery.images ?? []);

      setPreview(null);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <label
        className={`block rounded-[1.5rem] border-2 border-dashed p-6 text-center transition-colors ${
          uploading || disabled
            ? 'cursor-not-allowed border-[#3b3521] bg-[#0f0f0f] opacity-60'
            : 'cursor-pointer border-[#3b3521] bg-[#0f0f0f] hover:border-[#ffc729]'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          disabled={uploading || disabled}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#f8f5ef]">
            {file ? file.name : 'Choose a menu image'}
          </p>
          <p className="text-sm text-[#cfc6a2]">
            JPG, PNG, GIF, or WebP
          </p>
        </div>
      </label>

      {preview && (
        <div className="space-y-4">
          <div className="relative h-48 w-full overflow-hidden rounded-[1.5rem] border border-[#3b3521] bg-[#0b0b0b]">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full rounded-full bg-[#ffc729] px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#ffd65c] disabled:cursor-not-allowed disabled:bg-[#3b3521] disabled:text-[#d0c6a0]"
          >
            {uploading ? 'Uploading...' : 'Upload Menu Image'}
          </button>
        </div>
      )}
    </div>
  );
}
