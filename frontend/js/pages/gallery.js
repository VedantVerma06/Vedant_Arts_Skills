window.currentArtworkId = null;
window.galleryArtworks = [];

window.init = async function () {
  if (!window.checkAuth()) return;
  await loadGallery();
  const search = document.getElementById("gallerySearch");
  search?.addEventListener("input", () => renderGallery(window.galleryArtworks));
};

function likedStorageKey() {
  const user = window.getUser() || {};
  return `likedArtworks_${user._id || user.id || user.email || "guest"}`;
}

function getLikedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(likedStorageKey())) || []);
  } catch {
    return new Set();
  }
}

function saveLikedSet(set) {
  localStorage.setItem(likedStorageKey(), JSON.stringify([...set]));
}

function isArtworkLiked(artwork) {
  return Boolean(artwork?.likedByMe || artwork?.isLiked || getLikedSet().has(artwork?._id));
}

function setLocalLiked(artworkId, liked) {
  const set = getLikedSet();
  if (liked) set.add(artworkId);
  else set.delete(artworkId);
  saveLikedSet(set);
}

window.closeModal = function () {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("commentInput").value = "";
  window.currentArtworkId = null;
};

window.addComment = async function () {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!window.currentArtworkId) return alert("No artwork selected.");
  if (!text) return alert("Please write a comment.");

  try {
    await window.apiRequest(`/artworks/${window.currentArtworkId}/comment`, {
      method: "POST",
      body: { text }
    });
    input.value = "";
    await loadComments(window.currentArtworkId);
    await loadGallery({ preserveModal: true });
  } catch (error) {
    alert(error.message || "Unable to add comment.");
  }
};

window.likeArtwork = async function (artworkId) {
  const artwork = window.galleryArtworks.find(item => item._id === artworkId);
  if (!artwork) return;

  const currentlyLiked = isArtworkLiked(artwork);
  const nextLiked = !currentlyLiked;

  artwork.likedByMe = nextLiked;
  artwork.isLiked = nextLiked;
  artwork.likesCount = Math.max(0, Number(artwork.likesCount || 0) + (nextLiked ? 1 : -1));
  setLocalLiked(artworkId, nextLiked);

  renderGallery(window.galleryArtworks);
  updateModalActions();

  try {
    const data = await window.apiRequest(`/artworks/${artworkId}/like`, { method: "POST" });
    const updated = data?.data || data?.artwork;
    if (updated && updated._id) {
      Object.assign(artwork, updated);
      artwork.likedByMe = nextLiked;
      artwork.isLiked = nextLiked;
      renderGallery(window.galleryArtworks);
      updateModalActions();
    }
  } catch (error) {
    artwork.likedByMe = currentlyLiked;
    artwork.isLiked = currentlyLiked;
    artwork.likesCount = Math.max(0, Number(artwork.likesCount || 0) + (nextLiked ? -1 : 1));
    setLocalLiked(artworkId, currentlyLiked);
    renderGallery(window.galleryArtworks);
    updateModalActions();
    alert(error.message || "Unable to update like.");
  }
};

window.openComments = async function (artworkId) {
  const artwork = window.galleryArtworks.find(item => item._id === artworkId);
  if (!artwork) return;

  window.currentArtworkId = artworkId;
  document.getElementById("modalImage").innerHTML = `<img src="${window.fixImageUrl(artwork.imageUrl)}" alt="${artwork.title || "Artwork"}" onerror="imageFallback(this)">`;
  document.getElementById("modalTitle").textContent = artwork.title || "Artwork";

  const caption = document.getElementById("modalCaption");
  if (caption) {
    const captionText = artwork.caption || artwork.description || "";
    caption.textContent = captionText;
    caption.style.display = captionText ? "block" : "none";
  }

  document.getElementById("overlay").style.display = "flex";
  updateModalActions();
  await loadComments(artworkId);
};

function updateModalActions() {
  const actions = document.getElementById("modalActions");
  if (!actions || !window.currentArtworkId) return;

  const artwork = window.galleryArtworks.find(item => item._id === window.currentArtworkId);
  if (!artwork) {
    actions.innerHTML = "";
    return;
  }

  const liked = isArtworkLiked(artwork);
  actions.innerHTML = `
    <button class="icon-btn heart-icon ${liked ? "liked" : ""}" onclick="likeArtwork('${artwork._id}')" title="Like">
      ${liked ? "♥" : "♡"} <small>${artwork.likesCount || 0}</small>
    </button>
    <span class="muted">${artwork.commentsCount || 0} comments</span>
  `;
}

window.deleteComment = async function (commentId) {
  try {
    await window.apiRequest(`/artworks/comment/${commentId}`, { method: "DELETE" });
    if (window.currentArtworkId) await loadComments(window.currentArtworkId);
    await loadGallery({ preserveModal: true });
  } catch (error) {
    alert(error.message || "Unable to delete comment.");
  }
};

window.orderArtwork = function () {
  alert("Please contact the artist regarding this artwork before placing an order.");
  window.location.href = "contact.html";
};

async function loadGallery(options = {}) {
  const grid = document.getElementById("galleryGrid");
  if (!options.preserveModal) grid.innerHTML = `<div class="empty-state">Loading artworks...</div>`;

  try {
    const data = await window.apiRequest("/artworks");
    window.galleryArtworks = Array.isArray(data?.data) ? data.data : [];
    renderGallery(window.galleryArtworks);
    updateModalActions();
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Unable to load gallery.</div>`;
  }
}

function renderGallery(artworks) {
  const grid = document.getElementById("galleryGrid");
  const q = (document.getElementById("gallerySearch")?.value || "").toLowerCase();
  const filtered = artworks.filter(a => `${a.title || ""} ${a.category || ""}`.toLowerCase().includes(q));

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">No artworks found.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => {
    const liked = isArtworkLiked(a);
    return `
      <article class="art-card">
        <div class="art-thumb" onclick="openComments('${a._id}')">
          <img src="${window.fixImageUrl(a.imageUrl)}" alt="${a.title || "Artwork"}" loading="lazy" onerror="imageFallback(this)">
        </div>
        <div class="art-body">
          <div class="art-head">
            <h3>${a.title || "Untitled Artwork"}</h3>
            <span class="price-tag">${window.formatPrice(a.price || 0)}</span>
          </div>
          <div class="art-meta">${a.category || "Artwork"}</div>
          <div class="art-actions">
            <div class="left-actions">
              <button class="icon-btn heart-icon ${liked ? "liked" : ""}" onclick="likeArtwork('${a._id}')" title="Like">
                ${liked ? "♥" : "♡"} <small>${a.likesCount || 0}</small>
              </button>
              <button class="icon-btn" onclick="openComments('${a._id}')" title="Comments">💬 <small>${a.commentsCount || 0}</small></button>
            </div>
            <button class="order-btn" onclick="orderArtwork()">Order Now</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

async function loadComments(artworkId) {
  const list = document.getElementById("commentsList");
  list.innerHTML = `<div class="empty-state">Loading comments...</div>`;

  try {
    const data = await window.apiRequest(`/artworks/${artworkId}/comments`);
    const comments = Array.isArray(data?.data) ? data.data : [];
    const currentUser = window.getUser();

    if (!comments.length) {
      list.innerHTML = `<div class="empty-state">No comments yet.</div>`;
      return;
    }

    list.innerHTML = comments.map(c => {
      const u = c.userId || c.user || {};
      const canDelete = currentUser && (currentUser.role === "admin" || currentUser._id === u._id || currentUser.id === u._id);
      return `
        <div class="comment-item">
          <div class="comment-meta">
            <strong>${u.username || "User"}</strong>
            ${canDelete ? `<button class="comment-delete" onclick="deleteComment('${c._id}')">Delete</button>` : ""}
          </div>
          <p>${c.text || ""}</p>
        </div>`;
    }).join("");
  } catch {
    list.innerHTML = `<div class="empty-state">Unable to load comments.</div>`;
  }
}
