export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Chưa có ngày";

  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const getDeliveryStatus = (
  date?: string,
  time?: string,
  status?: string,
) => {
  if (!date || !time) return null;

  const isCompleted = status === "COMPLETED" || status === "FINISHED";

  if (isCompleted) return null;

  const target = new Date(`${date}T${time}`);
  const now = new Date();

  const today = now.toISOString().split("T")[0];

  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return "đã quá hạn giao";
  }

  if (date === today && diff > 0) {
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `còn ${hours} giờ ${minutes} phút`;
    }

    return `còn ${minutes} phút`;
  }

  return null;
};

export const getDeliveryStyle = (
  date?: string,
  time?: string,
  status?: string,
) => {
  if (!date) {
    return {
      bg: "#f3f4f6",
      text: "#6b7280",
      icon: "#6b7280",
    };
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const target = time ? new Date(`${date}T${time}`) : new Date(date);

  const done = status === "COMPLETED" || status === "FINISHED";

  if (done) {
    return {
      bg: "#dcfce7",
      text: "#166534",
      icon: "#16a34a",
    };
  }

  if (target < now) {
    return {
      bg: "#fee2e2",
      text: "#991b1b",
      icon: "#dc2626",
    };
  }

  if (date === today) {
    return {
      bg: "#fef3c7",
      text: "#92400e",
      icon: "#d97706",
    };
  }

  return {
    bg: "#e0f2fe",
    text: "#075985",
    icon: "#0284c7",
  };
};