import jwt from "jsonwebtoken";

const generateToken = (user) => {
  if (!user || !user._id) {
    throw new Error("User object with _id is required to generate token");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role || "user",
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
