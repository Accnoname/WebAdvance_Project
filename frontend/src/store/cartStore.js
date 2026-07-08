import { create } from 'zustand';
import { CartService } from '../services/cart.service';

export const useCartStore = create((set, get) => ({
  items: [],
  tableId: null,
  orderType: 'tai_ban',
  deliveryAddress: '',
  deliveryPhone: '',
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await CartService.getCart();
      if (res.success && res.data) {
        set({
          items: res.data.items || [],
          tableId: res.data.tableId || null,
          orderType: res.data.orderType || 'tai_ban',
          deliveryAddress: res.data.deliveryAddress || '',
          deliveryPhone: res.data.deliveryPhone || ''
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
    } finally {
      set({ loading: false });
    }
  },

  syncCart: async () => {
    const state = get();
    try {
      await CartService.syncCart({
        items: state.items,
        tableId: state.tableId,
        orderType: state.orderType,
        deliveryAddress: state.deliveryAddress,
        deliveryPhone: state.deliveryPhone
      });
    } catch (error) {
      console.error('Lỗi đồng bộ giỏ hàng:', error);
    }
  },

  setTable: (tableId) => {
    // Prevent accidentally storing a full Table object in localStorage
    const safeTableId = typeof tableId === 'object' && tableId ? tableId._id || tableId.tableNumber : tableId;
    set({ tableId: safeTableId });
    get().syncCart();
  },

  setOrderType: (orderType) => {
    set({ orderType });
    get().syncCart();
  },

  setDeliveryInfo: (address, phone) => {
    set({ deliveryAddress: address, deliveryPhone: phone });
    get().syncCart();
  },

  addItem: (menuItem, quantity = 1, note = '') => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (i) => i.menuItem._id === menuItem._id && i.note === note
    );

    let newItems = [...state.items];
    if (existingIndex >= 0) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity
      };
    } else {
      newItems.push({ menuItem, quantity, price: menuItem.price, note });
    }

    set({ items: newItems });
    get().syncCart();
  },

  removeItem: (menuItemId, note = '') => {
    const state = get();
    const newItems = state.items.filter(
      (i) => !(i.menuItem._id === menuItemId && i.note === note)
    );
    set({ items: newItems });
    get().syncCart();
  },

  updateQuantity: (menuItemId, note = '', quantity) => {
    const state = get();
    let newItems = [];
    if (quantity <= 0) {
      newItems = state.items.filter(
        (i) => !(i.menuItem._id === menuItemId && i.note === note)
      );
    } else {
      newItems = state.items.map((i) =>
        i.menuItem._id === menuItemId && i.note === note
          ? { ...i, quantity }
          : i
      );
    }
    set({ items: newItems });
    get().syncCart();
  },

  updateNote: (menuItemId, oldNote = '', newNote = '') => {
    const state = get();
    const itemExistsWithNewNote = state.items.some(
      (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
    );

    let newItems = [];
    if (itemExistsWithNewNote && oldNote !== newNote) {
      const itemToUpdate = state.items.find(
        (i) => i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
      );
      if (itemToUpdate) {
        newItems = state.items
          .map((i) => {
            if (i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant) {
              return { ...i, quantity: i.quantity + itemToUpdate.quantity };
            }
            return i;
          })
          .filter(
            (i) => !(i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant)
          );
      } else {
        newItems = state.items;
      }
    } else {
      newItems = state.items.map((i) =>
        i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
          ? { ...i, note: newNote }
          : i
      );
    }

    set({ items: newItems });
    get().syncCart();
  },

  clearCart: async () => {
    try {
      await CartService.clearCart();
      set({ items: [] });
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
      set({ items: [] });
    }
  },

  // Dùng khi logout — chỉ xóa UI, không xóa DB
  clearLocalCart: () => {
    set({
      items: [],
      tableId: null,
      orderType: 'tai_ban',
      deliveryAddress: '',
      deliveryPhone: ''
    });
  },

  getTotalAmount: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getTotalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
