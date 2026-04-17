export const CREATOR_TOKEN_KEY = "cristina_creator_token";

export function getCreatorToken(): string | null {
  return localStorage.getItem(CREATOR_TOKEN_KEY);
}

export function setCreatorToken(token: string) {
  localStorage.setItem(CREATOR_TOKEN_KEY, token);
}

export function clearCreatorToken() {
  localStorage.removeItem(CREATOR_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getCreatorToken();
}
