import { useState, useEffect } from 'react';
import { ReservationService } from '../../services/reservation.service';
import {
  Calendar, Clock, Users, FileText, CheckCircle, Loader2,
  MapPin, Sparkles, ChevronRight, ChevronLeft, Star, Eye, Wind, TreePine, LayoutGrid
} from 'lucide-react';
import { TableService } from '../../services/table.service';
import toast from 'react-hot-toast';

// ─── Dữ liệu khu vực ngồi ──────────────────────────────────────────────────
const AREAS = [
  {
    id: 'window',
    label: 'View cửa sổ',
    description: 'Nhìn ra đường phố, ánh sáng tự nhiên',
    icon: Eye,
    emoji: '🪟',
    capacity: '2–4 người',
  },
  {
    id: 'garden',
    label: 'Khu vườn ngoài trời',
    description: 'Không gian xanh mát, thoáng đãng',
    icon: TreePine,
    emoji: '🌿',
    capacity: '4–8 người',
  },
  {
    id: 'vip',
    label: 'Phòng VIP riêng tư',
    description: 'Yên tĩnh, sang trọng, có màn chiếu',
    icon: Star,
    emoji: '👑',
    capacity: '6–12 người',
  },
  {
    id: 'main',
    label: 'Khu chính nhà hàng',
    description: 'Trung tâm, đầy đủ tiện nghi',
    icon: Wind,
    emoji: '🍽️',
    capacity: '2–10 người',
  },
];

// ─── Yêu cầu đặc biệt ──────────────────────────────────────────────────────
const SPECIAL_REQUESTS = [
  { id: 'birthday', label: 'Sinh nhật', emoji: '🎂' },
  { id: 'anniversary', label: 'Kỷ niệm', emoji: '💍' },
  { id: 'decoration', label: 'Trang trí bàn', emoji: '🌸' },
  { id: 'cake', label: 'Đặt bánh kem', emoji: '🎁' },
  { id: 'candle', label: 'Nến lãng mạn', emoji: '🕯️' },
  { id: 'kids', label: 'Có trẻ em', emoji: '👶' },
  { id: 'wheelchair', label: 'Hỗ trợ xe lăn', emoji: '♿' },
  { id: 'quiet', label: 'Góc yên tĩnh', emoji: '🔇' },
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
const StepIndicator = ({ step, currentStep, label }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
        isCompleted
          ? 'bg-[#d4a85a] text-white shadow-lg shadow-[#d4a85a]/30'
          : isActive
          ? 'bg-stone-900 text-white ring-4 ring-stone-900/20'
          : 'bg-stone-100 text-stone-400'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-xs font-semibold hidden sm:block ${
        isActive ? 'text-stone-900' : isCompleted ? 'text-[#d4a85a]' : 'text-stone-400'
      }`}>
        {label}
      </span>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const ReservationPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    note: '',
    tableId: null
  });

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

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
    fetchTables();
  }, []);

  const toggleRequest = (id) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
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

    setIsSubmitting(true);
    try {
      await ReservationService.create({
        ...formData,
        table: formData.tableId,
        note: buildNote()
      });
      setIsSuccess(true);
      toast.success('Đặt bàn thành công!');
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra khi đặt bàn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in-up text-center">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-4xl font-display font-black text-[#d4a85a] mb-4">Đặt Bàn Thành Công!</h1>
        <p className="text-stone-500 mb-3 text-lg">
          Cảm ơn <b className="text-stone-800">{formData.customerName}</b> đã tin tưởng chúng tôi.
        </p>
        <p className="text-stone-400 mb-8">
          Nhà hàng sẽ liên hệ qua <b className="text-stone-700">{formData.customerPhone}</b> để xác nhận trong thời gian sớm nhất.
        </p>

        {/* Summary card */}
        <div className="bg-stone-50 rounded-2xl p-6 text-left space-y-3 mb-8 border border-stone-100">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Ngày đến</span>
            <span className="font-bold text-stone-800">{formData.reservationDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Giờ đến</span>
            <span className="font-bold text-stone-800">{formData.reservationTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Số người</span>
            <span className="font-bold text-stone-800">{formData.partySize} người</span>
          </div>
          {selectedArea && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Khu vực</span>
              <span className="font-bold text-stone-800">{AREAS.find(a => a.id === selectedArea)?.label}</span>
            </div>
          )}
          {formData.tableId && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Bàn chọn</span>
              <span className="font-bold text-stone-800">Bàn {tables.find(t => t._id === formData.tableId)?.tableNumber}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          Trở về Trang Chủ
        </button>
      </div>
    );
  }

  const steps = [
    { step: 1, label: 'Sơ đồ' },
    { step: 2, label: 'Chọn bàn' },
    { step: 3, label: 'Thông tin' },
    { step: 4, label: 'Xác nhận' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-black text-[#d4a85a] mb-3">Đặt Bàn Trực Tuyến</h1>
        <p className="text-stone-500 max-w-xl mx-auto">Chúng tôi sẽ chuẩn bị không gian tuyệt vời nhất cho bữa ăn của bạn.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-2">
            <StepIndicator step={s.step} currentStep={currentStep} label={s.label} />
            {i < steps.length - 1 && (
              <div className={`w-12 md:w-20 h-0.5 mt-[-14px] transition-all duration-500 ${
                currentStep > s.step ? 'bg-[#d4a85a]' : 'bg-stone-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100">

        {/* ── STEP 1: Sơ đồ chỗ ngồi ── */}
        {currentStep === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Sơ Đồ Chỗ Ngồi</h2>
            <p className="text-stone-500 mb-8">Nhà hàng được chia thành các khu vực phù hợp với nhiều nhu cầu khác nhau.</p>

            {/* Floor plan visual */}
            <div className="relative bg-stone-50 rounded-2xl border-2 border-stone-200 p-6 mb-8 overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-3 right-3 text-xs font-bold text-stone-400 bg-white px-3 py-1 rounded-full border border-stone-200">
                Tầng 1
              </div>

              <div className="grid grid-cols-2 gap-4">
                {AREAS.map((area) => {
                  const Icon = area.icon;
                  return (
                    <div
                      key={area.id}
                      className="relative bg-white rounded-xl p-4 border-2 border-stone-100 flex flex-col gap-2 cursor-pointer hover:border-[#d4a85a]/50 hover:shadow-md transition-all group"
                      onClick={() => { setSelectedArea(area.id); setCurrentStep(2); }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{area.emoji}</span>
                        <div>
                          <div className="font-bold text-stone-800 text-sm">{area.label}</div>
                          <div className="text-xs text-stone-400">{area.capacity}</div>
                        </div>
                      </div>
                      {/* Table dots decoration */}
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {[...Array(area.id === 'vip' ? 3 : area.id === 'garden' ? 4 : 5)].map((_, i) => (
                          <div key={i} className="w-5 h-5 rounded-sm bg-stone-100 border border-stone-200 group-hover:border-[#d4a85a]/40 transition-colors" />
                        ))}
                      </div>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-[#d4a85a]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-sm text-stone-400">Ấn vào khu vực để tiếp tục chọn bàn →</p>
          </div>
        )}

        {/* ── STEP 2: Chọn bàn & Yêu cầu đặc biệt ── */}
        {currentStep === 2 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Chọn Vị Trí & Yêu Cầu</h2>
            <p className="text-stone-500 mb-6">Chọn khu vực ngồi và yêu cầu đặc biệt nếu có.</p>

            {/* Chọn khu vực */}
            <div className="mb-8">
              <label className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#d4a85a]" /> Khu vực ngồi
              </label>
              <div className="grid grid-cols-2 gap-3">
                {AREAS.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedArea(area.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedArea === area.id
                        ? 'border-[#d4a85a] bg-amber-50 shadow-md shadow-[#d4a85a]/10'
                        : 'border-stone-100 hover:border-stone-200 bg-stone-50'
                    }`}
                  >
                    <span className="text-2xl">{area.emoji}</span>
                    <div>
                      <div className={`font-bold text-sm ${selectedArea === area.id ? 'text-[#b8922a]' : 'text-stone-700'}`}>
                        {area.label}
                      </div>
                      <div className="text-xs text-stone-400">{area.description}</div>
                    </div>
                    {selectedArea === area.id && (
                      <CheckCircle className="w-5 h-5 text-[#d4a85a] ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn bàn cụ thể (hiện khi đã chọn khu vực) */}
            {selectedArea && (
              <div className="mb-8 animate-fade-in-up">
                <label className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#d4a85a]" /> Chọn bàn <span className="text-stone-400 font-normal">(Tùy chọn)</span>
                </label>
                {loadingTables ? (
                   <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-[#d4a85a]" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {tables.filter(t => t.area === selectedArea).map(table => (
                       <button
                         key={table._id}
                         type="button"
                         disabled={table.status === 'dong'}
                         onClick={() => setFormData({ ...formData, tableId: table._id })}
                         className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                            formData.tableId === table._id
                              ? 'border-[#d4a85a] bg-[#d4a85a] text-white shadow-md'
                              : table.status === 'trong' 
                              ? 'border-stone-200 bg-white hover:border-[#d4a85a]/50 text-stone-700'
                              : 'border-stone-100 bg-stone-100 text-stone-400 opacity-60'
                         }`}
                       >
                         <span className="font-black text-lg">{table.tableNumber}</span>
                         <span className="text-[10px] uppercase font-bold mt-1">
                           {table.status === 'trong' ? 'Trống' : table.status === 'dong' ? 'Đóng' : 'Đang bận'}
                         </span>
                       </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Yêu cầu đặc biệt */}
            <div>
              <label className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4a85a]" /> Yêu cầu đặc biệt <span className="text-stone-400 font-normal">(Không bắt buộc)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SPECIAL_REQUESTS.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => toggleRequest(req.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                      selectedRequests.includes(req.id)
                        ? 'border-[#d4a85a] bg-amber-50 text-[#b8922a]'
                        : 'border-stone-100 bg-stone-50 text-stone-600 hover:border-stone-200'
                    }`}
                  >
                    <span className="text-xl">{req.emoji}</span>
                    {req.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Nhập thông tin ── */}
        {currentStep === 3 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Thông Tin Đặt Bàn</h2>
            <p className="text-stone-500 mb-6">Điền đầy đủ thông tin để chúng tôi xác nhận chỗ cho bạn.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Họ tên */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Họ và tên <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>

              {/* SĐT */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Số điện thoại <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  placeholder="VD: 0987654321"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>

              {/* Ngày */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#d4a85a]" /> Ngày đặt bàn <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>

              {/* Giờ */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d4a85a]" /> Giờ đến <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>

              {/* Số người */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#d4a85a]" /> Số lượng người
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, partySize: Math.max(1, f.partySize - 1) }))}
                    className="w-12 h-12 rounded-xl border-2 border-stone-200 flex items-center justify-center font-bold text-xl text-stone-600 hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all"
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-display font-black text-stone-900">{formData.partySize}</span>
                    <span className="text-stone-400 ml-2">người</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, partySize: Math.min(20, f.partySize + 1) }))}
                    className="w-12 h-12 rounded-xl border-2 border-stone-200 flex items-center justify-center font-bold text-xl text-stone-600 hover:border-[#d4a85a] hover:text-[#d4a85a] transition-all"
                  >+</button>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#d4a85a]" /> Ghi chú thêm
                  <span className="text-stone-400 font-normal">(Không bắt buộc)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Dị ứng thực phẩm, yêu cầu ghế cho trẻ em..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Xác nhận ── */}
        {currentStep === 4 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Xác Nhận Đặt Bàn</h2>
            <p className="text-stone-500 mb-6">Vui lòng kiểm tra lại thông tin trước khi gửi.</p>

            <div className="space-y-4">
              {/* Info rows */}
              {[
                { label: 'Họ và tên', value: formData.customerName },
                { label: 'Số điện thoại', value: formData.customerPhone },
                { label: 'Ngày đến', value: formData.reservationDate },
                { label: 'Giờ đến', value: formData.reservationTime },
                { label: 'Số người', value: `${formData.partySize} người` },
                { label: 'Khu vực', value: selectedArea ? AREAS.find(a => a.id === selectedArea)?.label : 'Không chọn' },
                {
                  label: 'Yêu cầu đặc biệt',
                  value: selectedRequests.length > 0
                    ? selectedRequests.map(id => `${SPECIAL_REQUESTS.find(r => r.id === id)?.emoji} ${SPECIAL_REQUESTS.find(r => r.id === id)?.label}`).join(', ')
                    : 'Không có'
                },
                ...(formData.note ? [{ label: 'Ghi chú', value: formData.note }] : []),
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-start py-3 border-b border-stone-50 last:border-0">
                  <span className="text-sm text-stone-500 font-medium shrink-0 w-36">{row.label}</span>
                  <span className="text-sm font-bold text-stone-800 text-right">{row.value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-sm text-amber-700 font-medium">
                📞 Chúng tôi sẽ gọi điện xác nhận trong vòng <b>30 phút</b> sau khi nhận được yêu cầu.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex justify-between mt-8 pt-6 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-bold hover:border-stone-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 3 && (!formData.customerName || !formData.customerPhone || !formData.reservationDate || !formData.reservationTime)) {
                  return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                }
                setCurrentStep(s => Math.min(4, s + 1));
              }}
              className="flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg"
            >
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-[#d4a85a] hover:bg-[#c4973f] text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#d4a85a]/30 disabled:opacity-70"
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
