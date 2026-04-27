const API_BASE_URL = "http://localhost:5000/api";

function getStoredToken() {
  return localStorage.getItem("token") || "";
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildHeaders({ isFormData = false, requireAuth = false, extraHeaders = {} } = {}) {
  const headers = { ...extraHeaders };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAuth) {
    const token = getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body = null,
    isFormData = false,
    requireAuth = false,
    extraHeaders = {}
  } = {}
) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const config = {
    method,
    headers: buildHeaders({ isFormData, requireAuth, extraHeaders })
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);
  const data = await safeParseJson(response);

  if (response.status === 401) {
    clearSession();
    throw new Error((data && data.message) || "Unauthorized. Please login again.");
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "Request failed.");
  }

  if (data && data.success === false) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function getRequest(endpoint, requireAuth = false) {
  return apiRequest(endpoint, {
    method: "GET",
    requireAuth
  });
}

export async function postRequest(endpoint, body = null, requireAuth = false) {
  return apiRequest(endpoint, {
    method: "POST",
    body,
    requireAuth
  });
}

export async function putRequest(endpoint, body = null, requireAuth = false) {
  return apiRequest(endpoint, {
    method: "PUT",
    body,
    requireAuth
  });
}

export async function deleteRequest(endpoint, requireAuth = false) {
  return apiRequest(endpoint, {
    method: "DELETE",
    requireAuth
  });
}

export async function postFormRequest(endpoint, formData, requireAuth = true) {
  return apiRequest(endpoint, {
    method: "POST",
    body: formData,
    isFormData: true,
    requireAuth
  });
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getStoredToken();
}

export function logoutUser() {
  clearSession();
  window.location.href = "../index.html";
}

export function normalizeAuthResponse(data) {
  if (!data) return null;

  return {
    token: data.token || data.data?.token || null,
    user: data.user || data.data?.user || null,
    message: data.message || ""
  };
}