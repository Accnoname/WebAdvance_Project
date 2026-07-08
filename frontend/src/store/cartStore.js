import { create } from 'zustand';
import { CartService } from '../services/cart.service';
import { VoucherService } from '../services/voucher.service';
import toast from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
  items: [],
  tableId: null,
  orderType: 'tai_ban',
  deliveryAddress: '',
  deliveryPhone: '',
  loading: false,
  
  // Voucher states
  voucherCode: null,
  discountAmount: 0,

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

  addItem: (menuItem, quantity = 1, note = '', variant = null) => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (i) => i.menuItem._id === menuItem._id && i.note === note && i.variant === variant
    );

    let newItems = [...state.items];
    if (existingIndex >= 0) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity
      };
    } else {
      newItems.push({ menuItem, quantity, price: menuItem.price, note, variant });
    }

    set({ items: newItems });
    // Nếu giỏ hàng thay đổi, xóa voucher để người dùng nhập lại (tránh sai lệch số liệu)
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  removeItem: (menuItemId, note = '', variant = null) => {
    const state = get();
    const newItems = state.items.filter(
      (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
    );
    set({ items: newItems });
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  updateQuantity: (menuItemId, note = '', variant = null, quantity) => {
    const state = get();
    let newItems = [];
    if (quantity <= 0) {
      newItems = state.items.filter(
        (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
      );
    } else {
      newItems = state.items.map((i) =>
        i.menuItem._id === menuItemId && i.note === note && i.variant === variant
          ? { ...i, quantity }
          : i
      );
    }
    set({ items: newItems });
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  updateNote: (menuItemId, oldNote = '', newNote = '', variant = null) => {
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
      set({ items: [], voucherCode: null, discountAmount: 0 });
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
      set({ items: [], voucherCode: null, discountAmount: 0 });
    }
  },

  // Dùng khi logout — chỉ xóa UI, không xóa DB
  clearLocalCart: () => {
    set({
      items: [],
      tableId: null,
      orderType: 'tai_ban',
      deliveryAddress: '',
      deliveryPhone: '',
      voucherCode: null,
      discountAmount: 0
    });
  },

  getTotalAmount: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getFinalAmount: () => {
    const subTotal = get().getTotalAmount();
    const final = subTotal - get().discountAmount;
    return final > 0 ? final : 0;
  },

  getTotalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),

  applyVoucher: async (code) => {
    const subTotal = get().getTotalAmount();
    if (subTotal === 0) {
      throw new Error('Giỏ hàng trống');
    }
    
    try {
      const res = await VoucherService.validate(code, subTotal);
      if (res.success) {
        set({
          voucherCode: res.data.voucherCode,
          discountAmount: res.data.discountAmount
        });
        return res;
      }
    } catch (error) {
      set({ voucherCode: null, discountAmount: 0 });
      throw error;
    }
  },

  removeVoucher: () => {
    set({ voucherCode: null, discountAmount: 0 });
  }
}));
