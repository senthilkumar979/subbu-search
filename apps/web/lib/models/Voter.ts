import mongoose, { Schema, Document } from 'mongoose';

export interface IVoter extends Document {
  acNo: number;
  partNo: number;
  slNoInPart: number;
  houseNo?: string;
  sectionNo?: string;
  fmNameV2?: string; // Voter name in Tamil
  fmNameEn?: string; // Voter name transliterated to English
  rlnFmNmV2?: string; // Relation name in Tamil
  rlnFmNmEn?: string; // Relation name transliterated to English
  rlnType?: string; // H/F/M etc.
  age?: number;
  sex?: string;
  idCardNo?: string;
  psName?: string;
}

const VoterSchema: Schema = new Schema(
  {
    acNo: { type: Number, required: true, index: true },
    partNo: { type: Number, required: true, index: true },
    slNoInPart: { type: Number, required: true },
    houseNo: { type: String, index: true },
    sectionNo: { type: String },
    fmNameV2: { type: String, index: true },
    fmNameEn: { type: String, index: true },
    rlnFmNmV2: { type: String },
    rlnFmNmEn: { type: String, index: true },
    rlnType: { type: String },
    age: { type: Number, index: true },
    sex: { type: String, index: true },
    idCardNo: { type: String, index: true, sparse: true },
    psName: { type: String, index: true },
  },
  {
    timestamps: false,
  }
);

// Compound indexes for common queries
VoterSchema.index({ acNo: 1, partNo: 1 });
VoterSchema.index({ houseNo: 1, sectionNo: 1 });
VoterSchema.index({ fmNameV2: 'text', rlnFmNmV2: 'text', fmNameEn: 'text', rlnFmNmEn: 'text' });

export default mongoose.models.Voter || mongoose.model<IVoter>('Voter', VoterSchema);

