import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage || "",
});

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedUsername = String(username || "").trim();

    if (!trimmedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    const role = normalizedEmail && normalizedEmail === adminEmail ? "admin" : "user";

    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin account already exists",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("registerUser error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};
