import mongoose, { Schema, Document } from 'mongoose';

interface IImage {
  url: string;
  publicId: string;
  createdAt: Date;
  order?: number;
}

export interface IGallery extends Document {
  images: IImage[];
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

const GallerySchema = new Schema<IGallery>(
  {
    images: {
      type: [ImageSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const SiteGallery =
  mongoose.models.SiteGallery ||
  mongoose.model<IGallery>('SiteGallery', GallerySchema);
