import { useState, useEffect } from 'react';
import { ReservationService } from '../../services/reservation.service';
import { TableService } from '../../services/table.service';
import { MenuService } from '../../services/menu.service';
import { useCartStore } from '../../store/cartStore';
import {
  Calendar, Clock, Users, FileText, CheckCircle, Loader2,
  MapPin, Sparkles, ChevronRight, ChevronLeft, Star, Eye, TreePine, Wind, LayoutGrid, Search, Utensils, X, Info,
  Cake, Heart, Flower2, Gift, Flame, Baby, Accessibility, VolumeX
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

// ─── Dữ liệu khu vực ngồi ──────────────────────────────────────────────────
const AREAS = [
  {
    id: 'window',
    label: 'View Cửa Sổ',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
    capacity: '2–4 khách',
  },
  {
    id: 'garden',
    label: 'Sân Vườn Ngoài Trời',
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=600&auto=format&fit=crop',
    capacity: '4–8 khách',
  },
  {
    id: 'vip',
    label: 'Phòng VIP Riêng Tư',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    capacity: '6–12 khách',
  },
  {
    id: 'main',
    label: 'Sảnh Chính Ấm Cúng',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop',
    capacity: '2–10 khách',
  },
];

// ─── Yêu cầu đặc biệt ──────────────────────────────────────────────────────
const SPECIAL_REQUESTS = [
  { id: 'birthday', label: 'Tiệc Sinh Nhật', icon: Cake },
  { id: 'anniversary', label: 'Kỷ Niệm Ngày Cưới', icon: Heart },
  { id: 'decoration', label: 'Trang Trí Bàn Hoa', icon: Flower2 },
  { id: 'cake', label: 'Bánh Kem Nhà Làm', icon: Gift },
  { id: 'candle', label: 'Nến & Ánh Sáng Ấm', icon: Flame },
  { id: 'kids', label: 'Ghế Ngồi Trẻ Em', icon: Baby },
  { id: 'wheelchair', label: 'Lối Đi Xe Lăn', icon: Accessibility },
  { id: 'quiet', label: 'Bàn Góc Yên Tĩnh', icon: VolumeX },
];

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả Món' },
  { id: 'khai_vi', label: 'Món Khai Vị' },
  { id: 'chinh', label: 'Món Chính' },
  { id: 'trang_mieng', label: 'Tráng Miệng' },
  { id: 'nuoc', label: 'Thức Uống' }
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
const StepIndicator = ({ step, currentStep, label }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base transition-all duration-500 border-2 ${
        isCompleted
          ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-md shadow-[#d4a85a]/25 scale-105'
          : isActive
          ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] ring-4 ring-[#d4a85a]/20 shadow-lg scale-105'
          : 'bg-[#251b0f] border-stone-800 text-[#d4c3a3] hover:border-stone-500'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
        isActive ? 'text-[#f5e6c8]' : isCompleted ? 'text-[#b8922a]' : 'text-stone-500'
      }`}>
        {label}
      </span>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const ReservationPage = () => {
  useDocumentTitle('Đặt Bàn Trực Tuyến');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState('window');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    note: '',
    tableId: null
  });

  // Table & Menu states
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  // Pre-order states
  const [preOrderItems, setPreOrderItems] = useState({});
  const [menuSearch, setMenuSearch] = useState('');
  const [menuActiveCategory, setMenuActiveCategory] = useState('all');

  useEffect(() => {
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const res = await TableService.getAll();
        if (res.success) {
          setTables(res.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTables(false);
      }
    };

    const fetchMenu = async () => {
      setLoadingMenu(true);
      try {
        const res = await MenuService.getAll();
        if (res.success) {
          setMenuItems(res.data.filter(item => item.isAvailable) || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchTables();
    fetchMenu();
  }, []);

  const toggleRequest = (id) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const updatePreOrderQty = (item, qty) => {
    setPreOrderItems(prev => {
      const updated = { ...prev };
      const currentQty = updated[item._id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + qty);
      if (newQty === 0) {
        delete updated[item._id];
      } else {
        updated[item._id] = { menuItem: item, quantity: newQty };
      }
      return updated;
    });
  };

  const getPreOrderTotal = () => {
    return Object.values(preOrderItems).reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  };

  const buildNote = () => {
    const parts = [];
    if (selectedArea) {
      const area = AREAS.find(a => a.id === selectedArea);
      parts.push(`Khu vực: ${area?.label}`);
    }
    if (selectedRequests.length > 0) {
      const labels = selectedRequests.map(id =>
        SPECIAL_REQUESTS.find(r => r.id === id)?.label
      ).filter(Boolean);
      parts.push(`Yêu cầu đặc biệt: ${labels.join(', ')}`);
    }
    if (formData.note) parts.push(formData.note);
    return parts.join(' | ');
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.reservationDate || !formData.reservationTime) {
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
    const now = new Date();
    if (reservationDateTime < now) {
      return toast.error('Thời gian đặt bàn không thể ở quá khứ!');
    }

    setIsSubmitting(true);
    try {
      // Chuẩn bị payload món ăn đặt trước
      const itemsPayload = Object.values(preOrderItems).map(i => ({
        menuItem: i.menuItem._id,
        quantity: i.quantity,
        price: i.menuItem.price
      }));

      await ReservationService.create({
        ...formData,
        table: formData.tableId,
        note: buildNote(),
        items: itemsPayload
      });

      setIsSuccess(true);
      toast.success('Đặt bàn và đặt món thành công!');
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra khi gửi đơn đặt bàn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc danh sách món ăn hiển thị ở Step 2
  const filteredMenuItems = menuItems.filter(item => {
    const matchCat = menuActiveCategory === 'all' || item.category === menuActiveCategory;
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                        item.description?.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 animate-fade-in-up text-center bg-[#251b0f] rounded-3xl border border-stone-850 shadow-2xl shadow-stone-950/50 mt-8">
        <div className="w-24 h-24 bg-[#1a1208] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#d4a85a]/20">
          <CheckCircle className="w-12 h-12 text-[#d4a85a]" />
        </div>
        <h1 className="text-4xl font-display font-bold text-[#d4a85a] mb-4 tracking-tight">Đặt Bàn Thành Công!</h1>
        <p className="text-[#f5e6c8] mb-2 text-lg font-medium">
          Cảm ơn quý khách <b className="text-white font-bold">{formData.customerName}</b> đã tin tưởng nhà hàng.
        </p>
        <p className="text-[#d4c3a3] mb-8 text-sm max-w-md mx-auto leading-relaxed">
          Đội ngũ phục vụ sẽ liên hệ trực tiếp qua số điện thoại <b className="text-white font-bold">{formData.customerPhone}</b> để xác nhận và đón tiếp quý khách.
        </p>

        {/* Summary card */}
        <div className="bg-[#1a1208] rounded-2xl p-6 text-left space-y-4 mb-8 border border-stone-850 shadow-sm">
          <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-2">Chi tiết đặt hẹn</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-[#d4c3a3] font-medium">Ngày đến:</span>
            <span className="font-bold text-white text-right">{new Date(formData.reservationDate).toLocaleDateString('vi-VN')}</span>
            
            <span className="text-[#d4c3a3] font-medium">Giờ đến:</span>
            <span className="font-bold text-white text-right">{formData.reservationTime}</span>
            
            <span className="text-[#d4c3a3] font-medium">Số lượng khách:</span>
            <span className="font-bold text-white text-right">{formData.partySize} người</span>
            
            {selectedArea && (
              <>
                <span className="text-[#d4c3a3] font-medium">Khu vực:</span>
                <span className="font-bold text-white text-right">{AREAS.find(a => a.id === selectedArea)?.label}</span>
              </>
            )}
            
            {formData.tableId && (
              <>
                <span className="text-[#d4c3a3] font-medium">Bàn ăn:</span>
                <span className="font-bold text-white text-right">Bàn số {tables.find(t => t._id === formData.tableId)?.tableNumber}</span>
              </>
            )}
          </div>

          {/* Món ăn pre-order */}
          {Object.values(preOrderItems).length > 0 && (
            <div className="pt-4 border-t border-stone-850">
              <h4 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] mb-2">Thực đơn đặt trước</h4>
              <div className="space-y-2">
                {Object.values(preOrderItems).map(i => (
                  <div key={i.menuItem._id} className="flex justify-between text-sm">
                    <span className="text-[#d4c3a3] font-medium">{i.menuItem.name} <span className="text-[#d4a85a] font-bold ml-1">x{i.quantity}</span></span>
                    <span className="font-bold text-white">{(i.menuItem.price * i.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-stone-800 font-bold">
                  <span className="text-white">Tổng cộng món đặt:</span>
                  <span className="text-[#d4a85a]">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="px-8 py-4 bg-[#d4a85a] text-[#1a1208] hover:bg-[#c2984a] rounded-xl font-bold transition-all shadow-lg shadow-amber-500/10 active:scale-95 text-sm uppercase tracking-widest"
        >
          Trở về Trang Chủ
        </button>
      </div>
    );
  }

  const steps = [
    { step: 1, label: 'Bàn & Vị trí' },
    { step: 2, label: 'Đặt món trước' },
    { step: 3, label: 'Thông tin hẹn' },
    { step: 4, label: 'Xác nhận đơn' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in text-[#f5e6c8]">
      {/* Glow ambient background elements for depth */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#d4a85a]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-stone-900/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12 relative">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[#d4a85a] mb-3 tracking-[0.15em] uppercase">
          ĐẶT BÀN TRỰC TUYẾN
        </h1>
        <p className="text-[#d4c3a3] max-w-xl mx-auto font-medium text-base">
          Quý khách vui lòng chọn thời gian và vị trí ngồi mong muốn để chúng tôi chuẩn bị đón tiếp chu đáo nhất.
        </p>
        <div className="w-16 h-1 bg-[#d4a85a] mx-auto mt-4 rounded-full" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12 bg-[#251b0f]/60 p-6 rounded-2xl border border-stone-800/50 backdrop-blur-sm shadow-sm max-w-3xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-2">
            <StepIndicator step={s.step} currentStep={currentStep} label={s.label} />
            {i < steps.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mt-[-24px] transition-all duration-700 ${
                currentStep > s.step ? 'bg-[#d4a85a]' : 'bg-stone-850'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-[#251b0f] rounded-3xl p-6 md:p-10 shadow-2xl shadow-stone-950/40 border border-stone-800/80 relative">

        {/* ── STEP 1: Sơ đồ vị trí & chọn bàn ăn ── */}
        {currentStep === 1 && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1 tracking-[0.05em]">Lựa chọn khu vực & Vị trí ngồi</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">Bấm chọn một khu vực thích hợp để hiển thị sơ đồ bàn ăn chi tiết.</p>
            </div>

            {/* Chọn khu vực */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedArea(area.id)}
                  className={`flex flex-col rounded-3xl overflow-hidden border-2 text-left transition-all duration-300 relative group aspect-[4/3] ${
                    selectedArea === area.id
                      ? 'border-[#d4a85a] shadow-lg shadow-[#d4a85a]/10 scale-[1.02]'
                      : 'border-stone-800/80 hover:border-[#d4a85a]/55 hover:shadow-md'
                  }`}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 bg-stone-950">
                    <img 
                      src={area.image} 
                      alt={area.label} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  {/* Content overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 z-20 flex flex-col justify-end h-full">
                    <div className={`font-display font-bold text-lg mb-1 tracking-wide ${selectedArea === area.id ? 'text-[#d4a85a]' : 'text-[#f5e6c8]'}`}>
                      {area.label}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#d4c3a3]">
                      Sức chứa: {area.capacity}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedArea === area.id && (
                    <div className="absolute top-3 right-3 z-20 bg-[#d4a85a] text-[#1a1208] p-1 rounded-full shadow border border-[#d4a85a]">
                      <CheckCircle className="w-4 h-4 text-inherit" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Chọn bàn cụ thể (hiện khi đã chọn khu vực) */}
            {selectedArea ? (
              <div className="mb-10 animate-fade-in-up p-6 bg-[#1a1208] rounded-2xl border border-stone-850">
                <label className="text-base font-bold text-[#f5e6c8] mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#d4a85a]" /> Chọn số bàn ngồi <span className="text-[#d4c3a3] font-medium text-xs">(Không bắt buộc, có thể chọn sau)</span>
                </label>
                
                {loadingTables ? (
                   <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#d4a85a]" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {tables.filter(t => t.area === selectedArea).map(table => (
                       <button
                         key={table._id}
                         type="button"
                         disabled={table.status === 'dong'}
                         onClick={() => setFormData({ ...formData, tableId: table._id })}
                         className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative ${
                            formData.tableId === table._id
                              ? 'border-[#d4a85a] bg-[#d4a85a] text-[#1a1208] shadow-lg shadow-[#d4a85a]/20 scale-105 font-bold z-10'
                              : table.status === 'trong' 
                              ? 'border-stone-800 bg-[#251b0f] hover:border-[#d4a85a] hover:shadow-md hover:shadow-amber-500/5 text-[#f5e6c8] font-bold'
                              : 'border-stone-900 bg-stone-950 text-stone-600 opacity-30 cursor-not-allowed'
                         }`}
                       >
                         <span className="font-black text-xl">{table.tableNumber}</span>
                         <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-1.5 px-1.5 py-0.5 rounded ${
                           formData.tableId === table._id
                             ? 'bg-[#1a1208] text-[#d4a85a]'
                             : table.status === 'trong'
                             ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'
                             : 'bg-stone-900 text-stone-500'
                         }`}>
                           {table.status === 'trong' ? 'Trống' : table.status === 'dong' ? 'Đóng' : 'Đang bận'}
                         </span>
                       </button>
                    ))}
                    {tables.filter(t => t.area === selectedArea).length === 0 && (
                      <div className="col-span-full py-6 text-center text-[#d4c3a3] font-medium text-sm">
                        Khu vực này hiện chưa được mở bàn. Vui lòng chọn khu vực khác!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-3xl text-center bg-[#1a1208] text-[#d4c3a3] border border-stone-850/60 mb-10 flex flex-col items-center justify-center gap-3">
                <LayoutGrid className="w-8 h-8 text-[#d4a85a]/40 animate-pulse" />
                <span className="text-sm font-semibold">Quý khách vui lòng chọn khu vực phía trên để hiển thị sơ đồ bàn ăn chi tiết.</span>
              </div>
            )}

            {/* Yêu cầu đặc biệt */}
            <div className="p-6 bg-[#1a1208] rounded-2xl border border-stone-850">
              <label className="text-base font-bold text-[#f5e6c8] mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#d4a85a]" /> Thiết lập yêu cầu đặc biệt <span className="text-[#d4c3a3] font-medium text-xs">(Không bắt buộc)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SPECIAL_REQUESTS.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => toggleRequest(req.id)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 text-sm font-bold ${
                      selectedRequests.includes(req.id)
                        ? 'border-[#d4a85a] bg-amber-950/30 text-[#d4a85a] shadow-sm'
                        : 'border-stone-800 bg-[#251b0f] text-[#d4c3a3] hover:border-[#d4a85a]/40 hover:bg-[#332514]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${
                      selectedRequests.includes(req.id) ? 'bg-[#d4a85a]/15 text-[#d4a85a]' : 'bg-[#1a1208] text-stone-500 group-hover:text-[#d4a85a]/75'
                    }`}>
                      <req.icon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <span>{req.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Đặt món ăn trước (Pre-order Menu) ── */}
        {currentStep === 2 && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1 tracking-[0.05em]">Thực đơn đặt trước (Tùy chọn)</h2>
                <p className="text-[#d4c3a3] text-sm font-medium">Quý khách có thể chọn trước món ăn để chúng tôi phục vụ nhanh chóng hơn khi đến bàn.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/40 text-[#d4a85a] rounded-xl border border-[#d4a85a]/20 font-bold text-sm">
                <Utensils className="w-4 h-4" />
                <span>Tạm tính: {getPreOrderTotal().toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cột chính: Danh sách món ăn */}
              <div className="lg:col-span-2 space-y-6">
                {/* Thanh tìm kiếm & Danh mục */}
                <div className="space-y-4 mb-6">
                  {/* Dòng 1: Thanh tìm kiếm full width */}
                  <div className="relative w-full">
                    <Search className="w-5 h-5 text-[#d4a85a]/60 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Tìm món ăn ngon..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a85a]/25 focus:border-[#d4a85a] font-semibold"
                    />
                  </div>
                  {/* Dòng 2: Danh mục cuộn ngang ẩn scrollbar */}
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 max-w-full">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMenuActiveCategory(c.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                          menuActiveCategory === c.id
                            ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-sm'
                            : 'bg-[#1a1208] border-stone-850 text-[#d4c3a3] hover:border-stone-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid món ăn */}
                {loadingMenu ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d4a85a]" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredMenuItems.map(item => {
                      const qty = preOrderItems[item._id]?.quantity || 0;
                      return (
                        <div key={item._id} className="border border-stone-850 rounded-2xl p-4 flex gap-4 transition-all hover:shadow-md hover:border-amber-500/20 bg-[#1a1208]">
                          <img
                            src={item.image?.startsWith('http') ? item.image : `http://localhost:3000${item.image}`}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-xl bg-stone-900 flex-shrink-0 border border-stone-800"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-[#f5e6c8] text-sm leading-snug">{item.name}</h4>
                              <p className="text-[10px] text-[#d4c3a3] font-medium line-clamp-1 mt-0.5">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-bold text-[#d4a85a] text-sm">{item.price.toLocaleString('vi-VN')}đ</span>
                              
                              <div className="flex items-center gap-2 border border-stone-800 rounded-lg p-1 bg-[#251b0f]">
                                {qty > 0 ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updatePreOrderQty(item, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-[#1a1208] hover:bg-stone-850 text-[#f5e6c8] rounded"
                                    >−</button>
                                    <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => updatePreOrderQty(item, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded"
                                    >+</button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updatePreOrderQty(item, 1)}
                                    className="px-2.5 py-1 bg-[#d4a85a] text-[#1a1208] hover:bg-[#c2984a] text-xs font-bold rounded-md"
                                  >
                                    + Chọn món
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMenuItems.length === 0 && (
                      <div className="col-span-full py-16 text-center text-[#d4c3a3] font-medium text-sm bg-[#1a1208] rounded-2xl border border-dashed border-stone-800">
                        Không tìm thấy món ăn nào phù hợp!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cột phụ: Khay món đã chọn */}
              <div className="bg-[#1a1208] border border-stone-850 rounded-3xl p-6 flex flex-col max-h-[50vh] shadow-inner">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#d4a85a] border-b border-stone-800 pb-3 mb-4 flex items-center justify-between">
                  <span>Món đặt trước ({Object.values(preOrderItems).reduce((sum, i) => sum + i.quantity, 0)})</span>
                  {Object.values(preOrderItems).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreOrderItems({})}
                      className="text-[10px] text-rose-500 underline font-bold capitalize"
                    >Xóa hết</button>
                  )}
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {Object.values(preOrderItems).map(i => (
                    <div key={i.menuItem._id} className="flex justify-between items-center gap-3 bg-[#251b0f] p-3 rounded-xl border border-stone-800/80 shadow-sm animate-fade-in-up">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#f5e6c8] leading-snug">{i.menuItem.name}</div>
                        <div className="text-[10px] text-[#d4a85a] font-bold mt-0.5">{i.menuItem.price.toLocaleString('vi-VN')}đ</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updatePreOrderQty(i.menuItem, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#1a1208] hover:bg-stone-850 text-[#f5e6c8] rounded border border-stone-800"
                        >−</button>
                        <span className="text-xs font-bold text-white w-4 text-center">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updatePreOrderQty(i.menuItem, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#d4a85a] text-[#1a1208] rounded"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  {Object.values(preOrderItems).length === 0 && (
                    <div className="text-center py-16 text-stone-500 font-bold text-xs flex flex-col items-center gap-2">
                      <span className="text-3xl">🍲</span>
                      <span>Chưa chọn món nào đặt trước.</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-800 pt-4 mt-4 font-bold text-sm text-[#f5e6c8]">
                  <div className="flex justify-between">
                    <span>Tổng tiền món:</span>
                    <span className="text-[#d4a85a] text-base">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="text-[10px] text-[#d4c3a3]/70 font-medium mt-1 leading-normal italic">
                    * Khoản tiền pre-order sẽ được cộng vào hóa đơn thanh toán cuối cùng của quý khách tại nhà hàng.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Nhập thông tin liên hệ & Đặt lịch ── */}
        {currentStep === 3 && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1 tracking-[0.05em]">Chi tiết thông tin đặt hẹn</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">Vui lòng điền thông tin người liên hệ và thời gian để nhà hàng giữ bàn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#1a1208] rounded-3xl border border-stone-850">
              {/* Họ tên */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3]">Họ và tên người đặt <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold text-white transition-all bg-[#251b0f]"
                />
              </div>

              {/* SĐT */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3]">Số điện thoại liên hệ <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0987654321"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold text-white transition-all bg-[#251b0f]"
                />
              </div>

              {/* Ngày */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#d4a85a]" /> Ngày đến nhận bàn <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={getTodayDateString()}
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold text-white transition-all bg-[#251b0f]"
                />
              </div>

              {/* Giờ */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d4a85a]" /> Giờ đến nhận bàn <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold text-white transition-all bg-[#251b0f]"
                />
              </div>

              {/* Số người */}
              <div className="space-y-3 md:col-span-2 bg-[#251b0f] p-5 rounded-2xl border border-stone-800 shadow-sm">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#d4a85a]" /> Số lượng khách đi cùng
                </label>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, partySize: Math.max(1, f.partySize - 1) }))}
                    className="w-12 h-12 rounded-xl border border-stone-800 flex items-center justify-center font-bold text-2xl text-[#f5e6c8] hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all bg-[#1a1208]"
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-display font-black text-white">{formData.partySize}</span>
                    <span className="text-[#d4c3a3] font-bold ml-2">người</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, partySize: Math.min(20, f.partySize + 1) }))}
                    className="w-12 h-12 rounded-xl border border-stone-800 flex items-center justify-center font-bold text-2xl text-[#f5e6c8] hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all bg-[#1a1208]"
                  >+</button>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#d4a85a]" /> Ghi chú yêu cầu thêm <span className="text-stone-500 font-normal">(Không bắt buộc)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Cần chuẩn bị ghế trẻ em, dị ứng hành tỏi, món ăn ít cay..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold text-white transition-all bg-[#251b0f] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Xác nhận hóa đơn ── */}
        {currentStep === 4 && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1 tracking-[0.05em]">Xác nhận thông tin đặt bàn & món</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">Kiểm tra lại toàn bộ thông tin trước khi hoàn tất đặt hẹn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Cột trái: Thông tin khách hàng */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[#1a1208] rounded-3xl p-6 border border-stone-850 space-y-4 shadow-sm">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Thông tin liên hệ</span>
                  </h3>
                  
                  <div className="divide-y divide-stone-800/60">
                    {[
                      { label: 'Họ và tên', value: formData.customerName },
                      { label: 'Số điện thoại', value: formData.customerPhone },
                      { label: 'Ngày nhận bàn', value: new Date(formData.reservationDate).toLocaleDateString('vi-VN') },
                      { label: 'Giờ nhận bàn', value: formData.reservationTime },
                      { label: 'Số lượng khách', value: `${formData.partySize} khách` },
                      { label: 'Khu vực ngồi', value: selectedArea ? AREAS.find(a => a.id === selectedArea)?.label : 'Tùy chọn' },
                      {
                        label: 'Bàn ăn được chọn',
                        value: formData.tableId ? `Bàn số ${tables.find(t => t._id === formData.tableId)?.tableNumber}` : 'Nhà hàng xếp bàn sau'
                      },
                      {
                        label: 'Yêu cầu đặc biệt',
                        value: selectedRequests.length > 0
                          ? selectedRequests.map(id => SPECIAL_REQUESTS.find(r => r.id === id)?.label).join(', ')
                          : 'Không có'
                      },
                      ...(formData.note ? [{ label: 'Ghi chú thêm', value: formData.note }] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-start py-3.5">
                        <span className="text-sm text-[#d4c3a3] font-bold shrink-0 w-36">{row.label}</span>
                        <span className="text-sm font-black text-white text-right">{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cột phải: Hóa đơn đặt trước món */}
              <div className="bg-[#1a1208] text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-stone-950/20 border border-stone-850">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-3 mb-4">
                    Hóa đơn đặt trước
                  </h3>

                  <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                    {Object.values(preOrderItems).map(i => (
                      <div key={i.menuItem._id} className="flex justify-between items-start text-xs">
                        <span className="text-stone-300 font-semibold leading-relaxed w-2/3">{i.menuItem.name} <span className="text-[#d4a85a] font-black ml-1">x{i.quantity}</span></span>
                        <span className="font-bold text-stone-100">{(i.menuItem.price * i.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                    {Object.values(preOrderItems).length === 0 && (
                      <div className="text-center py-10 text-stone-400 font-semibold text-xs flex flex-col items-center gap-1">
                        <span>Chưa đăng ký đặt món trước.</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-stone-800 pt-5 mt-6 font-bold space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400 font-semibold">Phí giữ bàn & dịch vụ:</span>
                    <span className="text-[#d4a85a] font-extrabold uppercase">Miễn phí</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400 font-semibold">Tiền món ăn đặt trước:</span>
                    <span className="text-stone-100">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-3 border-t border-dashed border-stone-800">
                    <span className="text-white">Tổng tạm tính:</span>
                    <span className="text-[#d4a85a] text-base">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed mt-4 italic">
                    * Quý khách sẽ thanh toán hóa đơn thực tế sau khi hoàn tất dùng bữa tại nhà hàng.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-950/20 rounded-2xl border border-[#d4a85a]/20 text-[#d4c3a3] font-bold text-xs leading-normal flex items-start gap-2">
              <span className="text-base mt-[-2px]">⚠️</span>
              <span>Lưu ý: Quý khách vui lòng đến nhận bàn đúng giờ hẹn. Đơn đặt bàn sẽ tự động bị hủy sau 15 phút nếu quý khách không có mặt hoặc không liên hệ thông báo thay đổi.</span>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex justify-between mt-10 pt-6 border-t border-stone-800/80">
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-stone-800 text-[#d4c3a3] font-bold hover:border-stone-600 hover:bg-[#1a1208] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-wider bg-[#251b0f]"
          >
            <ChevronLeft className="w-4.5 h-4.5" /> Quay lại
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 3) {
                  if (!formData.customerName || !formData.customerPhone || !formData.reservationDate || !formData.reservationTime) {
                    return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                  }
                  const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
                  const now = new Date();
                  if (reservationDateTime < now) {
                    return toast.error('Thời gian đặt bàn không thể ở quá khứ!');
                  }
                }
                setCurrentStep(s => Math.min(4, s + 1));
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-amber-500/10 text-xs uppercase tracking-wider"
            >
              Tiếp theo <ChevronRight className="w-4.5 h-4.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#d4a85a]/20 disabled:opacity-70 text-xs uppercase tracking-wider"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Xác nhận đặt bàn</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
