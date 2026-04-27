import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    graphite: {
      A5: { type: Number, default: 300 },
      A4: { type: Number, default: 500 },
      A3: { type: Number, default: 900 },
      A2: { type: Number, default: 1500 },
      A1: { type: Number, default: 2500 },
    },
    colour: {
      A5: { type: Number, default: 600 },
      A4: { type: Number, default: 900 },
      A3: { type: Number, default: 1500 },
      A2: { type: Number, default: 2500 },
      A1: { type: Number, default: 4000 },
    },
  },
  { _id: false }
);

const adminSettingsSchema = new mongoose.Schema(
  {
    artistName: { type: String, default: "", trim: true },
    aboutText: { type: String, default: "", trim: true },
    profileImage: { type: String, default: "", trim: true },
    aboutPreviewImage: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    instagram: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    funFacts: { type: [String], default: [] },

    // Kept for compatibility. Frontend may now use static prices, but this won't break old code.
    pricing: {
      type: pricingSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);

export default AdminSettings;
