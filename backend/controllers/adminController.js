import AdminSettings from "../models/AdminSettings.js";

const DEFAULT_PRICING = {
  graphite: { A5: 300, A4: 500, A3: 900, A2: 1500, A1: 2500 },
  colour: { A5: 600, A4: 900, A3: 1500, A2: 2500, A1: 4000 },
};

const normalizePricingObject = (pricing) => {
  if (!pricing || Array.isArray(pricing) || typeof pricing !== "object") {
    return DEFAULT_PRICING;
  }

  return {
    graphite: {
      A5: Number(pricing.graphite?.A5 ?? DEFAULT_PRICING.graphite.A5),
      A4: Number(pricing.graphite?.A4 ?? DEFAULT_PRICING.graphite.A4),
      A3: Number(pricing.graphite?.A3 ?? DEFAULT_PRICING.graphite.A3),
      A2: Number(pricing.graphite?.A2 ?? DEFAULT_PRICING.graphite.A2),
      A1: Number(pricing.graphite?.A1 ?? DEFAULT_PRICING.graphite.A1),
    },
    colour: {
      A5: Number(pricing.colour?.A5 ?? DEFAULT_PRICING.colour.A5),
      A4: Number(pricing.colour?.A4 ?? DEFAULT_PRICING.colour.A4),
      A3: Number(pricing.colour?.A3 ?? DEFAULT_PRICING.colour.A3),
      A2: Number(pricing.colour?.A2 ?? DEFAULT_PRICING.colour.A2),
      A1: Number(pricing.colour?.A1 ?? DEFAULT_PRICING.colour.A1),
    },
  };
};

const normalizeSettingsPayload = (body = {}) => {
  const payload = {
    artistName: typeof body.artistName === "string" ? body.artistName.trim() : "",
    aboutText: typeof body.aboutText === "string" ? body.aboutText.trim() : "",
    profileImage: typeof body.profileImage === "string" ? body.profileImage.trim() : "",
    aboutPreviewImage: typeof body.aboutPreviewImage === "string" ? body.aboutPreviewImage.trim() : "",
    whatsapp: typeof body.whatsapp === "string" ? body.whatsapp.trim() : "",
    contactEmail:
      typeof (body.contactEmail ?? body.email) === "string"
        ? String(body.contactEmail ?? body.email).trim().toLowerCase()
        : "",
    instagram: typeof body.instagram === "string" ? body.instagram.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    funFacts: Array.isArray(body.funFacts)
      ? body.funFacts.map((fact) => String(fact || "").trim()).filter(Boolean)
      : [],
  };

  if (body.pricing !== undefined) {
    payload.pricing = normalizePricingObject(body.pricing);
  }

  return payload;
};

export const getSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create({ pricing: DEFAULT_PRICING });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("getSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load settings",
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const payload = normalizeSettingsPayload(req.body);
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = new AdminSettings(payload);
    } else {
      Object.assign(settings, payload);
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("updateSettings error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not update settings",
    });
  }
};
