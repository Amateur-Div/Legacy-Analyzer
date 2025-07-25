import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  uid: string;
  email: string;
  name?: string;
  bio: string;
  photoURL?: string;
  role?: string;
  createdAt: Date;
}

const UserSchema = new Schema<User>({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  photoURL: {
    type: String,
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model<User>("User", UserSchema);
