const KEY = 'token';

export function migrateTokenFromLocalStorage() {
  const legacy = localStorage.getItem(KEY);
  if (legacy && !sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, legacy);
    localStorage.removeItem(KEY);
  }
}

export function getToken() {
  return sessionStorage.getItem(KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(KEY);
}
