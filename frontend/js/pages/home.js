window.init = async function () {
  if (!window.checkAuth()) return;
  buildSlider();
  await loadFacts();
};

window.goToPage = function (page) {
  window.location.href = page;
};

function buildSlider() {
  const track = document.getElementById("sliderTrack");
  if (!track) return;

  // Place your artwork slider images here:
  // frontend/assets/slider/art1.jpg ... frontend/assets/slider/art12.jpg
  // Missing files are skipped, so the logo will not appear as a fallback inside the slider.
  const images = Array.from(
    { length: 12 },
    (_, index) => `../assets/slider/art${index + 1}.jpg`
  );

  track.innerHTML = [...images, ...images]
    .map(src => `<img src="${src}" alt="Artwork slide" loading="lazy" onerror="this.remove()">`)
    .join("");
}

async function loadFacts() {
  const factsDiv = document.getElementById("facts");
  try {
    const data = await window.apiRequest("/admin/settings");
    const facts = data?.data?.funFacts || [];
    factsDiv.innerHTML = facts.length
      ? facts.map((fact, i) => `<div class="fact-card"><span>#${i + 1}</span><p>${fact}</p></div>`).join("")
      : `<div class="empty-state">No fun facts added yet.</div>`;
  } catch (error) {
    factsDiv.innerHTML = `<div class="empty-state">Unable to load fun facts.</div>`;
  }
}
