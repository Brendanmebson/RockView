// frontend/src/services/notificationService.ts - Updated to use real API
import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'report_submitted' | 'report_approved' | 'report_rejected' | 'system' | 'message';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  metadata?: {
    reportId?: string;
    messageId?: string;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private unreadCount: number = 0;

  addListener(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  async fetchNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications?limit=50');
      this.notifications = response.data.notifications || [];
      this.unreadCount = response.data.unreadCount || 0;
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async fetchUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      this.unreadCount = response.data.count || 0;
      return this.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      const notification = this.notifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/notifications/mark-all-read');
      
      this.notifications.forEach(notification => {
        notification.read = true;
      });
      this.unreadCount = 0;
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  startPolling(intervalMs: number = 30000) {
    setInterval(async () => {
      await this.fetchNotifications();
    }, intervalMs);
  }
}

export const notificationService = new NotificationService();