import { ObjectId } from 'mongodb';

export interface Image {
  _id?: ObjectId | string;
  url: string;
  publicId: string;
  uploadedAt: Date;
  title?: string;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  [key: string]: unknown;
}
