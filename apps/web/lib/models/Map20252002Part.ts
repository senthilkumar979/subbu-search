import mongoose, { Schema, Document } from 'mongoose';

export interface IMap20252002Part extends Document {
  acNo2002: number;
  partNo2002: number;
  acNo2025: number;
  partNo2025: number;
}

const Map20252002PartSchema: Schema = new Schema(
  {
    acNo2002: { type: Number, required: true, index: true },
    partNo2002: { type: Number, required: true, index: true },
    acNo2025: { type: Number, required: true, index: true },
    partNo2025: { type: Number, required: true, index: true },
  },
  {
    timestamps: false,
    collection: 'map_2025_2002_part', // Explicitly set collection name
  }
);

// Compound indexes for common queries
Map20252002PartSchema.index({ acNo2002: 1, partNo2002: 1 });
Map20252002PartSchema.index({ acNo2025: 1, partNo2025: 1 });

export default mongoose.models.Map20252002Part || mongoose.model<IMap20252002Part>('Map20252002Part', Map20252002PartSchema);
