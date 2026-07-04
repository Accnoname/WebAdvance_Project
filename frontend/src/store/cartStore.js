import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      orderType: 'tai_ban', // 'tai_ban' hoặc 'mang_ve'

      setTable: (tableId) => set({ tableId }),
      setOrderType: (orderType) => set({ orderType }),

      addItem: (menuItem, quantity = 1, note = '', variant = null) => set((state) => {
        const existingIndex = state.items.findIndex(
          (i) => i.menuItem._id === menuItem._id && i.note === note && i.variant === variant
        );

        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += quantity;
          return { items: newItems };
        }

        return {
          items: [
            ...state.items,
            { menuItem, quantity, price: menuItem.price, note, variant }
          ]
        };
      }),

      removeItem: (menuItemId, note = '', variant = null) => set((state) => ({
        items: state.items.filter(
          (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
        )
      })),

      updateQuantity: (menuItemId, note = '', variant = null, quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            items: state.items.filter(
              (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
            )
          };
        }
        return {
          items: state.items.map((i) =>
            i.menuItem._id === menuItemId && i.note === note && i.variant === variant
              ? { ...i, quantity }
              : i
          )
        };
      }),

      updateNote: (menuItemId, oldNote = '', newNote = '', variant = null) => set((state) => {
        const itemExistsWithNewNote = state.items.some(
          (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
        );

        if (itemExistsWithNewNote && oldNote !== newNote) {
          // If merging into an existing note item
          const itemToUpdate = state.items.find(i => i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant);
          if (!itemToUpdate) return state;

          return {
            items: state.items
              .map((i) => {
                if (i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant) {
                  return { ...i, quantity: i.quantity + itemToUpdate.quantity };
                }
                return i;
              })
              .filter(i => !(i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant))
          };
        }

        return {
          items: state.items.map((i) =>
            i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
              ? { ...i, note: newNote }
              : i
          )
        };
      }),

      clearCart: () => set({ items: [] }), // Keep tableId and orderType when clearing cart

      getTotalAmount: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'restaurant-cart' // persist to localStorage
    }
  )
);
