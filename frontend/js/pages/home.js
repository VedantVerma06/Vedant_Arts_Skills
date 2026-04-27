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

  const images = [
    "../assets/slider/art1.jpg",
    "../assets/slider/art2.jpg",
    "../assets/slider/art3.jpg",
    "../assets/slider/art4.jpg",
    "../assets/slider/art5.jpg",
    "../assets/slider/art6.jpg",
    "../assets/slider/art8.jpg",
    "../assets/slider/art9.jpg",
    "../assets/slider/art12.jpg",
    "../assets/slider/art15.jpg",
    "../assets/slider/art18.jpg",
    "../assets/slider/art19.jpg"
  ];

  track.innerHTML = [...images, ...images]
    .map((src) => `<img src="${src}" alt="Artwork slide" loading="lazy" onerror="this.remove()">`)
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
