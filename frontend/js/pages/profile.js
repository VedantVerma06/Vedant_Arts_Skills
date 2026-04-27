let ordersCache = [];

window.init = async function () {
  if (!window.checkAuth()) return;
  renderUser();
  await loadMyOrders();
};

function renderUser() {
  const user = window.getUser() || {};
  const display = user.username || user.name || "User";
  document.getElementById("avatar").textContent = window.getInitials(display);
  document.getElementById("userName").textContent = display;
  document.getElementById("userEmail").textContent = user.email || "";
  document.getElementById("userUsername").textContent = `@${user.username || "user"}`;
  document.getElementById("userRole").textContent = user.role === "admin" ? "Admin" : "User";
}

async function loadMyOrders() {
  const active = document.getElementById("activeOrders");
  const past = document.getElementById("pastOrders");
  active.innerHTML = `<div class="empty-state">Loading orders...</div>`;
  past.innerHTML = "";
  try {
    const data = await window.apiRequest("/orders/my");
    ordersCache = data.data || [];
    const activeOrders = ordersCache.filter(o => ["pending", "accepted", "payment_uploaded", "in_progress"].includes(o.status));
    const pastOrders = ordersCache.filter(o => ["completed", "rejected", "cancelled"].includes(o.status));
    active.innerHTML = activeOrders.length ? activeOrders.map(renderOrderCard).join("") : `<div class="empty-state">No active orders yet.</div>`;
    past.innerHTML = pastOrders.length ? pastOrders.map(renderOrderCard).join("") : `<div class="empty-state">No past orders yet.</div>`;
  } catch (error) {
    active.innerHTML = `<div class="empty-state">${error.message || "Unable to load orders."}</div>`;
  }
}

function renderOrderCard(order) {
  const statusClass = `status-${order.status}`;
  const refs = (order.referenceImages || []).map(img => `<a href="${img}" target="_blank"><img src="${img}" loading="lazy" onerror="imageFallback(this)"></a>`).join("");
  const payment = order.paymentScreenshot
    ? `<a href="${order.paymentScreenshot}" target="_blank"><img src="${order.paymentScreenshot}" loading="lazy" onerror="imageFallback(this)"></a>`
    : "";
  return `
    <article class="order-card" style="padding:22px;">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:start;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 6px;">${window.formatMedium(order.medium)} · ${order.size}</h3>
          <p class="muted" style="margin:0;">Placed on ${window.formatDate(order.createdAt)}</p>
        </div>
        <span class="status-badge ${statusClass}">${window.formatStatus(order.status)}</span>
      </div>
      <p>${order.description || "No description"}</p>
      <div class="two-col grid">
        <p><strong>Total:</strong> ${window.formatPrice(order.budget)}</p>
        <p><strong>Advance:</strong> ${window.formatPrice(order.advanceAmount || Math.ceil((order.budget || 0) / 2))}</p>
      </div>
      <h4>Reference Images</h4>
      <div class="thumb-row">${refs || `<span class="muted">No reference images</span>`}</div>
      ${order.paymentScreenshot ? `<h4>Payment Screenshot</h4><div class="thumb-row">${payment}</div>` : ""}
      ${order.rejectionReason ? `<p><strong>Rejection reason:</strong> ${order.rejectionReason}</p>` : ""}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">${renderActions(order)}</div>
    </article>
  `;
}

function renderActions(order) {
  if (order.status === "pending") {
    return `<button class="danger-btn" onclick="cancelOrder('${order._id}', this)">Cancel Order</button>`;
  }

  if (order.status === "accepted") {
    return `
      <div class="glass-card" style="padding:16px;width:100%;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
          <div>
            <h4 style="margin:0 0 8px;">Pay 50% Advance</h4>
            <p class="muted" style="margin-top:0;">Scan the QR, pay ${window.formatPrice(order.advanceAmount || Math.ceil((order.budget || 0) / 2))}, then upload screenshot.</p>
          </div>
          <button class="danger-btn" onclick="cancelOrder('${order._id}', this)">Cancel Order</button>
        </div>
        <img src="../assets/gpay-qr.jpeg" alt="Google Pay QR" style="width:180px;border-radius:16px;border:1px solid var(--border);padding:8px;display:block;margin-bottom:12px;" onerror="imageFallback(this)">
        <input type="file" id="payment-${order._id}" accept="image/*">
        <button onclick="uploadPayment('${order._id}', this)" style="margin-top:10px;">Upload Payment Screenshot</button>
      </div>
    `;
  }

  if (order.status === "payment_uploaded") return `<p class="muted">Payment uploaded. Waiting for admin verification.</p>`;
  if (order.status === "in_progress") return `<p class="muted">Your artwork is in progress.</p>`;
  return "";
}

window.cancelOrder = async function (id, btn) {
  if (!confirm("Cancel this order?")) return;
  try {
    window.setButtonLoading(btn, true, "Cancelling...");
    await window.apiRequest(`/orders/${id}/cancel`, { method: "PATCH" });
    await loadMyOrders();
  } catch (error) {
    alert(error.message || "Unable to cancel order.");
    window.setButtonLoading(btn, false);
  }
};

window.uploadPayment = async function (id, btn) {
  const input = document.getElementById(`payment-${id}`);
  const file = input?.files?.[0];
  if (!file) return alert("Please select a payment screenshot.");
  const fd = new FormData();
  fd.append("paymentScreenshot", file);
  try {
    window.setButtonLoading(btn, true, "Uploading...");
    await window.apiRequest(`/orders/upload-payment/${id}`, { method: "PATCH", body: fd });
    await loadMyOrders();
  } catch (error) {
    alert(error.message || "Unable to upload payment.");
    window.setButtonLoading(btn, false);
  }
};
