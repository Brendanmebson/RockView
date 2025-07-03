// frontend/src/components/notifications/NotificationService.ts
import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  // Add listener for notification updates
  addListener(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Fetch notifications from server
  async fetchNotifications(): Promise<Notification[]> {
    try {
      // For now, generate mock notifications based on user activity
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Report Submitted',
          message: 'A new weekly report has been submitted and requires your approval',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/reports',
        },
        {
          id: '2',
          title: 'Report Approved',
          message: 'Your weekly report has been approved by the district pastor',
          type: 'success',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '3',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM',
          type: 'warning',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
      ];

      this.notifications = mockNotifications;
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      this.notifications.forEach(notification => {
        notification.read = true;
      });
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Add new notification (for real-time updates)
  addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    this.notifications.unshift(newNotification);
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }
}

export const notificationService = new NotificationService();