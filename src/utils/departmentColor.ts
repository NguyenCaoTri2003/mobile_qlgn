export const getDeptColor = (code?: string) => {
  switch (code) {
    case "VSVN":
      return "#3b82f6"; // blue
    case "GPLD":
      return "#10b981"; // green
    case "VSNN":
      return "#650bf5"; 
    default:
      return "#9ca3af";
  }
};

export const getDeptTextColor = (code?: string) => {
  switch (code) {
    case "VSVN":
      return { color: "#2563eb" };
    case "GPLD":
      return { color: "#059669" };
    case "VSNN":
      return { color: "#6c0097" };
    default:
      return { color: "#6b7280" };
  }
};

export const getDeptStyle = (code?: string) => {
  switch (code) {
    case "VSVN":
      return {
        backgroundColor: "#eff6ff", // blue-50
        borderColor: "#bfdbfe",     // blue-200
        textColor: "#1d4ed8",       // blue-700
      };

    case "GPLD":
      return {
        backgroundColor: "#ecfdf5", // green-50
        borderColor: "#bbf7d0",     // green-200
        textColor: "#047857",       // green-700
      };

    case "VSNN":
      return {
        backgroundColor: "#f5f3ff", // violet-50
        borderColor: "#ddd6fe",     // violet-200
        textColor: "#6d28d9",       // violet-700
      };

    default:
      return {
        backgroundColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        textColor: "#4b5563",
      };
  }
};