import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { SiteGallery } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: upload buffer to Cloudinary using upload_stream
function uploadBufferToCloudinary(
  buffer: Buffer,
  galleryType: 'menu' | 'slideshow' = 'menu'
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const folder = galleryType === 'slideshow' ? 'site-gallery/slideshow' : 'site-gallery/menu';
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder,
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
  type?: 'menu' | 'slideshow';
};

function sanitizeImages(input: unknown, galleryType: 'menu' | 'slideshow' = 'menu'): GalleryImage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      const raw = (item ?? {}) as Partial<GalleryImage>;

      return {
        url: typeof raw.url === 'string' ? raw.url : '',
        publicId: typeof raw.publicId === 'string' ? raw.publicId : '',
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        order: typeof raw.order === 'number' ? raw.order : index,
        type: (raw.type === 'menu' || raw.type === 'slideshow' ? raw.type : galleryType) as 'menu' | 'slideshow',
      };
    })
    .filter((img) => img.type === galleryType);
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

function normalizeOrder(images: GalleryImage[], galleryType: 'menu' | 'slideshow' = 'menu'): GalleryImage[] {
  return sortImages(sanitizeImages(images, galleryType)).map((image, index) => ({
    ...image,
    order: index,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') === 'slideshow' ? 'slideshow' : 'menu') as 'menu' | 'slideshow';

    await connectToDatabase();

    const gallery = await SiteGallery.findOne().lean<{ images?: GalleryImage[] }>();
    const allImages = gallery?.images ?? [];
    const typeFilteredImages = allImages.filter((img) => (img.type ?? 'menu') === type);
    const orderedImages = normalizeOrder(typeFilteredImages, type);

    console.log('Fetched images:', orderedImages);

    return NextResponse.json(
      { success: true, images: orderedImages },
      {
        status: 200,
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
    const type = (body?.type === 'slideshow' ? 'slideshow' : 'menu') as 'menu' | 'slideshow';

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'publicId is required' }, { status: 400 });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    await connectToDatabase();
    const gallery = (await SiteGallery.findOne()) || new SiteGallery({ images: [], updatedAt: new Date() });

    const allImages = (gallery.images as unknown as GalleryImage[]) || [];
    const remainingImages = allImages.filter((img) => img.publicId !== publicId);
    const updatedImages = normalizeOrder(remainingImages, type).map((img) => ({
      ...img,
      type: img.type ?? 'menu',
    }));
    gallery.images = updatedImages as any;
    gallery.updatedAt = new Date();
    await gallery.save();

    const typeFilteredImages = updatedImages.filter((img) => img.type === type);
    return NextResponse.json({ success: true, images: typeFilteredImages });
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
    const typeParam = formData.get('type') as string | null;
    const type = (typeParam === 'slideshow' ? 'slideshow' : 'menu') as 'menu' | 'slideshow';

    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 });
    }

    const bytes = await (file as any).arrayBuffer();
    const buffer = Buffer.from(bytes);

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadResult = await uploadBufferToCloudinary(buffer, type);

    await connectToDatabase();

    const newImage: GalleryImage = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      createdAt: new Date(),
      type,
    };

    await SiteGallery.updateOne(
      {},
      {
        $push: {
          images: newImage,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const gallery = await SiteGallery.findOne().lean<{ images?: GalleryImage[] }>();
    const typeFilteredImages = normalizeOrder(
      (gallery?.images ?? []).filter((img) => (img.type ?? 'menu') === type),
      type
    );

    console.log('Saved image:', newImage);

    return NextResponse.json(
      { success: true, images: typeFilteredImages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/gallery POST:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
