'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import ImageGallery from '@/components/ImageGallery';

interface ImageData {
  url: string;
  publicId: string;
  createdAt: Date;
  order?: number;
}

const SESSION_AUTH_KEY = 'adminAuthenticated';
const SESSION_ACTIVITY_KEY = 'adminLastActivity';
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

function sortImagesByOrder(images: ImageData[]): ImageData[] {
  return [...images].sort((a, b) => {
    const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function normalizeImages(images: ImageData[]): ImageData[] {
  return sortImagesByOrder(images).map((image, index) => ({
    ...image,
    createdAt: new Date(image.createdAt),
    order: index,
  }));
}

export default function AdminPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [changingPasswordLoading, setChangingPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const lastActivityWriteRef = useRef(0);
  const skipNextAuthFetchRef = useRef(false);

  const clearAdminSession = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_AUTH_KEY);
    window.sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
    lastActivityWriteRef.current = 0;
  }, []);

  const writeAdminActivity = useCallback((force = false) => {
    const now = Date.now();

    if (force || now - lastActivityWriteRef.current > 1000) {
      if (window.sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
        window.sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
        lastActivityWriteRef.current = now;
      }
    }
  }, []);

  const handleSessionExpired = useCallback(() => {
    clearAdminSession();
    skipNextAuthFetchRef.current = false;
    setIsAuthenticated(false);
    setLoading(false);
    setRefreshing(false);
    setUploading(false);
    setDeleting(null);
    setReordering(null);
    setChangingPasswordLoading(false);
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassword('');
    setImages([]);
    setMessage({ type: 'error', text: 'Session expired. Please login again.' });
  }, [clearAdminSession]);

  const fetchGallery = useCallback(
    async ({ silent = false, clearMessage = true }: { silent?: boolean; clearMessage?: boolean } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        if (clearMessage) {
          setMessage(null);
        }

        writeAdminActivity(true);
        const response = await fetch('/api/gallery', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Unable to load images');
        }

        const data = await response.json();
        setImages(normalizeImages((data.images ?? []) as ImageData[]));
      } catch (error) {
        console.error('Failed to fetch images:', error);
        setMessage({
          type: 'error',
          text: 'Could not load the current images. Please try again.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [writeAdminActivity]
  );

  useEffect(() => {
    const savedAuth = window.sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
    const lastActivityRaw = window.sessionStorage.getItem(SESSION_ACTIVITY_KEY);
    const lastActivity = Number(lastActivityRaw);

    if (savedAuth && Number.isFinite(lastActivity) && Date.now() - lastActivity <= SESSION_TIMEOUT_MS) {
      lastActivityWriteRef.current = lastActivity;
      setIsAuthenticated(true);
      writeAdminActivity(true);
    } else if (savedAuth) {
      handleSessionExpired();
    }

    setAuthChecked(true);
  }, [handleSessionExpired, writeAdminActivity]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) {
      return;
    }

    if (skipNextAuthFetchRef.current) {
      skipNextAuthFetchRef.current = false;
      return;
    }

    writeAdminActivity(true);
    void fetchGallery({ silent: true, clearMessage: false });
  }, [authChecked, fetchGallery, isAuthenticated, writeAdminActivity]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    const activityHandler = () => {
      if (window.sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
        writeAdminActivity();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'click',
      'keydown',
      'scroll',
      'touchstart',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, activityHandler);
    });

    const interval = window.setInterval(() => {
      if (window.sessionStorage.getItem(SESSION_AUTH_KEY) !== 'true') {
        return;
      }

      const lastActivity = Number(window.sessionStorage.getItem(SESSION_ACTIVITY_KEY));
      if (!Number.isFinite(lastActivity) || Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        handleSessionExpired();
      }
    }, 30000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, activityHandler);
      });
      window.clearInterval(interval);
    };
  }, [authChecked, handleSessionExpired, writeAdminActivity]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Login failed');
      }

      window.sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      writeAdminActivity(true);
      skipNextAuthFetchRef.current = true;
      setIsAuthenticated(true);
      setPassword('');
      setMessage({
        type: 'success',
        text: 'Logged in successfully.',
      });
      void fetchGallery({ silent: true, clearMessage: false });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Login failed.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    setImages([]);
    setMessage(null);
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUploadSuccess = (galleryImages: ImageData[]) => {
    writeAdminActivity(true);
    setImages(normalizeImages(galleryImages));
    setMessage({
      type: 'success',
      text: 'Image uploaded successfully.',
    });
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm('Delete this image?')) {
      return;
    }

    try {
      writeAdminActivity(true);
      setMessage(null);
      setDeleting(publicId);

      const response = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Delete failed');
      }

      const data = await response.json();
      setImages(normalizeImages((data.images ?? []) as ImageData[]));
      setMessage({
        type: 'success',
        text: 'Image deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete image:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete image.',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleMove = async (publicId: string, direction: 'up' | 'down') => {
    try {
      writeAdminActivity(true);
      setMessage(null);
      setReordering(publicId);

      const currentImages = normalizeImages(images);
      const fromIndex = currentImages.findIndex((image) => image.publicId === publicId);

      if (fromIndex === -1) {
        throw new Error('Image not found');
      }

      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= currentImages.length) {
        return;
      }

      console.log('move image', fromIndex, toIndex);

      const reorderedImages = [...currentImages];
      [reorderedImages[fromIndex], reorderedImages[toIndex]] = [
        reorderedImages[toIndex],
        reorderedImages[fromIndex],
      ];

      const normalizedReordered = reorderedImages.map((image, index) => ({
        ...image,
        order: index,
      }));

      setImages(normalizedReordered);

      const response = await fetch('/api/gallery/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: normalizedReordered.map((image, index) => ({
            publicId: image.publicId,
            url: image.url,
            createdAt: new Date(image.createdAt).toISOString(),
            order: index,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Reorder failed');
      }

      const data = await response.json();
      console.log('reorder response', data);
      setImages(normalizeImages((data.images ?? []) as ImageData[]));
      setMessage({
        type: 'success',
        text: 'Image order updated.',
      });
    } catch (error) {
      console.error('Failed to reorder image:', error);
      await fetchGallery();
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reorder image.',
      });
    } finally {
      setReordering(null);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    try {
      writeAdminActivity(true);
      setChangingPasswordLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to change password');
      }

      clearAdminSession();
      skipNextAuthFetchRef.current = false;
      setIsAuthenticated(false);
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setImages([]);
      setMessage({
        type: 'success',
        text: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to change password.',
      });
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  const actionsDisabled =
    loading || refreshing || uploading || deleting !== null || reordering !== null || changingPasswordLoading;

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#f8f5ef] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[#ffc729]/20 bg-[#151515] p-6 text-center shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-[#ffc729]">Triple Food Admin</p>
            <p className="mt-4 text-sm text-[#d0c6a0]">Checking access...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#f8f5ef] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="w-full rounded-[2rem] border border-[#ffc729]/20 bg-[#151515] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#ffc729]">Private access</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#fff4c8]">Triple Food Admin</h1>
            <p className="mt-2 text-sm text-[#d0c6a0]">Enter the password to manage menu images.</p>

            {message && (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                  message.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border border-red-500/30 bg-red-500/10 text-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="mt-6 space-y-3 text-left">
              <label className="block text-sm font-medium text-[#f1e7bf]" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-2xl border border-[#3d3520] bg-[#0f0f0f] px-4 py-3 text-[#f8f5ef] outline-none transition focus:border-[#ffc729] focus:ring-2 focus:ring-[#ffc729]/20"
                autoComplete="current-password"
                disabled={authLoading}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-6 w-full rounded-full bg-[#ffc729] px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#ffd65c] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {authLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#f8f5ef] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#ffc729]/20 bg-[#121212] p-5 shadow-[0_16px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#ffc729]">Triple Food Admin</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#fff4c8] sm:text-4xl">Manage menu images</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#cfc6a2]">
                Upload, reorder, delete, and preview the restaurant gallery. Access is session-based, and password changes require re-login.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-[#ffc729]/35 bg-[#0f0f0f] px-4 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
              >
                View Display
              </Link>
              <button
                type="button"
                onClick={() => void fetchGallery({ silent: true })}
                disabled={refreshing}
                className="rounded-full border border-[#ffc729]/35 bg-[#0f0f0f] px-4 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="rounded-full border border-[#ffc729]/35 bg-[#0f0f0f] px-4 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#ffc729]/35 bg-[#0f0f0f] px-4 py-2 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-[#ffc729]/20 bg-[#121212] p-5 shadow-[0_14px_50px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#fff4c8]">Upload image</h2>
              <p className="mt-1 text-sm text-[#cfc6a2]">Choose one image at a time.</p>
            </div>
            <ImageUpload
              onUploadSuccess={(nextImages) => {
                setUploading(false);
                handleUploadSuccess(nextImages);
              }}
              onUploadingChange={setUploading}
              disabled={actionsDisabled}
            />
            {uploading && (
              <p className="mt-3 text-sm font-medium text-[#ffc729]">Uploading menu image...</p>
            )}
          </aside>

          <section className="rounded-[2rem] border border-[#ffc729]/20 bg-[#121212] p-5 shadow-[0_14px_50px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#fff4c8]">Current images</h2>
                <p className="mt-1 text-sm text-[#cfc6a2]">
                  {loading ? 'Loading images...' : `${images.length} image${images.length === 1 ? '' : 's'} in the gallery`}
                </p>
              </div>
              {(deleting || reordering) && (
                <div className="rounded-full border border-[#ffc729]/25 bg-[#0f0f0f] px-3 py-1 text-xs font-medium text-[#ffe08a]">
                  {deleting ? 'Deleting...' : 'Reordering...'}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#ffc729]/25 bg-[#0f0f0f]">
                <p className="text-sm uppercase tracking-[0.3em] text-[#ffc729]">Loading current images...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageGallery
                  images={normalizeImages(images)}
                  onDelete={handleDelete}
                  onMoveUp={(publicId) => void handleMove(publicId, 'up')}
                  onMoveDown={(publicId) => void handleMove(publicId, 'down')}
                  busyPublicId={deleting ?? reordering}
                  actionsDisabled={actionsDisabled}
                  showDeleteButton
                />
              </div>
            )}
          </section>
        </div>

        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
            <form
              onSubmit={handleChangePassword}
              className="w-full max-w-md rounded-[2rem] border border-[#ffc729]/20 bg-[#121212] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#ffc729]">Security</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff4c8]">Change password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-[#cfc6a2] transition hover:bg-[#1f1f1f] hover:text-[#ffe08a]"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-[#f1e7bf]">
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#3d3520] bg-[#0f0f0f] px-4 py-3 text-[#f8f5ef] outline-none transition focus:border-[#ffc729] focus:ring-2 focus:ring-[#ffc729]/20"
                    disabled={changingPasswordLoading}
                  />
                </label>

                <label className="block text-sm font-medium text-[#f1e7bf]">
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#3d3520] bg-[#0f0f0f] px-4 py-3 text-[#f8f5ef] outline-none transition focus:border-[#ffc729] focus:ring-2 focus:ring-[#ffc729]/20"
                    disabled={changingPasswordLoading}
                  />
                </label>

                <label className="block text-sm font-medium text-[#f1e7bf]">
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#3d3520] bg-[#0f0f0f] px-4 py-3 text-[#f8f5ef] outline-none transition focus:border-[#ffc729] focus:ring-2 focus:ring-[#ffc729]/20"
                    disabled={changingPasswordLoading}
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 rounded-full border border-[#ffc729]/25 bg-[#0f0f0f] px-4 py-3 text-sm font-medium text-[#ffe08a] transition hover:border-[#ffc729] hover:text-[#ffc729]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPasswordLoading}
                  className="flex-1 rounded-full bg-[#ffc729] px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#ffd65c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {changingPasswordLoading ? 'Saving...' : 'Save password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
