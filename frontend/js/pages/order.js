window.init = function () {
  if (!window.checkAuth()) return;

  fillUserDetails();
  attachPricePreview();
  attachFilePreview();
  attachFormValidation();
};

function fillUserDetails() {
  const user = window.getUser();

  document.getElementById("username").value = user?.username || "";
  document.getElementById("email").value = user?.email || "";
}

function attachPricePreview() {
  const sizeInput = document.getElementById("size");
  const mediumInput = document.getElementById("medium");
  const preview = document.getElementById("pricePreview");

  function updatePrice() {
    const price = window.getBudget(sizeInput.value, mediumInput.value);

    preview.textContent = price
      ? `Total Price: ${window.formatPrice(price)} — advance is required only after admin accepts.`
      : "Select size and medium to see price.";
  }

  sizeInput.addEventListener("change", updatePrice);
  mediumInput.addEventListener("change", updatePrice);

  updatePrice();
}

function attachFilePreview() {
  const input = document.getElementById("image");
  const out = document.getElementById("filePreview");

  input.addEventListener("change", () => {
    out.innerHTML = Array.from(input.files)
      .map((file) => `<span class="file-chip">${file.name}</span>`)
      .join("");
  });
}

function attachFormValidation() {
  const submitBtn = document.getElementById("submitBtn");

  function validate() {
    const email = document.getElementById("email").value.trim();
    const size = document.getElementById("size").value;
    const medium = document.getElementById("medium").value;
    const files = document.getElementById("image").files.length;

    submitBtn.disabled = !(email && size && medium && files);
  }

  document.querySelectorAll("#email,#size,#medium,#image").forEach((el) => {
    el.addEventListener("input", validate);
    el.addEventListener("change", validate);
  });

  validate();
}

window.submitOrder = async function () {
  const submitBtn = document.getElementById("submitBtn");

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const size = document.getElementById("size").value;
  const medium = document.getElementById("medium").value;
  const description = document.getElementById("description").value.trim();
  const files = document.getElementById("image").files;

  const budget = window.getBudget(size, medium);

  if (!email || !size || !medium || !files.length) {
    alert("Please fill all required fields and upload at least one reference image.");
    return;
  }

  if (!budget) {
    alert("Please select a valid size and medium.");
    return;
  }

  const fd = new FormData();

  fd.append("name", username);
  fd.append("email", email);
  fd.append("size", size);
  fd.append("medium", medium);
  fd.append("budget", budget);
  fd.append("description", description || "No description");

  Array.from(files).forEach((file) => {
    fd.append("referenceImages", file);
  });

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const response = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: fd,
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || "Order submission failed.");
    }

    alert("Thank you, Your order has been submitted successfully.");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 5000);

  } catch (error) {
    alert(error.message || "Order submission failed.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Order";
  }
};