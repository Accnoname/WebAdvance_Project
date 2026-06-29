import { useCartStore } from '../../store/cartStore';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, tableId, updateQuantity, updateNote, removeItem, clearCart, getTotalAmount } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!tableId) {
      toast.error('Vui lòng chọn bàn hoặc quét mã QR tại bàn trước khi đặt món!');
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    // Ở Tuần 3, chúng ta sẽ gọi API POST /orders ở đây.
    // Hiện tại chỉ mock thành công và clear giỏ hàng.
    toast.success('Đặt món thành công! Đơn hàng đang được nhà bếp chuẩn bị.');
    clearCart();
    navigate('/my-orders');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-fade-in-up flex flex-col items-center justify-center">
        <div className="w-48 h-48 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="text-6xl text-stone-300">🛒</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-stone-500 mb-8 text-center max-w-md">
          Có vẻ như bạn chưa chọn món nào. Hãy khám phá thực đơn hấp dẫn của chúng tôi và chọn cho mình những món ưng ý nhé!
        </p>
        <Link
          to="/menu"
          className="px-8 py-3 bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
        >
          Xem Thực Đơn
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-stone-900">Giỏ Hàng</h1>
          <p className="text-stone-500 mt-2">
            {tableId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Đang đặt cho Bàn số {tableId}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Chưa có thông tin bàn
              </span>
            )}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-stone-500 hover:text-rose-600 transition-colors underline underline-offset-4"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 mb-8">
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={`${item.menuItem._id}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-stone-100 last:border-0 last:pb-0">
              <img
                src={item.menuItem.image.startsWith('http') ? item.menuItem.image : `http://localhost:3000${item.menuItem.image}`}
                alt={item.menuItem.name}
                className="w-24 h-24 object-cover rounded-2xl bg-stone-100"
              />
              
              <div className="flex-grow">
                <h3 className="font-display font-bold text-lg text-stone-800">
                  {item.menuItem.name}
                </h3>
                <div className="text-primary-600 font-medium mb-2">
                  {item.price.toLocaleString('vi-VN')}đ
                </div>
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => updateNote(item.menuItem._id, item.note, e.target.value)}
                  placeholder="Ghi chú (Không hành, ít cay...)"
                  className="w-full text-sm px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
                <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 p-1">
                  <button
                    onClick={() => updateQuantity(item.menuItem._id, item.note, item.quantity - 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-500 transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium text-stone-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem._id, item.note, item.quantity + 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-500 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right sm:min-w-[100px]">
                  <div className="font-bold text-stone-800">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.menuItem._id, item.note)}
                  className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-stone-900/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-stone-400 text-sm font-medium mb-1">Tổng cộng ({items.length} món)</p>
            <div className="text-3xl font-display font-bold">
              {getTotalAmount().toLocaleString('vi-VN')}
              <span className="text-xl ml-1 text-primary-400">VNĐ</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg transition-all active:scale-95 group"
          >
            Đặt Món Ngay
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
