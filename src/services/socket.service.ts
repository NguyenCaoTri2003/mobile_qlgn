// import { io, Socket } from "socket.io-client";
// import { BE_URL } from "../constants/api";

// let socket: Socket | null = null;

// export const connectSocket = (
//   userId: number,
//   role: string,
//   handlers?: {
//     notification?: (data: any) => void;
//     orderAssigned?: (data: any) => void;
//     notificationRead?: (data: any) => void;
//     notificationReadAll?: () => void;
//     dashboardUpdate?: () => void;
//   },
// ) => {
//   if (socket) return;

//   socket = io(BE_URL, {
//     // transports: ["polling"],
//     transports: ["websocket"],
//   });

//   socket.on("connect", () => {
//     socket?.emit("join", {
//       userId,
//       role,
//     });

//     // console.log("Connect socket: ", userId)

//     if (handlers?.notification) {
//       socket!.on("newNotification", handlers.notification);
//     }

//     if (handlers?.orderAssigned) {
//       socket!.on("orderAssigned", handlers.orderAssigned);
//     }

//     if (handlers?.notificationRead) {
//       socket!.on("notificationRead", handlers.notificationRead);
//     }

//     if (handlers?.notificationReadAll) {
//       socket!.on("notificationReadAll", handlers.notificationReadAll);
//     }

//     if (handlers?.dashboardUpdate) {
//       socket!.off("dashboardUpdate");
//       socket!.on("dashboardUpdate", handlers.dashboardUpdate);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket disconnected");
//   });
// };

// export const disconnectSocket = () => {
//   socket?.disconnect();
//   socket = null;
// };

import { io, Socket } from "socket.io-client";
import { BE_URL } from "../constants/api";

let socket: Socket | null = null;

export const connectSocket = (
  userId: number,
  role: string,
  handlers?: {
    notification?: (data: any) => void;
    orderAssigned?: (data: any) => void;
    notificationRead?: (data: any) => void;
    notificationReadAll?: () => void;
    dashboardUpdate?: () => void;
  },
) => {
  if (!socket) {
    socket = io(BE_URL, {
      transports: ["polling"],
    });

    socket.on("connect", () => {
      socket!.emit("join", { userId, role });
      console.log("✅ connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ disconnected");
    });
  }

  // ✅ LUÔN attach handler (ngoài connect)
  if (handlers?.dashboardUpdate) {
    socket.off("dashboardUpdate");
    socket.on("dashboardUpdate", handlers.dashboardUpdate);
  }

  if (handlers?.notification) {
    socket.off("newNotification");
    socket.on("newNotification", handlers.notification);
  }

  if (handlers?.orderAssigned) {
    socket.off("orderAssigned");
    socket.on("orderAssigned", handlers.orderAssigned);
  }

  if (handlers?.notificationRead) {
    socket.off("notificationRead");
    socket.on("notificationRead", handlers.notificationRead);
  }

  if (handlers?.notificationReadAll) {
    socket.off("notificationReadAll");
    socket.on("notificationReadAll", handlers.notificationReadAll);
  }
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};