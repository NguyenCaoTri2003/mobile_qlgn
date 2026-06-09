// export const getDeptColor = (code?: string) => {
//   switch (code) {
//     case "VSVN":
//       return "#3b82f6"; // blue
//     case "GPLD":
//       return "#10b981"; // green
//     case "VSNN":
//       return "#650bf5"; 
//     default:
//       return "#9ca3af";
//   }
// };

// export const getDeptTextColor = (code?: string) => {
//   switch (code) {
//     case "VSVN":
//       return { color: "#2563eb" };
//     case "GPLD":
//       return { color: "#059669" };
//     case "VSNN":
//       return { color: "#6c0097" };
//     default:
//       return { color: "#6b7280" };
//   }
// };

// export const getDeptStyle = (code?: string) => {
//   switch (code) {
//     case "VSVN":
//       return {
//         backgroundColor: "#eff6ff", // blue-50
//         borderColor: "#bfdbfe",     // blue-200
//         textColor: "#1d4ed8",       // blue-700
//       };

//     case "GPLD":
//       return {
//         backgroundColor: "#ecfdf5", // green-50
//         borderColor: "#bbf7d0",     // green-200
//         textColor: "#047857",       // green-700
//       };

//     case "VSNN":
//       return {
//         backgroundColor: "#f5f3ff", // violet-50
//         borderColor: "#ddd6fe",     // violet-200
//         textColor: "#6d28d9",       // violet-700
//       };

//     default:
//       return {
//         backgroundColor: "#f3f4f6",
//         borderColor: "#e5e7eb",
//         textColor: "#4b5563",
//       };
//   }
// };

export const getDeptColor = (code?: string) => {
  switch (code) {
    case "VSVN":
      return "#3b82f6"; // blue
    case "GPLD":
      return "#10b981"; // green
    case "VSNN":
      return "#8b5cf6"; // purple-500 (giống web)
    default:
      // random màu cố định theo code như web
      const colors = [
        "#dc2626", // red-600
        "#ea580c", // orange-600
        "#d97706", // amber-600
        "#65a30d", // lime-600
        "#16a34a", // green-600
        "#059669", // emerald-600
        "#0891b2", // cyan-600
        "#0284c7", // sky-600
        "#4f46e5", // indigo-600
        "#7c3aed", // violet-600
        "#c026d3", // fuchsia-600
        "#db2777", // pink-600
      ];
      
      let hash = 0;
      const str = code || "default";
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return colors[Math.abs(hash) % colors.length];
  }
};

export const getDeptTextColor = (code?: string) => {
  switch (code) {
    case "VSVN":
      return { color: "#2563eb" };
    case "GPLD":
      return { color: "#0d9488" };
    case "VSNN":
      return { color: "#7c3aed" };
    default:
      const colors = [
        "#dc2626",
        "#ea580c",
        "#d97706",
        "#65a30d",
        "#16a34a",
        "#059669",
        "#0891b2",
        "#0284c7",
        "#4f46e5",
        "#7c3aed",
        "#c026d3",
        "#db2777",
      ];
      
      let hash = 0;
      const str = code || "default";
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return { color: colors[Math.abs(hash) % colors.length] };
  }
};

export const getDeptStyle = (code?: string) => {
  switch (code) {
    case "VSVN":
      return {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
        textColor: "#1d4ed8",
      };
    case "GPLD":
      return {
        backgroundColor: "#ecfdf5",
        borderColor: "#bbf7d0",
        textColor: "#047857",
      };
    case "VSNN":
      return {
        backgroundColor: "#f5f3ff",
        borderColor: "#ddd6fe",
        textColor: "#6d28d9",
      };
    default:
      const bgColors = [
        "#fef2f2",
        "#fff7ed",
        "#fffbeb",
        "#f7fee7",
        "#f0fdf4",
        "#ecfdf5",
        "#ecfeff",
        "#f0f9ff",
        "#eef2ff",
        "#f5f3ff",
        "#fdf4ff",
        "#fce7f3",
      ];
      
      const borderColors = [
        "#fecaca",
        "#fed7aa",
        "#fde68a",
        "#d9f99d",
        "#bbf7d0",
        "#a7f3d0",
        "#a5f3fc",
        "#bae6fd",
        "#c7d2fe",
        "#ddd6fe",
        "#f5d0fe",
        "#fbcfe8",
      ];
      
      const textColors = [
        "#b91c1c",
        "#c2410c",
        "#b45309",
        "#4d7c0f",
        "#166534",
        "#047857",
        "#0e7490",
        "#075985",
        "#4338ca",
        "#6d28d9",
        "#a21caf",
        "#be123c",
      ];
      
      let hash = 0;
      const str = code || "default";
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % bgColors.length;
      
      return {
        backgroundColor: bgColors[index],
        borderColor: borderColors[index],
        textColor: textColors[index],
      };
  }
};