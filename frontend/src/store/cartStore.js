import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,

      setTable: (tableId) => set({ tableId }),

      addItem: (menuItem, quantity = 1, note = '') => set((state) => {
        const existingIndex = state.items.findIndex(
          (i) => i.menuItem._id === menuItem._id && i.note === note
        );

        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += quantity;
          return { items: newItems };
        }

        return {
          items: [
            ...state.items,
            { menuItem, quantity, price: menuItem.price, note }
          ]
        };
      }),

      removeItem: (menuItemId, note = '') => set((state) => ({
        items: state.items.filter(
          (i) => !(i.menuItem._id === menuItemId && i.note === note)
        )
      })),

      updateQuantity: (menuItemId, note = '', quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            items: state.items.filter(
              (i) => !(i.menuItem._id === menuItemId && i.note === note)
            )
          };
        }
        return {
          items: state.items.map((i) =>
            i.menuItem._id === menuItemId && i.note === note
              ? { ...i, quantity }
              : i
          )
        };
      }),

      updateNote: (menuItemId, oldNote = '', newNote = '') => set((state) => {
        const itemExistsWithNewNote = state.items.some(
          (i) => i.menuItem._id === menuItemId && i.note === newNote
        );

        if (itemExistsWithNewNote && oldNote !== newNote) {
          // If merging into an existing note item
          const itemToUpdate = state.items.find(i => i.menuItem._id === menuItemId && i.note === oldNote);
          if (!itemToUpdate) return state;

          return {
            items: state.items
              .map((i) => {
                if (i.menuItem._id === menuItemId && i.note === newNote) {
                  return { ...i, quantity: i.quantity + itemToUpdate.quantity };
                }
                return i;
              })
              .filter(i => !(i.menuItem._id === menuItemId && i.note === oldNote))
          };
        }

        return {
          items: state.items.map((i) =>
            i.menuItem._id === menuItemId && i.note === oldNote
              ? { ...i, note: newNote }
              : i
          )
        };
      }),

      clearCart: () => set({ items: [] }), // Keep tableId when clearing cart

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
