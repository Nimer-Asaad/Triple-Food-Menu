import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SiteGallery } from '@/lib/models';

export const runtime = 'nodejs';

type ReorderImageInput = {
  publicId: string;
  url: string;
  createdAt: string;
  order?: number;
};

function normalizeSubmittedImages(images: ReorderImageInput[]) {
  return images.map((image, index) => ({
    publicId: typeof image.publicId === 'string' ? image.publicId : '',
    url: typeof image.url === 'string' ? image.url : '',
    createdAt: image.createdAt ? new Date(image.createdAt) : new Date(),
    order: index,
  }));
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const images = body?.images as ReorderImageInput[] | undefined;

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: 'images array is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let gallery = await SiteGallery.findOne();
    if (!gallery) {
      gallery = new SiteGallery({ images: [], updatedAt: new Date() });
    }

    gallery.images = normalizeSubmittedImages(images) as any;
    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json({ success: true, images: gallery.images });
  } catch (error) {
    console.error('Error in /api/gallery/reorder PUT:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
