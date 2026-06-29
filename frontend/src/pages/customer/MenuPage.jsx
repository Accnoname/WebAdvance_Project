import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MenuService } from '../../services/menu.service';
import { useCartStore } from '../../store/cartStore';
import MenuCard from '../../components/menu/MenuCard';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'khai_vi', label: 'Khai vị' },
  { id: 'chinh', label: 'Món chính' },
  { id: 'trang_mieng', label: 'Tráng miệng' },
  { id: 'nuoc', label: 'Thức uống' }
];

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addItem, setTable } = useCartStore();

  useEffect(() => {
    if (tableNumber) {
      setTable(tableNumber);
      toast.success(`Đã nhận bàn số ${tableNumber}`);
    }
  }, [tableNumber, setTable]);

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMenu();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'all') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      // Fetch only available items for customer
      // But actually we might want to show them as "out of stock", so let backend return all 
      // or we handle it visually. Let's fetch all and show grayed out.

      const response = await MenuService.getAll(params);
      if (response.success) {
        setMenuItems(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải thực đơn. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-stone-900">Thực đơn</h1>
          <p className="text-stone-500 mt-2">
            {tableNumber ? `Bạn đang đặt món cho Bàn ${tableNumber}` : 'Khám phá hương vị tuyệt hảo từ bếp trưởng của chúng tôi'}
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          <Search className="absolute left-4 top-3.5 text-stone-400 w-5 h-5" />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-stone-900 text-white shadow-md shadow-stone-900/20'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
          <div className="text-stone-400 mb-2">🍽️</div>
          <h3 className="text-lg font-medium text-stone-900">Không tìm thấy món ăn</h3>
          <p className="text-stone-500">Thử tìm kiếm với từ khóa khác xem sao!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <MenuCard 
              key={item._id} 
              item={item} 
              onAddToCart={addItem} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuPage;
