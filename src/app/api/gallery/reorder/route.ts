import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SiteGallery } from '@/lib/models';

export const runtime = 'nodejs';

type ReorderImageInput = {
  publicId: string;
  url: string;
  createdAt: string;
  order?: number;
  type?: 'menu' | 'slideshow';
};

function normalizeSubmittedImages(images: ReorderImageInput[], galleryType: 'menu' | 'slideshow' = 'menu') {
  return images.map((image, index) => ({
    publicId: typeof image.publicId === 'string' ? image.publicId : '',
    url: typeof image.url === 'string' ? image.url : '',
    createdAt: image.createdAt ? new Date(image.createdAt) : new Date(),
    order: index,
    type: (image.type === 'slideshow' ? 'slideshow' : galleryType) as 'menu' | 'slideshow',
  }));
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const images = body?.images as ReorderImageInput[] | undefined;
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') === 'slideshow' ? 'slideshow' : 'menu') as 'menu' | 'slideshow';

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

    const allImages = (gallery.images as any[]) || [];
    const otherTypeImages = allImages.filter((img) => (img.type ?? 'menu') !== type);
    const reorderedTypeImages = normalizeSubmittedImages(images, type);
    
    gallery.images = [...otherTypeImages, ...reorderedTypeImages] as any;
    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json({ success: true, images: reorderedTypeImages });
  } catch (error) {
    console.error('Error in /api/gallery/reorder PUT:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
