import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MenuService } from '../../services/menu.service';
import { TableService } from '../../services/table.service';
import { useCartStore } from '../../store/cartStore';
import MenuCard from '../../components/menu/MenuCard';
import { Search, Loader2, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'khai_vi', label: 'Khai vị' },
  { id: 'chinh', label: 'Món chính' },
  { id: 'trang_mieng', label: 'Tráng miệng' },
  { id: 'nuoc', label: 'Thức uống' }
];

const MenuPage = () => {
  useDocumentTitle('Thực Đơn');
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addItem, setTable } = useCartStore();

  useEffect(() => {
    const syncTable = async () => {
      if (tableNumber) {
        try {
          const res = await TableService.getAll();
          if (res.success && res.data) {
            const matchedTable = res.data.find(t => t.tableNumber === parseInt(tableNumber));
            if (matchedTable) {
              setTable(matchedTable._id);
              toast.success(`Đã nhận bàn số ${tableNumber}`);
            } else {
              toast.error(`Không tìm thấy bàn số ${tableNumber}`);
            }
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra bàn quét QR:', err);
        }
      }
    };
    syncTable();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-6 border-b border-stone-800/60 relative">
        <div className="text-left w-full md:w-auto">
          <h1 className="text-4xl font-display font-bold text-[#d4a85a] tracking-[0.2em] uppercase flex items-center gap-3">
            <Utensils className="w-8 h-8 text-[#d4a85a]" />
            THỰC ĐƠN
          </h1>
          <p className="text-[#d4c3a3] mt-2 font-medium text-sm max-w-xl">
            {tableNumber 
              ? `Quý khách đang chọn món trực tiếp tại Bàn số ${tableNumber}` 
              : 'Khám phá hương vị đặc trưng được chuẩn bị chu đáo bởi đội ngũ đầu bếp.'}
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn ngon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[#251b0f] border border-stone-800 text-[#f5e6c8] placeholder-stone-500 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#d4a85a]/25 focus:border-[#d4a85a] transition-all font-semibold"
          />
          <Search className="absolute left-4 top-4 text-[#d4a85a]/70 w-5 h-5" />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
              activeCategory === cat.id
                ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-md shadow-[#d4a85a]/20 scale-105'
                : 'bg-[#251b0f] border-stone-800 text-[#d4c3a3] hover:bg-[#332514] hover:text-[#f5e6c8]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-[#d4a85a]" />
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-20 bg-[#251b0f] rounded-3xl border border-stone-800/80 border-dashed max-w-xl mx-auto">
          <div className="text-4xl mb-4">🍲</div>
          <h3 className="text-lg font-bold text-[#f5e6c8]">Không tìm thấy món ăn nào</h3>
          <p className="text-[#d4c3a3] text-sm mt-1">Quý khách vui lòng thử tìm kiếm bằng từ khóa khác!</p>
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
