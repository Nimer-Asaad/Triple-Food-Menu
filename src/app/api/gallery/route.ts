import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { SiteGallery } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: upload buffer to Cloudinary using upload_stream
function uploadBufferToCloudinary(buffer: Buffer): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'site-gallery',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    stream.end(buffer);
  });
}

type GalleryImage = {
  url: string;
  publicId: string;
  createdAt: Date;
  order?: number;
};

function sanitizeImages(input: unknown): GalleryImage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const raw = (item ?? {}) as Partial<GalleryImage>;

    return {
      url: typeof raw.url === 'string' ? raw.url : '',
      publicId: typeof raw.publicId === 'string' ? raw.publicId : '',
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      order: typeof raw.order === 'number' ? raw.order : index,
    };
  });
}

function sortImages(images: GalleryImage[]): GalleryImage[] {
  return [...images].sort((a, b) => {
    const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function normalizeOrder(images: GalleryImage[]): GalleryImage[] {
  return sortImages(sanitizeImages(images)).map((image, index) => ({
    ...image,
    order: index,
  }));
}

export async function GET() {
  try {
    await connectToDatabase();

    let gallery = await SiteGallery.findOne();
    if (!gallery) {
      gallery = new SiteGallery({ images: [], updatedAt: new Date() });
      await gallery.save();
    }

    const orderedImages = normalizeOrder(gallery.images as unknown as GalleryImage[]);
    return NextResponse.json(
      { success: true, images: orderedImages },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/gallery GET:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const publicId = body?.publicId;

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'publicId is required' }, { status: 400 });
    }

    // Ensure Cloudinary is configured (cloudinary.ts also configures, but keep safe here)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    // Update DB
    await connectToDatabase();
    const gallery = (await SiteGallery.findOne()) || new SiteGallery({ images: [], updatedAt: new Date() });

    const remainingImages = (gallery.images as unknown as GalleryImage[]).filter((img) => img.publicId !== publicId);
    gallery.images = normalizeOrder(remainingImages) as any;
    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json({ success: true, images: normalizeOrder(gallery.images as unknown as GalleryImage[]) });
  } catch (error) {
    console.error('Error in /api/gallery DELETE:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;

    // Validate file-like object
    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 });
    }

    const bytes = await (file as any).arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Configure Cloudinary from env (ensures values exist at runtime)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadResult = await uploadBufferToCloudinary(buffer);

    // Connect to MongoDB
    await connectToDatabase();

    // Ensure we have a gallery document
    let gallery = await SiteGallery.findOne();
    if (!gallery) {
      gallery = new SiteGallery({ images: [], updatedAt: new Date() });
    }

    // Insert new image at the end of current order
    const currentImages = normalizeOrder(gallery.images as unknown as GalleryImage[]);
    const nextOrder = currentImages.length;

    gallery.images = [
      ...currentImages,
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        createdAt: new Date(),
        order: nextOrder,
      },
    ] as any;

    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json({ success: true, images: normalizeOrder(gallery.images as unknown as GalleryImage[]) }, { status: 201 });
  } catch (error) {
    console.error('Error in /api/gallery POST:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const publicId = body?.publicId as string | undefined;
    const direction = body?.direction as 'up' | 'down' | undefined;

    if (!publicId || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json(
        { success: false, error: 'publicId and direction (up|down) are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let gallery = await SiteGallery.findOne();
    if (!gallery) {
      gallery = new SiteGallery({ images: [], updatedAt: new Date() });
      await gallery.save();
    }

    const orderedImages = normalizeOrder(gallery.images as unknown as GalleryImage[]);
    const currentIndex = orderedImages.findIndex((img) => img.publicId === publicId);

    if (currentIndex === -1) {
      return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 });
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedImages.length) {
      return NextResponse.json({ success: true, images: orderedImages });
    }

    const nextImages = [...orderedImages];
    [nextImages[currentIndex], nextImages[targetIndex]] = [nextImages[targetIndex], nextImages[currentIndex]];

    gallery.images = normalizeOrder(nextImages) as any;
    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json({ success: true, images: normalizeOrder(gallery.images as unknown as GalleryImage[]) });
  } catch (error) {
    console.error('Error in /api/gallery PUT:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
