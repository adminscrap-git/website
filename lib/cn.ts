/** Join class names, dropping falsy ones. Not clsx — this is all we need. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
