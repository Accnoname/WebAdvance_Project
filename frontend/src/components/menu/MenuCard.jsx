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
    <div className="group relative bg-[#251b0f] rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 flex flex-col h-full border border-stone-800/80">
      {/* Image container with hover overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1208] border-b border-stone-800/80">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            !item.isAvailable ? 'grayscale opacity-50' : ''
          }`}
        />
        
        {/* Hover Overlay for Description */}
        <div className="absolute inset-0 bg-[#1a1208]/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center">
          <p className="text-[#d4c3a3] text-xs font-semibold leading-relaxed transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {item.description}
          </p>
        </div>

        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-[#1a1208]/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-4 py-2 bg-rose-600 text-white font-bold rounded-full text-xs tracking-wide shadow-lg uppercase">
              Đã hết món
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1.5 bg-[#1a1208]/90 backdrop-blur-md text-[#d4a85a] text-[10px] font-bold uppercase tracking-wider rounded-xl border border-stone-800">
            {item.category === 'khai_vi' ? 'Khai vị' :
             item.category === 'chinh' ? 'Món chính' :
             item.category === 'trang_mieng' ? 'Tráng miệng' : 'Thức uống'}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow bg-[#251b0f] relative z-20">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className="font-display font-bold text-lg text-[#f5e6c8] line-clamp-1 group-hover:text-[#d4a85a] transition-colors">
            {item.name}
          </h3>
          <span className="font-bold text-[#d4a85a] whitespace-nowrap text-base">
            {item.price.toLocaleString('vi-VN')}đ
          </span>
        </div>
        
        <div className="flex-grow space-y-4">
          {/* Variants Selector */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Chọn Vị</label>
              <div className="flex flex-wrap gap-1.5">
                {item.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    disabled={!item.isAvailable}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      selectedVariant === v
                        ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-sm shadow-[#d4a85a]/10'
                        : 'bg-[#1a1208] border-stone-850 text-[#d4c3a3] hover:bg-[#2e2112] hover:text-[#f5e6c8]'
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
              placeholder="Ghi chú thêm (Ít đường, không hành...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!item.isAvailable}
              className="w-full px-4 py-2.5 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#d4a85a]/25 focus:border-[#d4a85a] transition-colors disabled:opacity-50 font-semibold"
            />
          </div>
        </div>

        {/* Action Row: Quantity + Add Button */}
        <div className="mt-6 flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-[#1a1208] rounded-xl p-1 border border-stone-850">
            <button
              onClick={decreaseQuantity}
              disabled={!item.isAvailable || quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#251b0f] text-[#f5e6c8] shadow-sm hover:text-[#d4a85a] border border-stone-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-black text-[#f5e6c8] text-xs">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              disabled={!item.isAvailable}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#251b0f] text-[#f5e6c8] shadow-sm hover:text-[#d4a85a] border border-stone-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex-grow py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              !item.isAvailable
                ? 'bg-stone-800/40 text-stone-500 cursor-not-allowed border border-stone-800'
                : isAdded
                ? 'bg-green-650 text-white shadow-green-500/10'
                : 'bg-[#d4a85a] text-[#1a1208] hover:bg-[#c2984a] hover:shadow-md hover:shadow-amber-500/10 active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Đã đặt {quantity} món
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
