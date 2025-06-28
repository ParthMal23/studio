
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Important: prevent password from being returned in queries by default
  },
}, { timestamps: true }); // Mongoose's timestamps option handles createdAt and updatedAt automatically

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
