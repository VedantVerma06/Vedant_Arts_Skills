const AUTH_API = "https://vedant-arts-skills.onrender.com/api";

async function login() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value.trim();
  const btn = document.getElementById("loginBtn");

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Logging in...";
    }

    const res = await fetch(`${AUTH_API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || data?.success === false) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token || data.data?.token);
    localStorage.setItem("user", JSON.stringify(data.user || data.data?.user));

    window.location.href = "pages/home.html";
  } catch (error) {
    alert(error.message || "Login failed");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  }
}

async function register() {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
  const btn = document.getElementById("registerBtn");

  if (!username || !email || !password || !confirmPassword) {
    alert("Please fill all fields.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Creating account...";
    }

    const res = await fetch(`${AUTH_API}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, email, password, confirmPassword })
    });

    const data = await res.json();

    if (!res.ok || data?.success === false) {
      throw new Error(data.message || "Registration failed");
    }

    alert("Registration successful. Please login.");
    window.location.href = "index.html";
  } catch (error) {
    alert(error.message || "Registration failed");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Register";
    }
  }
}

window.login = login;
window.register = register;