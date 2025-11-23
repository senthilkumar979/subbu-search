import mongoose, { Schema, Document } from 'mongoose';

export interface ILegacyPart extends Document {
  stateCode: string;
  districtNo: number;
  acNo: number;
  partNo: number;
  partNameEn?: string;
  partNameV1?: string;
}

const LegacyPartSchema: Schema = new Schema(
  {
    stateCode: { type: String, required: true },
    districtNo: { type: Number, required: true, index: true },
    acNo: { type: Number, required: true, index: true },
    partNo: { type: Number, required: true, index: true },
    partNameEn: { type: String },
    partNameV1: { type: String },
  },
  {
    timestamps: false,
  }
);

// Compound index for common queries
LegacyPartSchema.index({ acNo: 1, partNo: 1 });

export default mongoose.models.LegacyPart || mongoose.model<ILegacyPart>('LegacyPart', LegacyPartSchema);
