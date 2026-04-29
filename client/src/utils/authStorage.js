export const AUTH_STORAGE_EVENT = "auth-storage-changed";

export const emitAuthStorageChanged = () => {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const getAuthToken = () => localStorage.getItem("token");

export const getStoredAuthUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem("token", token);
  }

  localStorage.setItem("user", JSON.stringify(user || {}));
  emitAuthStorageChanged();
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  emitAuthStorageChanged();
};
