let settingsCache = {};
let ordersCache = [];

window.init = async function () {
  if (!window.checkAuth()) return;
  const user = window.getUser();
  if (!user || user.role !== "admin") {
    document.getElementById("adminContent").style.display = "none";
    document.getElementById("adminAccessMessage").style.display = "block";
    return;
  }
  document.getElementById("adminContent").style.display = "block";
  document.getElementById("orderFilter").addEventListener("change", renderOrders);
  attachForms();
  await Promise.all([loadSettings(), loadOrders(), loadArtworks()]);
};

window.showSection = function (id) {
  document.querySelectorAll(".admin-section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
};

async function loadOrders() {
  const container = document.getElementById("allOrders");
  container.innerHTML = `<div class="empty-state">Loading orders...</div>`;
  try {
    const data = await window.apiRequest("/orders");
    ordersCache = data.data || [];
    renderOrders();
  } catch (error) { container.innerHTML = `<div class="empty-state">${error.message}</div>`; }
}

function renderOrders() {
  const container = document.getElementById("allOrders");
  const filter = document.getElementById("orderFilter")?.value || "all";
  const orders = filter === "all" ? ordersCache : ordersCache.filter(o => o.status === filter);
  if (!orders.length) { container.innerHTML = `<div class="empty-state">No orders found.</div>`; return; }
  container.innerHTML = orders.map(order => renderOrder(order)).join("");
}

function renderOrder(order) {
  const refs = (order.referenceImages || []).map(img => `<a href="${img}" target="_blank"><img src="${img}" onerror="imageFallback(this)"></a>`).join("");
  const payment = order.paymentScreenshot ? `<a href="${order.paymentScreenshot}" target="_blank"><img src="${order.paymentScreenshot}" onerror="imageFallback(this)"></a>` : `<span class="muted">No payment uploaded</span>`;
  const isFinal = ["completed", "rejected", "cancelled"].includes(order.status);
  return `
    <article class="admin-order-card">
      <div class="admin-order-top">
        <div><h3 style="margin:0;">${order.name || "Unknown"}</h3><p class="muted" style="margin:4px 0;">${order.email || "No email"} · ${window.formatDate(order.createdAt)}</p></div>
        <span class="status-badge status-${order.status}">${window.formatStatus(order.status)}</span>
      </div>
      <p>${order.description || "No description"}</p>
      <div class="order-card-grid">
        <div><span class="mini-label">Size</span><div class="mini-value">${order.size || "N/A"}</div></div>
        <div><span class="mini-label">Medium</span><div class="mini-value">${window.formatMedium(order.medium)}</div></div>
        <div><span class="mini-label">Total Price</span><div class="mini-value">${window.formatPrice(order.budget)}</div></div>
        <div><span class="mini-label">Advance</span><div class="mini-value">${window.formatPrice(order.advanceAmount || Math.ceil((order.budget || 0) / 2))}</div></div>
      </div>
      <h4>Reference Images</h4><div class="thumb-row">${refs || `<span class="muted">No reference images</span>`}</div>
      <h4>Payment Screenshot</h4><div class="thumb-row">${payment}</div>
      ${order.rejectionReason ? `<p><strong>Rejection reason:</strong> ${order.rejectionReason}</p>` : ""}
      ${!isFinal ? `
        <div class="admin-actions">
          <select id="status-${order._id}" onchange="toggleRejectReason('${order._id}')">
            ${statusOptions(order.status)}
          </select>
          <textarea id="reason-${order._id}" class="rejection-input" placeholder="Rejection reason required when rejecting"></textarea>
          <textarea id="note-${order._id}" placeholder="Admin note (optional)">${order.adminNote || ""}</textarea>
          <button onclick="updateStatus('${order._id}', this)">Update Status</button>
        </div>` : ""}
    </article>`;
}

function statusOptions(current) {
  const allowed = {
    pending: ["accepted", "rejected"],
    accepted: ["rejected"],
    payment_uploaded: ["in_progress", "rejected"],
    in_progress: ["completed"]
  }[current] || [];
  return [`<option value="">Choose next status</option>`, ...allowed.map(s => `<option value="${s}">${window.formatStatus(s)}</option>`)].join("");
}

window.toggleRejectReason = function (id) {
  const status = document.getElementById(`status-${id}`).value;
  const reason = document.getElementById(`reason-${id}`);
  if (reason) reason.style.display = status === "rejected" ? "block" : "none";
};

window.updateStatus = async function (id, btn) {
  const status = document.getElementById(`status-${id}`).value;
  const rejectionReason = document.getElementById(`reason-${id}`).value.trim();
  const adminNote = document.getElementById(`note-${id}`).value.trim();
  if (!status) return alert("Please choose a status.");
  if (status === "rejected" && !rejectionReason) return alert("Rejection reason is required.");
  try {
    window.setButtonLoading(btn, true, "Updating...");
    await window.apiRequest(`/orders/${id}`, { method: "PATCH", body: { status, rejectionReason, adminNote } });
    await loadOrders();
  } catch (error) { alert(error.message || "Error updating status"); window.setButtonLoading(btn, false); }
};

async function loadSettings() {
  try {
    const data = await window.apiRequest("/admin/settings");
    settingsCache = data.data || {};
    ["artistName","aboutText","profileImage","aboutPreviewImage","whatsapp","contactEmail","instagram","phone"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = settingsCache[id] || "";
    });
    document.getElementById("funFacts").value = Array.isArray(settingsCache.funFacts) ? settingsCache.funFacts.join("\n") : "";
  } catch (error) { alert(error.message || "Error loading settings"); }
}

function attachForms() {
  attachSettingsForm("aboutForm", () => ({ artistName: val("artistName"), aboutText: val("aboutText"), profileImage: val("profileImage"), aboutPreviewImage: val("aboutPreviewImage") }));
  attachSettingsForm("funFactsForm", () => ({ funFacts: val("funFacts").split("\n").map(x => x.trim()).filter(Boolean) }));
  attachSettingsForm("contactForm", () => ({ whatsapp: val("whatsapp"), contactEmail: val("contactEmail"), instagram: val("instagram"), phone: val("phone") }));
  attachArtworkForm();
}
function val(id){return document.getElementById(id)?.value.trim() || "";}
function attachSettingsForm(formId, payloadBuilder) {
  const form = document.getElementById(formId); if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault(); const btn = form.querySelector("button");
    try { window.setButtonLoading(btn, true, "Saving..."); await window.apiRequest("/admin/settings", { method: "PUT", body: { ...settingsCache, ...payloadBuilder() } }); await loadSettings(); alert("Saved successfully."); }
    catch(error){ alert(error.message || "Save failed"); }
    finally{ window.setButtonLoading(btn, false); }
  });
}

async function loadArtworks() {
  const container = document.getElementById("artworksList");
  try {
    const data = await window.apiRequest("/artworks");
    const arts = data.data || [];
    container.innerHTML = arts.length ? arts.map(a => `<article class="art-card"><div class="art-thumb"><img src="${a.imageUrl}" onerror="imageFallback(this)"></div><div class="art-body"><h3>${a.title || "Untitled"}</h3><p class="muted">${a.category || "Artwork"}</p><p>${window.formatPrice(a.price)}</p><button class="danger-btn" onclick="deleteArt('${a._id}', this)">Delete</button></div></article>`).join("") : `<div class="empty-state">No artworks uploaded yet.</div>`;
  } catch(error){ container.innerHTML = `<div class="empty-state">Unable to load artworks.</div>`; }
}
function attachArtworkForm() {
  const form = document.getElementById("artworkForm"); if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault(); const btn = form.querySelector("button"); const file = document.getElementById("artImage").files[0]; if (!file) return alert("Please choose an artwork image.");
    const fd = new FormData(); fd.append("title", val("artTitle")); fd.append("category", val("artCategory")); fd.append("price", val("artPrice")); fd.append("caption", val("artCaption")); fd.append("image", file);
    try { window.setButtonLoading(btn, true, "Adding..."); await window.apiRequest("/artworks", { method: "POST", body: fd }); form.reset(); await loadArtworks(); alert("Artwork added."); }
    catch(error){ alert(error.message || "Error adding artwork"); }
    finally{ window.setButtonLoading(btn, false); }
  });
}
window.deleteArt = async function(id, btn) {
  if (!confirm("Delete this artwork?")) return;
  try { window.setButtonLoading(btn, true, "Deleting..."); await window.apiRequest(`/artworks/${id}`, { method: "DELETE" }); await loadArtworks(); }
  catch(error){ alert(error.message || "Error deleting artwork"); window.setButtonLoading(btn, false); }
};
