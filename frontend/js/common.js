window.API_ORIGIN = "https://vedant-arts-skills.onrender.com";
window.API_BASE_URL = `${window.API_ORIGIN}/api`;

window.getToken = function () {
  return localStorage.getItem("token") || "";
};

window.getUser = function () {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

window.setUser = function (user) {
  localStorage.setItem("user", JSON.stringify(user));
};

window.clearSession = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

window.logout = function () {
  window.clearSession();
  window.location.href = "../index.html";
};

window.checkAuth = function () {
  const token = window.getToken();
  if (!token) {
    window.location.href = "../index.html";
    return false;
  }
  window.renderHeader();
  return true;
};

window.applySavedTheme = function () {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
};

window.toggleTheme = function () {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = isLight ? "🌙" : "☀️";
};

window.renderHeader = function () {
  const header = document.querySelector("header");
  if (!header) return;

  const user = window.getUser();
  const current = location.pathname.split("/").pop();
  const isAdmin = user?.role === "admin";
  const isLight = document.body.classList.contains("light-theme");

  const links = [
    ["home.html", "Home"],
    ["gallery.html", "Gallery"],
    ["about.html", "About"],
    ["contact.html", "Cont./Order"],
    ["profile.html", "Profile"]
  ];

  if (isAdmin) links.push(["admin.html", "Admin"]);

  header.className = "site-header";
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="home.html">
        <img src="../assets/logo.png" alt="VedantArtsSkills logo" onerror="this.style.display='none'">
        <span>VedantArtsSkills</span>
      </a>
      <button class="menu-toggle" type="button" onclick="document.querySelector('.nav-links').classList.toggle('open')">☰</button>
      <nav class="nav-links">
        ${links.map(([href, label]) => `<a href="${href}" class="${current === href ? "active" : ""}">${label}</a>`).join("")}
        <button id="themeToggle" type="button" onclick="toggleTheme()">${isLight ? "🌙" : "☀️"}</button>
        <button type="button" onclick="logout()">Logout</button>
      </nav>
    </div>
  `;
};

window.apiRequest = async function (endpoint, options = {}) {
  const url = `${window.API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (!isFormData && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = window.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers,
    body: isFormData || typeof options.body === "string" ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try { data = await response.json(); } catch { data = null; }

  if (response.status === 401) {
    window.clearSession();
    window.location.href = "../index.html";
    throw new Error(data?.message || "Please login again.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

window.formatDate = function (dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

window.formatPrice = function (value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

window.formatStatus = function (status = "") {
  const map = {
    pending: "Pending",
    accepted: "Accepted",
    payment_uploaded: "Payment Uploaded",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled"
  };
  return map[status] || status || "N/A";
};

window.formatMedium = function (medium = "") {
  if (medium === "graphite") return "Graphite";
  if (medium === "colour") return "Colour";
  return medium || "N/A";
};

window.getInitials = function (name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "U";
};

window.setButtonLoading = function (button, isLoading, text = "Processing...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.oldText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.oldText || button.textContent;
    button.disabled = false;
  }
};

window.getBudget = function (size, medium) {
  const prices = {
    graphite: { A5: 300, A4: 500, A3: 900, A2: 1500, A1: 2500 },
    colour: { A5: 600, A4: 900, A3: 1500, A2: 2500, A1: 4000 }
  };
  return prices[medium]?.[size] || 0;
};

window.fixImageUrl = function (url) {
  if (!url) return "../assets/logo.png";

  let value = String(url).trim();
  if (!value) return "../assets/logo.png";

  // Keep local/static assets unchanged.
  if (
    value.startsWith("../assets/") ||
    value.startsWith("./assets/") ||
    value.startsWith("assets/") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  // Cloudinary already returns production HTTPS URLs. Do not modify them.
  if (value.includes("res.cloudinary.com")) {
    return value.replace(/^http:\/\//i, "https://");
  }

  // Fix old URLs already saved in MongoDB from local/backend uploads.
  value = value
    .replace(/^http:\/\/localhost:5000/i, window.API_ORIGIN)
    .replace(/^http:\/\/127\.0\.0\.1:5000/i, window.API_ORIGIN)
    .replace(/^http:\/\/vedant-arts-skills\.onrender\.com/i, window.API_ORIGIN)
    .replace(/^https:\/\/vedant-arts-skills\.onrender\.com/i, window.API_ORIGIN);

  // Handle relative upload paths saved as /uploads/... or uploads/...
  if (value.startsWith("/uploads/")) return `${window.API_ORIGIN}${value}`;
  if (value.startsWith("uploads/")) return `${window.API_ORIGIN}/${value}`;

  return value;
};

window.imageFallback = function (img) {
  if (!img) return;
  img.onerror = null;
  img.src = "../assets/logo.png";
  img.alt = img.alt || "Image unavailable";
};

document.addEventListener("DOMContentLoaded", () => {
  window.applySavedTheme();
  window.renderHeader();
});
