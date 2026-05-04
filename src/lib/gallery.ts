import { connectToDatabase } from './mongodb';
import { SiteGallery, IGallery } from './models';

/**
 * Get or create the single gallery document
 * @returns The gallery document
 */
export async function getOrCreateGallery(): Promise<IGallery> {
  await connectToDatabase();

  let gallery = await SiteGallery.findOne({});

  if (!gallery) {
    gallery = await SiteGallery.create({
      images: [],
      updatedAt: new Date(),
    });
  }

  return gallery;
}

/**
 * Add an image to the gallery
 * @param url - The image URL from Cloudinary
 * @param publicId - The Cloudinary public ID
 * @returns The updated gallery document
 */
export async function addImageToGallery(
  url: string,
  publicId: string
): Promise<IGallery> {
  const gallery = await getOrCreateGallery();

  gallery.images.push({
    url,
    publicId,
    createdAt: new Date(),
  });

  gallery.updatedAt = new Date();
  await gallery.save();

  return gallery;
}

/**
 * Remove an image from the gallery by public ID
 * @param publicId - The Cloudinary public ID
 * @returns The updated gallery document
 */
export async function removeImageFromGallery(publicId: string): Promise<IGallery> {
  const gallery = await getOrCreateGallery();

  gallery.images = gallery.images.filter((img) => img.publicId !== publicId);
  gallery.updatedAt = new Date();
  await gallery.save();

  return gallery;
}

/**
 * Get all images in the gallery
 * @returns Array of images
 */
export async function getGalleryImages() {
  const gallery = await getOrCreateGallery();
  return gallery.images;
}

/**
 * Clear all images from the gallery
 * @returns The updated gallery document
 */
export async function clearGallery(): Promise<IGallery> {
  const gallery = await getOrCreateGallery();

  gallery.images = [];
  gallery.updatedAt = new Date();
  await gallery.save();

  return gallery;
}
