/**
 * Notification Service
 * Manages extension badges and system notifications.
 */
import { DB } from "../../Database/DatabaseManager.js";

export const NotificationService = {
  /**
   * Updates the extension badge based on stored sentences.
   * Logic:
   * - Unsynced > 0: Show unsynced count (Red/Orange).
   * - All synced: Show total count (Blue/Green) or nothing.
   */
  async updateBadge() {
    try {
      const unsyncedCount = await DB.countUnsynced();
      const totalCount = await DB.count();

      if (unsyncedCount > 0) {
        await chrome.action.setBadgeText({ text: unsyncedCount.toString() });
        await chrome.action.setBadgeBackgroundColor({ color: "#EF4444" }); // Red (warning)
      } else if (totalCount > 0) {
        await chrome.action.setBadgeText({ text: totalCount.toString() });
        await chrome.action.setBadgeBackgroundColor({ color: "#3B82F6" }); // Blue (info)
      } else {
        await chrome.action.setBadgeText({ text: "" });
      }
    } catch (err) {
      console.warn("[NotificationService] Error updating badge:", err);
    }
  },

  /**
   * Shows a system notification (Toast-like).
   * @param {string} title
   * @param {string} message
   * @param {string} id - Optional notification ID
   */
  async notify(title, message, id = "ext-notification") {
    try {
      // Note: iconUrl is required in MV3 notifications. 
      // If "icons/icon128.png" doesn't exist, this might fail silently or show a default icon depending on OS/Browser.
      const iconUrl = chrome.runtime.getURL("icons/icon.png");
      
      chrome.notifications.create(id, {
        type: "basic",
        title: title,
        message: message,
        iconUrl: iconUrl, 
        priority: 1
      });
    } catch (err) {
      console.warn("[NotificationService] Error showing notification:", err);
    }
  }
};
