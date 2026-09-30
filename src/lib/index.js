export { mailApi } from "./mailApi";
export { driveApi } from "./driveApi";
export { chatApi } from "./chatApi";
export { searchApi, SEARCH_MODULES } from "./searchApi";
export { calendarApi } from "./calendarApi";
export { reportsApi } from "./reportsApi";

import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";

export const workspaceNotificationApi = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};