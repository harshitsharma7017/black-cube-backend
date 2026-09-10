import mongoose, { Document, Schema, Model } from 'mongoose';

export const RECORD_TYPES = ['Student', 'Teacher', 'Mentor', 'Job Seeker', 'Institute', 'Other'] as const;
export type RecordType = typeof RECORD_TYPES[number];

export const LINK_STATUSES = ['Pending', 'Sent', 'Failed'] as const;
export type LinkStatus = typeof LINK_STATUSES[number];

export const DOWNLOAD_STATUSES = ['Pending', 'Downloaded', 'Not Downloaded'] as const;
export type DownloadStatus = typeof DOWNLOAD_STATUSES[number];

export interface IRecord extends Document {
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  organisation?: string;
  type: RecordType;
  linkStatus: LinkStatus;
  downloadStatus: DownloadStatus;
  dateAdded: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recordSchema = new Schema<IRecord>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    organisation: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    type: {
      type: String,
      enum: RECORD_TYPES,
      default: 'Other',
    },
    linkStatus: {
      type: String,
      enum: LINK_STATUSES,
      default: 'Pending',
    },
    downloadStatus: {
      type: String,
      enum: DOWNLOAD_STATUSES,
      default: 'Pending',
    },
    dateAdded: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes specified in 04_MongoDB_Design.docx
recordSchema.index({ type: 1, dateAdded: -1 });
recordSchema.index({ linkStatus: 1, dateAdded: -1 });
recordSchema.index({ downloadStatus: 1, dateAdded: -1 });
recordSchema.index({ dateAdded: -1 });

export const RecordModel: Model<IRecord> = mongoose.model<IRecord>('Record', recordSchema);
