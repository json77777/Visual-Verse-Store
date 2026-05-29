export const USER_UPDATED_EVENT = "vv:user-updated";

export function emitUserUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}
