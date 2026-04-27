import { clearMessage, escapeHtml, formatDate, getCurrentUserSafe, setMessage } from "../common.js";

export function createArtworkModal(artwork) {
  const root = document.getElementById("modalRoot");
  if (!root) return null;

  root.innerHTML = `
    <div class="modal-overlay" id="artModalOverlay">
      <div class="modal-card">
        <div class="modal-layout">
          <div class="modal-image-pane">
            <img src="${escapeHtml(artwork.imageUrl || "")}" alt="${escapeHtml(artwork.title || "Artwork")}" />
          </div>
          <div class="modal-content-pane">
            <div class="modal-top">
              <div>
                <p class="eyebrow">Artwork Details</p>
                <h2>${escapeHtml(artwork.title || "Untitled Artwork")}</h2>
                <p class="muted">${escapeHtml(artwork.category || "Artwork")} • ₹${Number(artwork.price || 0).toLocaleString("en-IN")}</p>
              </div>
              <button class="close-btn" id="closeArtworkModal">✕</button>
            </div>

            <div>
              <p class="lead-text">${escapeHtml(artwork.caption || "No caption added yet.")}</p>
            </div>

            <div>
              <div class="section-head" style="margin-bottom:12px;">
                <div>
                  <p class="eyebrow">Community</p>
                  <h3 style="margin:0;">Comments</h3>
                </div>
              </div>
              <div id="commentsList" class="comments-list"></div>
            </div>

            <div>
              <form id="commentForm" class="comment-form">
                <input id="commentInput" type="text" placeholder="Write a comment..." maxlength="500" required />
                <button class="btn btn-primary" type="submit">Post</button>
              </form>
              <div id="commentMessage" class="message-box hidden"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById("artModalOverlay");
  document.getElementById("closeArtworkModal")?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  return {
    commentsList: document.getElementById("commentsList"),
    commentForm: document.getElementById("commentForm"),
    commentInput: document.getElementById("commentInput"),
    commentMessage: document.getElementById("commentMessage")
  };
}

export function renderComments(container, comments = [], onDelete) {
  if (!container) return;
  const currentUser = getCurrentUserSafe();

  if (!comments.length) {
    container.innerHTML = `<div class="empty-state">No comments yet. Start the conversation.</div>`;
    return;
  }

  container.innerHTML = comments.map(comment => {
    const username = comment?.userId?.username || "User";
    const avatarLetter = username.charAt(0).toUpperCase();
    const canDelete = currentUser.role === "admin" || currentUser._id === comment?.userId?._id;

    return `
      <div class="comment-item">
        <div class="comment-avatar">${escapeHtml(avatarLetter)}</div>
        <div style="flex:1;">
          <div class="comment-meta">
            <div>
              <strong>${escapeHtml(username)}</strong>
              <span>${formatDate(comment.createdAt)}</span>
            </div>
            ${canDelete ? `<button class="comment-delete" data-comment-id="${comment._id}">Delete</button>` : ""}
          </div>
          <p style="margin:8px 0 0; color:#d7e6de; line-height:1.6;">${escapeHtml(comment.text)}</p>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".comment-delete").forEach(btn => {
    btn.addEventListener("click", () => onDelete?.(btn.dataset.commentId));
  });
}

export function showCommentMessage(el, text, type = "success") {
  setMessage(el, text, type);
}

export function hideCommentMessage(el) {
  clearMessage(el);
}

export function closeModal() {
  const root = document.getElementById("modalRoot");
  if (root) root.innerHTML = "";
}
