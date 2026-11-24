const BOOKMARKS_KEY = "cristina_bookmarks";
const BOOKMARKS_EVENT = "cristina:bookmarks-updated";

export function getBookmarks(): number[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
    return Array.isArray(stored)
      ? stored.filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(id: number): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);

  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(id);
  }

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  return index < 0;
}

export function subscribeToBookmarks(onChange: () => void): () => void {
  window.addEventListener(BOOKMARKS_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(BOOKMARKS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
