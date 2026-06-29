import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  tableId: null,

  setTable: (tableId) => set({ tableId }),

  addItem: (menuItem) => set((state) => {
    const existing = state.items.find(i => i._id === menuItem._id);
    if (existing) {
      return {
        items: state.items.map(i =>
          i._id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      };
    }
    return { items: [...state.items, { ...menuItem, quantity: 1 }] };
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i._id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => ({
    items: quantity <= 0
      ? state.items.filter(i => i._id !== id)
      : state.items.map(i => i._id === id ? { ...i, quantity } : i)
  })),

  clearCart: () => set({ items: [], tableId: null }),

  getTotalAmount: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getTotalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
