window.init = async function () {
  if (!window.checkAuth()) return;
  await loadContactData();
};
window.goToOrder = function () { window.location.href = "order.html"; };
async function loadContactData() {
  try {
    const data = await window.apiRequest("/admin/settings");
    const s = data?.data || {};
    document.getElementById("whatsapp").innerHTML = s.whatsapp ? `<a href="https://wa.me/${String(s.whatsapp).replace(/\D/g, "")}" target="_blank">${s.whatsapp}</a>` : "Not added";
    document.getElementById("email").innerHTML = s.contactEmail ? `<a href="mailto:${s.contactEmail}">${s.contactEmail}</a>` : "Not added";
    document.getElementById("insta").innerHTML = s.instagram ? `<a href="${s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@','')}`}" target="_blank">${s.instagram}</a>` : "Not added";
    document.getElementById("phone").textContent = s.phone || "Not added";
  } catch {
    ["whatsapp","email","insta","phone"].forEach(id => document.getElementById(id).textContent = "Unable to load");
  }
}
