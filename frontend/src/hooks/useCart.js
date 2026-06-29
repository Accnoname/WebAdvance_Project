import { useCartStore } from '../store/cartStore';

const useCart = () => {
  const { items, tableId, addItem, removeItem, updateQuantity, clearCart, getTotalAmount, getTotalItems, setTable } = useCartStore();

  return {
    items,
    tableId,
    totalAmount: getTotalAmount(),
    totalItems: getTotalItems(),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setTable,
  };
};

export default useCart;
