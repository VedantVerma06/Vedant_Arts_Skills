import { getCurrentUserSafe, logout } from "../common.js";

export function renderNavbar(activePage = "") {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const user = getCurrentUserSafe();

  header.className = "site-header";
  header.innerHTML = `
    <nav class="navbar">
      <a class="brand" href="./home.html">
        <img src="../assets/logo.png" alt="VedantArtsSkills logo" />
        <div class="brand-meta">
          <strong>VedantArtsSkills</strong>
          <span>${user.username || "Creative Member"} • ${user.role || "user"}</span>
        </div>
      </a>

      <button class="mobile-toggle" id="mobileNavToggle" aria-label="Toggle navigation">☰</button>

      <div class="nav-links" id="navLinks">
        <a href="./home.html" class="${activePage === "home" ? "active" : ""}">Home</a>
        <a href="./about.html" class="${activePage === "about" ? "active" : ""}">About</a>
        <a href="./gallery.html" class="${activePage === "gallery" ? "active" : ""}">Gallery</a>
        <a href="./contact.html" class="${activePage === "contact" ? "active" : ""}">Contact</a>
        <a href="./order.html" class="${activePage === "order" ? "active" : ""}">Order</a>
        <button id="logoutBtn" type="button">Logout</button>
      </div>
    </nav>
  `;

  const toggle = document.getElementById("mobileNavToggle");
  const navLinks = document.getElementById("navLinks");
  const logoutBtn = document.getElementById("logoutBtn");

  toggle?.addEventListener("click", () => navLinks.classList.toggle("open"));
  logoutBtn?.addEventListener("click", logout);
}
