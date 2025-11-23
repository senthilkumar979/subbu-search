import mongoose, { Schema, Document } from 'mongoose';

export interface ILegacyPart2025 extends Document {
  acNo: number;
  partNo: number;
  localityTn?: string;
  partNameTn?: string;
  localityV1?: string;
  partNameV1?: string;
}

const LegacyPart2025Schema: Schema = new Schema(
  {
    acNo: { type: Number, required: true, index: true },
    partNo: { type: Number, required: true, index: true },
    localityTn: { type: String },
    partNameTn: { type: String },
    localityV1: { type: String },
    partNameV1: { type: String },
  },
  {
    timestamps: false,
    collection: 'legacypart_2025', // Explicitly set collection name
  }
);

// Compound index for common queries
LegacyPart2025Schema.index({ acNo: 1, partNo: 1 });

export default mongoose.models.LegacyPart2025 || mongoose.model<ILegacyPart2025>('LegacyPart2025', LegacyPart2025Schema);
