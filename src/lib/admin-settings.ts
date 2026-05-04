import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSettings extends Document {
  passwordHash: string;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
  {
    passwordHash: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const AdminSettings =
  mongoose.models.AdminSettings ||
  mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);

async function seedAdminSettingsIfNeeded(): Promise<IAdminSettings> {
  let settings = await AdminSettings.findOne();

  if (!settings) {
    const initialPassword = process.env.ADMIN_PASSWORD;

    if (!initialPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not defined');
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    settings = await AdminSettings.create({
      passwordHash,
      updatedAt: new Date(),
    });
  }

  return settings;
}

export async function getAdminSettings(): Promise<IAdminSettings> {
  await connectToDatabase();
  return seedAdminSettingsIfNeeded();
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const settings = await getAdminSettings();
  return bcrypt.compare(password, settings.passwordHash);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const settings = await getAdminSettings();

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, settings.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  settings.passwordHash = await bcrypt.hash(newPassword, 10);
  settings.updatedAt = new Date();
  await settings.save();
}
