import { useState, useEffect, useCallback } from 'react';
import { ReservationService } from '../../services/reservation.service';
import { TableService } from '../../services/table.service';
import { MenuService } from '../../services/menu.service';
import {
  Calendar, Clock, Users, FileText, CheckCircle, Loader2,
  MapPin, Sparkles, ChevronRight, ChevronLeft, Search, Utensils, X, Info,
  Cake, Heart, Flower2, Gift, Flame, Baby, Accessibility, VolumeX, LayoutGrid, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useCartStore } from '../../store/cartStore';

// ─── Dữ liệu khu vực ngồi ──────────────────────────────────────────────────
const AREAS = [
  { id: 'window', label: 'View Cửa Sổ', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop', capacity: '2–4 khách' },
  { id: 'garden', label: 'Sân Vườn Ngoài Trời', image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=600&auto=format&fit=crop', capacity: '4–8 khách' },
  { id: 'vip', label: 'Phòng VIP Riêng Tư', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', capacity: '6–12 khách' },
  { id: 'main', label: 'Sảnh Chính Ấm Cúng', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop', capacity: '2–10 khách' },
];

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
  { id: 'khai_vi', label: 'Khai Vị' },
  { id: 'chinh', label: 'Món Chính' },
  { id: 'trang_mieng', label: 'Tráng Miệng' },
  { id: 'nuoc', label: 'Thức Uống' }
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
const StepIndicator = ({ step, currentStep, label }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base transition-all duration-500 border-2 ${
        isCompleted
          ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-md shadow-[#d4a85a]/25 scale-105'
          : isActive
          ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] ring-4 ring-[#d4a85a]/20 shadow-lg scale-105'
          : 'bg-[#251b0f] border-stone-700 text-stone-500'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 hidden sm:block ${
        isActive ? 'text-[#f5e6c8]' : isCompleted ? 'text-[#b8922a]' : 'text-stone-600'
      }`}>{label}</span>
    </div>
  );
};

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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

  // Table states — load khi chuyển sang Step 2 (có date + time)
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Menu states
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuActiveCategory, setMenuActiveCategory] = useState('all');

  // Pre-order states
  const [preOrderItems, setPreOrderItems] = useState(() => {
    const cartItems = useCartStore.getState().items;
    const initialItems = {};
    cartItems.forEach(item => {
      if (initialItems[item.menuItem._id]) {
        initialItems[item.menuItem._id].quantity += item.quantity;
      } else {
        initialItems[item.menuItem._id] = { menuItem: item.menuItem, quantity: item.quantity };
      }
    });
    return initialItems;
  });

  // Tải menu 1 lần
  useEffect(() => {
    const fetchMenu = async () => {
      setLoadingMenu(true);
      try {
        const res = await MenuService.getAll();
        if (res.success) setMenuItems(res.data.filter(item => item.isAvailable) || []);
      } catch (_) {}
      finally { setLoadingMenu(false); }
    };
    fetchMenu();
  }, []);

  // Tải availability bàn khi chuyển qua Step 2
  const loadTableAvailability = useCallback(async () => {
    if (!formData.reservationDate || !formData.reservationTime) return;
    setLoadingTables(true);
    setFormData(f => ({ ...f, tableId: null })); // Reset bàn đã chọn cũ
    try {
      const res = await TableService.checkAvailability(formData.reservationDate, formData.reservationTime);
      if (res.success) setTables(res.data || []);
    } catch (_) {
      toast.error('Không thể tải tình trạng bàn, vui lòng thử lại');
    } finally {
      setLoadingTables(false);
    }
  }, [formData.reservationDate, formData.reservationTime]);

  const toggleRequest = (id) => {
    setSelectedRequests(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const updatePreOrderQty = (item, qty) => {
    setPreOrderItems(prev => {
      const updated = { ...prev };
      const currentQty = updated[item._id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + qty);
      if (newQty === 0) delete updated[item._id];
      else updated[item._id] = { menuItem: item, quantity: newQty };
      return updated;
    });
  };

  const getPreOrderTotal = () =>
    Object.values(preOrderItems).reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  const buildNote = () => {
    const parts = [];
    const area = AREAS.find(a => a.id === selectedArea);
    if (area) parts.push(`Khu vực: ${area.label}`);
    if (selectedRequests.length > 0) {
      const labels = selectedRequests.map(id => SPECIAL_REQUESTS.find(r => r.id === id)?.label).filter(Boolean);
      parts.push(`Yêu cầu đặc biệt: ${labels.join(', ')}`);
    }
    if (formData.note) parts.push(formData.note);
    return parts.join(' | ');
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.reservationDate || !formData.reservationTime) {
        return toast.error('Vui lòng chọn ngày và giờ đến');
      }
      const dt = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
      if (dt < new Date()) return toast.error('Thời gian đặt bàn không thể ở quá khứ!');
      // Chuyển sang Step 2 và tải dữ liệu bàn
      setCurrentStep(2);
      await loadTableAvailability();
      return;
    }
    if (currentStep === 2) {
      if (!formData.tableId) return toast.error('Vui lòng chọn bàn ngồi trước khi tiếp tục');
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      if (!formData.customerName || !formData.customerPhone) {
        return toast.error('Vui lòng điền đầy đủ họ tên và số điện thoại');
      }
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
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
      useCartStore.getState().clearCart();
      setIsSuccess(true);
      toast.success('Đặt bàn thành công!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn đặt bàn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchCat = menuActiveCategory === 'all' || item.category === menuActiveCategory;
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    const selectedTable = tables.find(t => t._id === formData.tableId);
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 animate-fade-in-up text-center bg-[#251b0f] rounded-3xl border border-stone-800 shadow-2xl shadow-stone-950/50 mt-8">
        <div className="w-24 h-24 bg-[#1a1208] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#d4a85a]/20">
          <CheckCircle className="w-12 h-12 text-[#d4a85a]" />
        </div>
        <h1 className="text-4xl font-display font-bold text-[#d4a85a] mb-4 tracking-tight">Đặt Bàn Thành Công!</h1>
        <p className="text-[#f5e6c8] mb-2 text-lg font-medium">
          Cảm ơn quý khách <b className="text-white">{formData.customerName}</b> đã tin tưởng nhà hàng.
        </p>
        <p className="text-[#d4c3a3] mb-8 text-sm max-w-md mx-auto leading-relaxed">
          Đội ngũ phục vụ sẽ liên hệ qua <b className="text-white">{formData.customerPhone}</b> để xác nhận và đón tiếp quý khách.
        </p>
        <div className="bg-[#1a1208] rounded-2xl p-6 text-left space-y-3 mb-8 border border-stone-800">
          <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-3">Chi tiết đặt hẹn</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-[#d4c3a3]">Ngày đến:</span>
            <span className="font-bold text-white text-right">{new Date(formData.reservationDate).toLocaleDateString('vi-VN')}</span>
            <span className="text-[#d4c3a3]">Giờ đến:</span>
            <span className="font-bold text-white text-right">{formData.reservationTime}</span>
            <span className="text-[#d4c3a3]">Số khách:</span>
            <span className="font-bold text-white text-right">{formData.partySize} người</span>
            {selectedTable && (<>
              <span className="text-[#d4c3a3]">Bàn ăn:</span>
              <span className="font-bold text-white text-right">Bàn số {selectedTable.tableNumber} — {AREAS.find(a => a.id === selectedArea)?.label}</span>
            </>)}
          </div>
          {Object.values(preOrderItems).length > 0 && (
            <div className="pt-4 border-t border-stone-800 mt-3">
              <h4 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] mb-2">Thực đơn đặt trước</h4>
              {Object.values(preOrderItems).map(i => (
                <div key={i.menuItem._id} className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#d4c3a3]">{i.menuItem.name} <span className="text-[#d4a85a] font-bold">x{i.quantity}</span></span>
                  <span className="font-bold text-white">{(i.menuItem.price * i.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-dashed border-stone-800 font-bold mt-1.5">
                <span className="text-white">Tổng món đặt:</span>
                <span className="text-[#d4a85a]">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-[#d4a85a] text-[#1a1208] hover:bg-[#c2984a] rounded-xl font-bold transition-all shadow-lg active:scale-95 text-sm uppercase tracking-widest">
          Trở về Trang Chủ
        </button>
      </div>
    );
  }

  const steps = [
    { step: 1, label: 'Thời gian' },
    { step: 2, label: 'Chọn bàn' },
    { step: 3, label: 'Đặt món' },
    { step: 4, label: 'Xác nhận' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in text-[#f5e6c8]">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#d4a85a]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[#d4a85a] mb-3 tracking-[0.15em] uppercase">ĐẶT BÀN TRỰC TUYẾN</h1>
        <p className="text-[#d4c3a3] max-w-xl mx-auto font-medium text-base">
          Quý khách vui lòng chọn thời gian và vị trí ngồi mong muốn để chúng tôi chuẩn bị đón tiếp chu đáo nhất.
        </p>
        <div className="w-16 h-1 bg-[#d4a85a] mx-auto mt-4 rounded-full" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-12 bg-[#251b0f]/60 p-5 rounded-2xl border border-stone-800/50 backdrop-blur-sm max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-1 sm:gap-2">
            <StepIndicator step={s.step} currentStep={currentStep} label={s.label} />
            {i < steps.length - 1 && (
              <div className={`w-6 sm:w-14 h-0.5 mb-5 transition-all duration-700 ${currentStep > s.step ? 'bg-[#d4a85a]' : 'bg-stone-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-[#251b0f] rounded-3xl p-6 md:p-10 shadow-2xl shadow-stone-950/40 border border-stone-800/80">

        {/* ══════════════════ STEP 1: Thời gian & Số khách ══════════════════ */}
        {currentStep === 1 && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1">Chọn thời gian & Số lượng khách</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">Điền thông tin thời gian để hệ thống kiểm tra bàn trống phù hợp cho bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#1a1208] rounded-3xl border border-stone-800 mb-8">
              {/* Ngày */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#d4a85a]" /> Ngày đến nhận bàn <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  min={getTodayDateString()}
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-[#251b0f] text-white focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold transition-all"
                />
              </div>

              {/* Giờ */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d4a85a]" /> Giờ đến nhận bàn <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-[#251b0f] text-white focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold transition-all"
                />
              </div>

              {/* Số người */}
              <div className="space-y-3 md:col-span-2 bg-[#251b0f] p-5 rounded-2xl border border-stone-800">
                <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#d4a85a]" /> Số lượng khách đi cùng
                </label>
                <div className="flex items-center gap-6">
                  <button type="button" onClick={() => setFormData(f => ({ ...f, partySize: Math.max(1, f.partySize - 1) }))}
                    className="w-12 h-12 rounded-xl border border-stone-800 flex items-center justify-center font-bold text-2xl text-[#f5e6c8] hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all bg-[#1a1208]">−</button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-display font-black text-white">{formData.partySize}</span>
                    <span className="text-[#d4c3a3] font-bold ml-2">người</span>
                  </div>
                  <button type="button" onClick={() => setFormData(f => ({ ...f, partySize: Math.min(20, f.partySize + 1) }))}
                    className="w-12 h-12 rounded-xl border border-stone-800 flex items-center justify-center font-bold text-2xl text-[#f5e6c8] hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all bg-[#1a1208]">+</button>
                </div>
              </div>
            </div>

            {/* Yêu cầu đặc biệt */}
            <div className="p-6 bg-[#1a1208] rounded-2xl border border-stone-800">
              <label className="text-base font-bold text-[#f5e6c8] mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#d4a85a]" /> Yêu cầu đặc biệt <span className="text-[#d4c3a3] font-medium text-xs">(Không bắt buộc)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SPECIAL_REQUESTS.map((req) => (
                  <button key={req.id} type="button" onClick={() => toggleRequest(req.id)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 text-sm font-bold ${
                      selectedRequests.includes(req.id)
                        ? 'border-[#d4a85a] bg-amber-950/30 text-[#d4a85a]'
                        : 'border-stone-800 bg-[#251b0f] text-[#d4c3a3] hover:border-[#d4a85a]/40'
                    }`}>
                    <div className={`p-2.5 rounded-xl ${selectedRequests.includes(req.id) ? 'bg-[#d4a85a]/15 text-[#d4a85a]' : 'bg-[#1a1208] text-stone-500'}`}>
                      <req.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-center leading-tight">{req.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 2: Sơ đồ chọn bàn ══════════════════ */}
        {currentStep === 2 && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1">Chọn bàn ngồi</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">
                Kết quả đã được lọc theo thời gian bạn chọn: <span className="text-[#d4a85a] font-bold">{new Date(formData.reservationDate).toLocaleDateString('vi-VN')} lúc {formData.reservationTime}</span>. Bàn màu đỏ đã có người đặt trong khung giờ này.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#1a1208] rounded-2xl border border-stone-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="w-5 h-5 rounded-lg bg-emerald-900 border-2 border-emerald-500" />
                <span className="text-emerald-400">Bàn trống — có thể đặt</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="w-5 h-5 rounded-lg bg-rose-950 border-2 border-rose-800" />
                <span className="text-rose-400">Đã có lịch đặt trong giờ này</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="w-5 h-5 rounded-lg bg-stone-900 border-2 border-stone-700" />
                <span className="text-stone-500">Đóng cửa / Bảo trì</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="w-5 h-5 rounded-lg bg-[#d4a85a] border-2 border-[#d4a85a]" />
                <span className="text-[#d4a85a]">Đang được chọn</span>
              </div>
            </div>

            {/* Chọn khu vực */}
            <div className="flex flex-wrap gap-2 mb-6">
              {AREAS.map(area => (
                <button key={area.id} type="button" onClick={() => setSelectedArea(area.id)}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                    selectedArea === area.id
                      ? 'border-[#d4a85a] bg-amber-950/40 text-[#d4a85a]'
                      : 'border-stone-700 bg-[#1a1208] text-[#d4c3a3] hover:border-stone-500'
                  }`}>
                  {area.label}
                </button>
              ))}
            </div>

            {/* Sơ đồ bàn */}
            {loadingTables ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#d4a85a]" />
                <p className="text-[#d4c3a3] font-semibold text-sm">Đang kiểm tra tình trạng bàn...</p>
              </div>
            ) : (
              <div className="p-6 bg-[#1a1208] rounded-2xl border border-stone-800 min-h-[200px]">
                {(() => {
                  const areaLabel = AREAS.find(a => a.id === selectedArea)?.label;
                  const areaTables = tables.filter(t => t.area === selectedArea);
                  if (areaTables.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <LayoutGrid className="w-10 h-10 text-stone-600 mb-3" />
                        <p className="text-[#d4c3a3] font-semibold">Khu vực {areaLabel} chưa có bàn nào.</p>
                        <p className="text-stone-500 text-sm mt-1">Vui lòng chọn khu vực khác hoặc liên hệ nhà hàng.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {areaTables.map(table => {
                        const isSelected = formData.tableId === table._id;
                        const isBooked = !table.isAvailableForBooking && table.status !== 'dong';
                        const isClosed = table.status === 'dong';
                        const isAvailable = table.isAvailableForBooking;
                        
                        return (
                          <button
                            key={table._id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setFormData(f => ({ ...f, tableId: isSelected ? null : table._id }))}
                            title={!isAvailable ? (isClosed ? 'Bàn đóng cửa' : 'Đã có người đặt trong khung giờ này') : ''}
                            className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 group
                              ${isSelected
                                ? 'border-[#d4a85a] bg-[#d4a85a] text-[#1a1208] shadow-xl shadow-[#d4a85a]/30 scale-105 z-10'
                                : isBooked
                                ? 'border-rose-900 bg-rose-950/60 text-rose-600 cursor-not-allowed'
                                : isClosed
                                ? 'border-stone-800 bg-stone-900 text-stone-700 cursor-not-allowed opacity-50'
                                : 'border-emerald-800 bg-emerald-950/40 hover:border-emerald-500 hover:bg-emerald-950/70 hover:scale-105 text-emerald-300 cursor-pointer'
                              }`}
                          >
                            {/* Số bàn */}
                            <span className={`font-black text-2xl leading-none ${isSelected ? 'text-[#1a1208]' : ''}`}>
                              {table.tableNumber}
                            </span>

                            {/* Sức chứa */}
                            <span className={`text-[9px] font-bold uppercase mt-1 tracking-wide ${isSelected ? 'text-[#1a1208]/70' : 'opacity-70'}`}>
                              {table.capacity} chỗ
                            </span>

                            {/* Badge trạng thái */}
                            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                              isSelected
                                ? 'bg-[#1a1208] text-[#d4a85a]'
                                : isBooked
                                ? 'bg-rose-900 text-rose-300'
                                : isClosed
                                ? 'bg-stone-800 text-stone-600'
                                : 'bg-emerald-900 text-emerald-400'
                            }`}>
                              {isSelected ? '✓ Đã chọn' : isBooked ? '🔴 Đã đặt' : isClosed ? 'Đóng' : 'Trống'}
                            </span>

                            {/* Tooltip khi hover vào bàn đã đặt */}
                            {isBooked && (
                              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-rose-900 text-rose-100 text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                Đã có lịch ±2 tiếng
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Hiển thị bàn đã chọn */}
            {formData.tableId && (() => {
              const selected = tables.find(t => t._id === formData.tableId);
              return selected ? (
                <div className="mt-4 flex items-center gap-3 p-4 bg-[#d4a85a]/10 border border-[#d4a85a]/40 rounded-2xl animate-fade-in-up">
                  <CheckCircle className="w-5 h-5 text-[#d4a85a] shrink-0" />
                  <div>
                    <span className="font-bold text-[#d4a85a]">Đã chọn: Bàn số {selected.tableNumber}</span>
                    <span className="text-[#d4c3a3] text-sm ml-2">— {AREAS.find(a => a.id === selectedArea)?.label} — Sức chứa {selected.capacity} người</span>
                  </div>
                  <button onClick={() => setFormData(f => ({ ...f, tableId: null }))} className="ml-auto p-1 text-stone-500 hover:text-rose-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ══════════════════ STEP 3: Đặt món trước ══════════════════ */}
        {currentStep === 3 && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1">Thực đơn đặt trước</h2>
                <p className="text-[#d4c3a3] text-sm font-medium">Tùy chọn — Quý khách có thể chọn trước để chúng tôi phục vụ nhanh hơn khi đến bàn.</p>
              </div>
              {Object.values(preOrderItems).length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/40 text-[#d4a85a] rounded-xl border border-[#d4a85a]/20 font-bold text-sm">
                  <Utensils className="w-4 h-4" />
                  <span>Tạm tính: {getPreOrderTotal().toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {/* Search & filter */}
                <div className="relative">
                  <Search className="w-5 h-5 text-[#d4a85a]/60 absolute left-4 top-3.5" />
                  <input type="text" placeholder="Tìm món ăn..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#1a1208] border border-stone-800 text-[#f5e6c8] placeholder-stone-600 rounded-xl focus:outline-none focus:border-[#d4a85a] font-semibold" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {CATEGORIES.map(c => (
                    <button key={c.id} type="button" onClick={() => setMenuActiveCategory(c.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                        menuActiveCategory === c.id ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208]' : 'bg-[#1a1208] border-stone-800 text-[#d4c3a3] hover:border-stone-600'
                      }`}>{c.label}</button>
                  ))}
                </div>

                {loadingMenu ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d4a85a]" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredMenuItems.map(item => {
                      const qty = preOrderItems[item._id]?.quantity || 0;
                      return (
                        <div key={item._id} className="border border-stone-800 rounded-2xl p-4 flex gap-4 bg-[#1a1208] hover:border-amber-500/20 transition-all">
                          <img src={item.image?.startsWith('http') ? item.image : `http://localhost:3000${item.image}`} alt={item.name}
                            className="w-20 h-20 object-cover rounded-xl bg-stone-900 flex-shrink-0 border border-stone-800" />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-[#f5e6c8] text-sm leading-snug">{item.name}</h4>
                              <p className="text-[10px] text-[#d4c3a3] mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-bold text-[#d4a85a] text-sm">{item.price.toLocaleString('vi-VN')}đ</span>
                              <div className="flex items-center gap-1.5 border border-stone-800 rounded-lg p-1 bg-[#251b0f]">
                                {qty > 0 ? (
                                  <>
                                    <button type="button" onClick={() => updatePreOrderQty(item, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-[#1a1208] hover:bg-stone-800 text-[#f5e6c8] rounded">−</button>
                                    <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                                    <button type="button" onClick={() => updatePreOrderQty(item, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded">+</button>
                                  </>
                                ) : (
                                  <button type="button" onClick={() => updatePreOrderQty(item, 1)}
                                    className="px-2.5 py-1 bg-[#d4a85a] text-[#1a1208] text-xs font-bold rounded-md">+ Chọn</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMenuItems.length === 0 && (
                      <div className="col-span-full py-16 text-center text-[#d4c3a3] font-medium text-sm bg-[#1a1208] rounded-2xl border border-dashed border-stone-800">
                        Không tìm thấy món ăn nào
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Giỏ đặt trước */}
              <div className="bg-[#1a1208] border border-stone-800 rounded-3xl p-6 flex flex-col max-h-[60vh]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#d4a85a] border-b border-stone-800 pb-3 mb-4 flex justify-between">
                  <span>Đặt trước ({Object.values(preOrderItems).reduce((s, i) => s + i.quantity, 0)})</span>
                  {Object.values(preOrderItems).length > 0 && (
                    <button type="button" onClick={() => setPreOrderItems({})} className="text-[10px] text-rose-500 underline font-bold normal-case">Xóa hết</button>
                  )}
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {Object.values(preOrderItems).map(i => (
                    <div key={i.menuItem._id} className="flex justify-between items-center gap-2 bg-[#251b0f] p-3 rounded-xl border border-stone-800">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#f5e6c8]">{i.menuItem.name}</div>
                        <div className="text-[10px] text-[#d4a85a] font-bold">{i.menuItem.price.toLocaleString('vi-VN')}đ</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => updatePreOrderQty(i.menuItem, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#1a1208] text-[#f5e6c8] rounded border border-stone-800">−</button>
                        <span className="text-xs font-bold text-white w-4 text-center">{i.quantity}</span>
                        <button type="button" onClick={() => updatePreOrderQty(i.menuItem, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#d4a85a] text-[#1a1208] rounded">+</button>
                      </div>
                    </div>
                  ))}
                  {Object.values(preOrderItems).length === 0 && (
                    <div className="text-center py-16 text-stone-600 font-bold text-xs flex flex-col items-center gap-2">
                      <span className="text-3xl">🍲</span>
                      <span>Chưa chọn món nào</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-stone-800 pt-4 mt-4 font-bold text-sm text-[#f5e6c8]">
                  <div className="flex justify-between">
                    <span>Tổng tiền món:</span>
                    <span className="text-[#d4a85a]">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-[10px] text-[#d4c3a3]/70 font-medium mt-2 italic">* Thanh toán sau khi ăn tại nhà hàng.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 4: Thông tin & Xác nhận ══════════════════ */}
        {currentStep === 4 && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold text-[#f5e6c8] mb-1">Điền thông tin & Xác nhận đặt bàn</h2>
              <p className="text-[#d4c3a3] text-sm font-medium">Kiểm tra lại toàn bộ và điền thông tin liên hệ để hoàn tất đặt hẹn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form thông tin */}
              <div className="space-y-5 p-6 bg-[#1a1208] rounded-3xl border border-stone-800">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-2">Thông tin liên hệ</h3>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#d4c3a3]">Họ và tên <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Nguyễn Văn A" value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-[#251b0f] text-white focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#d4c3a3]">Số điện thoại <span className="text-red-400">*</span></label>
                  <input type="tel" placeholder="0987654321" value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-[#251b0f] text-white focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#d4c3a3] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#d4a85a]" /> Ghi chú thêm <span className="text-stone-500 font-normal">(Không bắt buộc)</span>
                  </label>
                  <textarea rows="3" placeholder="Dị ứng thực phẩm, yêu cầu đặc biệt..." value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-[#251b0f] text-white focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-semibold resize-none" />
                </div>
              </div>

              {/* Tóm tắt */}
              <div className="space-y-4">
                <div className="p-5 bg-[#1a1208] rounded-3xl border border-stone-800">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-4">Tóm tắt đặt bàn</h3>
                  {[
                    { label: 'Ngày đến', value: new Date(formData.reservationDate).toLocaleDateString('vi-VN') },
                    { label: 'Giờ đến', value: formData.reservationTime },
                    { label: 'Số khách', value: `${formData.partySize} người` },
                    { label: 'Khu vực', value: AREAS.find(a => a.id === selectedArea)?.label },
                    { label: 'Bàn số', value: tables.find(t => t._id === formData.tableId)?.tableNumber },
                    ...(selectedRequests.length > 0 ? [{ label: 'Yêu cầu', value: selectedRequests.map(id => SPECIAL_REQUESTS.find(r => r.id === id)?.label).join(', ') }] : []),
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-start py-2.5 border-b border-stone-900/80 last:border-0">
                      <span className="text-sm text-[#d4c3a3] font-medium">{row.label}</span>
                      <span className="text-sm font-black text-white text-right ml-4">{row.value || '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Món ăn đặt trước */}
                {Object.values(preOrderItems).length > 0 && (
                  <div className="p-5 bg-[#1a1208] rounded-3xl border border-stone-800">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-[#d4a85a] border-b border-stone-800 pb-2 mb-4">Món đặt trước</h3>
                    {Object.values(preOrderItems).map(i => (
                      <div key={i.menuItem._id} className="flex justify-between text-xs mb-2">
                        <span className="text-stone-300">{i.menuItem.name} <span className="text-[#d4a85a] font-bold">x{i.quantity}</span></span>
                        <span className="font-bold text-stone-100">{(i.menuItem.price * i.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-dashed border-stone-800 font-bold mt-2">
                      <span className="text-white">Tổng tạm tính:</span>
                      <span className="text-[#d4a85a]">{getPreOrderTotal().toLocaleString('vi-VN')}đ</span>
                    </div>
                    <p className="text-[10px] text-stone-500 italic mt-2">* Thanh toán hóa đơn thực tế sau khi ăn.</p>
                  </div>
                )}

                <div className="p-4 bg-amber-950/20 rounded-2xl border border-[#d4a85a]/20 text-[#d4c3a3] font-bold text-xs leading-normal flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#d4a85a] shrink-0 mt-0.5" />
                  <span>Đơn sẽ tự hủy sau 15 phút nếu quý khách không đến hoặc không liên hệ thông báo.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex justify-between mt-10 pt-6 border-t border-stone-800/80">
          <button type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-stone-800 text-[#d4c3a3] font-bold hover:border-stone-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-wider bg-[#251b0f]">
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>

          <button type="button" onClick={handleNextStep} disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#d4a85a]/20 disabled:opacity-70 text-xs uppercase tracking-wider">
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentStep === 4 ? (
              <><CheckCircle className="w-5 h-5" /> Xác nhận đặt bàn</>
            ) : (
              <>Tiếp theo <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
