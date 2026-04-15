export function getAvatarColorById(id?: number | string) {
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#ec4899",
    "#f97316",
  ];

  if (!id) return colors[0];

  const num = typeof id === "string" ? parseInt(id, 10) || 0 : id;

  return colors[num % colors.length];
}