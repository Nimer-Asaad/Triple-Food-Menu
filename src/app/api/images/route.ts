import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateGallery, removeImageFromGallery } from '@/lib/gallery';

export async function GET() {
  try {
    const gallery = await getOrCreateGallery();
    return NextResponse.json(gallery.images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, publicId, title } = await request.json();

    if (!url || !publicId) {
      return NextResponse.json(
        { error: 'URL and publicId are required' },
        { status: 400 }
      );
    }

    const gallery = await getOrCreateGallery();

    // Add image to gallery
    gallery.images.push({
      url,
      publicId,
      createdAt: new Date(),
    });

    gallery.updatedAt = new Date();
    await gallery.save();

    return NextResponse.json(
      gallery.images[gallery.images.length - 1],
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to save image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    await removeImageFromGallery(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
