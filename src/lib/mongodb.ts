import mongoose from "mongoose";

const mongodbURI = process.env.mongodbURI!;

if (!mongodbURI) {
  throw new Error("No uri found.");
}

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: MongooseGlobal;
}

let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbURI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached?.promise;
  return cached.conn;
}
