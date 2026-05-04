import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

interface CachedConnection {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

let cached: CachedConnection = {
  conn: null,
  promise: null,
};

export async function connectToDatabase(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        dbName: 'image_gallery',
      })
      .then((mongoose) => {
        return mongoose.connection;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;

    // Enhance common DNS SRV lookup errors with actionable guidance.
    const msg = (error as Error)?.message ?? String(error);
    if (msg.includes('querySrv') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      const hint =
        'Failed to resolve MongoDB SRV record. If your MONGODB_URI uses the `+srv` form (mongodb+srv://), ensure your environment allows DNS SRV lookups.\n' +
        'As a workaround, use a standard connection string (mongodb://host:port) from your Atlas cluster connection details or verify network/DNS settings.';
      const enhanced = new Error(`${msg} — ${hint}`);
      console.error('connectToDatabase error (enhanced):', enhanced);
      throw enhanced;
    }

    throw error;
  }

  return cached.conn;
}
