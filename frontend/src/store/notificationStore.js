import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: (notification) => set((state) => ({
    notifications: [{ ...notification, id: Date.now(), read: false }, ...state.notifications]
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  clearAll: () => set({ notifications: [] }),

  getUnreadCount: () => get().notifications.filter(n => !n.read).length,
}));
