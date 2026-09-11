import { Schema, model, Document } from "mongoose";

export const USER_ROLES = ["ADMIN", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, default: "VIEWER" },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);
