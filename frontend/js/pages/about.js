window.init = async function () {
  if (!window.checkAuth()) return;
  await loadAboutData();
};
async function loadAboutData() {
  const aboutText = document.getElementById("aboutText");
  try {
    const data = await window.apiRequest("/admin/settings");
    const s = data?.data || {};
    aboutText.textContent = s.aboutText || "No artist description has been added yet.";
    document.getElementById("artistName").textContent = s.artistName || "Vedant Arts Skills";
    document.getElementById("artistImage").src = window.fixImageUrl(s.profileImage || "../assets/about.JPG");
  } catch (error) {
    aboutText.textContent = "Unable to load artist details right now.";
  }
}
