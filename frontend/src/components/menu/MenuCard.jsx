import { Plus, Minus, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const MenuCard = ({ item, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    item.variants && item.variants.length > 0 ? item.variants[0] : null
  );

  // Handle local image vs external image
  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    onAddToCart(item, quantity, note, selectedVariant);
    toast.success(`Đã thêm ${quantity} x ${item.name} vào giỏ hàng`);
    setIsAdded(true);
    setNote('');
    setQuantity(1);
    if (item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    }
    setTimeout(() => setIsAdded(false), 2000);
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 flex flex-col h-full border border-stone-100">
      {/* Image container with hover overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            !item.isAvailable ? 'grayscale opacity-70' : ''
          }`}
        />
        
        {/* Hover Overlay for Description */}
        <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center">
          <p className="text-stone-100 text-sm leading-relaxed transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {item.description}
          </p>
        </div>

        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-4 py-2 bg-rose-500 text-white font-medium rounded-full text-sm tracking-wide shadow-lg">
              Đã hết món
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm">
            {item.category === 'khai_vi' ? 'Khai vị' :
             item.category === 'chinh' ? 'Món chính' :
             item.category === 'trang_mieng' ? 'Tráng miệng' : 'Thức uống'}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow bg-white relative z-20">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className="font-display font-bold text-xl text-stone-800 line-clamp-1">
            {item.name}
          </h3>
          <span className="font-bold text-primary-600 whitespace-nowrap text-lg">
            {item.price.toLocaleString('vi-VN')}đ
          </span>
        </div>
        
        <div className="flex-grow space-y-4">
          {/* Variants Selector */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Chọn Vị</label>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    disabled={!item.isAvailable}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedVariant === v
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Ghi chú (VD: Ít đá...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!item.isAvailable}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Row: Quantity + Add Button */}
        <div className="mt-6 flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button
              onClick={decreaseQuantity}
              disabled={!item.isAvailable || quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm hover:text-primary-600 disabled:opacity-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-stone-800 text-sm">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              disabled={!item.isAvailable}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm hover:text-primary-600 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex-grow py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              !item.isAvailable
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                : isAdded
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-stone-900 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-600/20 active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Đã thêm {quantity}
              </>
            ) : (
              'Xác Nhận Đặt Món'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
