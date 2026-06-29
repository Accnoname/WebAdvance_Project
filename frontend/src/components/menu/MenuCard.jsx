import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

const MenuCard = ({ item, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [note, setNote] = useState('');

  // Handle local image vs external image
  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    onAddToCart(item, 1, note);
    setIsAdded(true);
    setNote('');
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 flex flex-col h-full border border-stone-100">
      {/* Image container with aspect ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            !item.isAvailable ? 'grayscale opacity-70' : ''
          }`}
        />
        
        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-4 py-2 bg-rose-500 text-white font-medium rounded-full text-sm tracking-wide shadow-lg">
              Đã hết món
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm">
            {item.category === 'khai_vi' ? 'Khai vị' :
             item.category === 'chinh' ? 'Món chính' :
             item.category === 'trang_mieng' ? 'Tráng miệng' : 'Thức uống'}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-display font-bold text-xl text-stone-800 line-clamp-1">
            {item.name}
          </h3>
          <span className="font-bold text-primary-600 whitespace-nowrap text-lg">
            {item.price.toLocaleString('vi-VN')}đ
          </span>
        </div>
        
        <p className="text-stone-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
          {item.description}
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Ghi chú (VD: Không hành...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!item.isAvailable}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              !item.isAvailable
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isAdded
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-stone-900 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-600/20 active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Đã thêm
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Thêm vào giỏ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
