import { useState, useEffect } from 'react';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import useSocket from '../../hooks/useSocket';
import { useCartStore } from '../../store/cartStore';
import { Loader2, CheckCircle2, ChefHat, Clock, AlertCircle, Star, MessageSquare, X, CalendarClock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  cho_xac_nhan: { label: 'Đang đợi bếp', color: 'text-rose-400', bg: 'bg-rose-950/40 border border-rose-900/30', icon: Clock },
  dang_che_bien: { label: 'Đang nấu', color: 'text-amber-400', bg: 'bg-amber-950/40 border border-amber-900/30', icon: ChefHat },
  hoan_thanh: { label: 'Đã phục vụ', color: 'text-[#d4a85a]', bg: 'bg-amber-950/40 border border-[#d4a85a]/20', icon: CheckCircle2 },
  huy: { label: 'Đã hủy', color: 'text-stone-500', bg: 'bg-stone-900/40 border border-stone-800', icon: AlertCircle }
};

const RES_STATUS_CONFIG = {
  cho_xac_nhan: { label: 'Chờ duyệt', color: 'text-amber-400', bg: 'bg-amber-950/40 border border-amber-900/30', icon: Clock },
  da_xac_nhan: { label: 'Đã duyệt', color: 'text-blue-400', bg: 'bg-blue-950/40 border border-blue-900/30', icon: CalendarClock },
  da_den: { label: 'Đã tới nhà hàng', color: 'text-indigo-400', bg: 'bg-indigo-950/40 border border-indigo-900/30', icon: ArrowRight },
  hoan_thanh: { label: 'Đã hoàn thành', color: 'text-[#d4a85a]', bg: 'bg-amber-950/40 border border-[#d4a85a]/20', icon: CheckCircle2 },
  da_huy: { label: 'Đã hủy', color: 'text-stone-500', bg: 'bg-stone-900/40 border border-stone-800', icon: AlertCircle }
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tableId } = useCartStore();
  
  // States for Service Call & Review
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedOrderForService, setSelectedOrderForService] = useState(null);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Listen to table specific updates
  const socket = useSocket(tableId ? `table:${tableId}` : null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:item-updated', ({ orderId, itemId, status }) => {
      setHistoryItems(prev => prev.map(item => {
        if (item.type === 'order' && item._id === orderId) {
          const updatedItems = item.items.map(i => 
            i._id === itemId ? { ...i, status } : i
          );
          return { ...item, items: updatedItems };
        }
        return item;
      }));
      
      if (status === 'hoan_thanh') {
        toast.success('Có món đã phục vụ! Quý khách vui lòng kiểm tra tại bàn.');
      }
    });

    socket.on('order:status-changed', ({ orderId, status }) => {
      setHistoryItems(prev => prev.map(item => 
        (item.type === 'order' && item._id === orderId) ? { ...item, orderStatus: status } : item
      ));
    });

    return () => {
      socket.off('order:item-updated');
      socket.off('order:status-changed');
    };
  }, [socket]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [orderRes, resRes] = await Promise.all([
        OrderService.getMyOrders().catch(() => ({ data: [] })),
        ReservationService.getMyReservations().catch(() => ({ data: [] }))
      ]);
      
      const mappedOrders = (orderRes.data || []).map(o => ({ ...o, type: 'order' }));
      const mappedReservations = (resRes.data || []).map(r => ({ ...r, type: 'reservation' }));
      
      const merged = [...mappedOrders, ...mappedReservations].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setHistoryItems(merged);
    } catch (error) {
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleCallStaff = (reason) => {
    if (!socket || !selectedOrderForService) return;
    
    socket.emit('table:call-staff', {
      tableNumber: selectedOrderForService.table?.tableNumber,
      orderId: selectedOrderForService._id,
      reason
    });
    
    toast.success('Đã gửi yêu cầu gọi nhân viên phục vụ!');
    setShowServiceModal(false);
    setSelectedOrderForService(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedOrderForReview) return;
    setSubmittingReview(true);
    try {
      const res = await OrderService.submitReview(selectedOrderForReview._id, rating, comment);
      if (res.success) {
        toast.success('Cảm ơn ý kiến đóng góp của quý khách!');
        setHistoryItems(prev => prev.map(o => 
          (o.type === 'order' && o._id === selectedOrderForReview._id)
            ? { ...o, review: { rating, comment, reviewedAt: new Date() } } 
            : o
        ));
        setShowReviewModal(false);
        setComment('');
        setRating(5);
        setSelectedOrderForReview(null);
      }
    } catch (error) {
      toast.error(error?.message || 'Gửi đánh giá không thành công');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 text-[#d4a85a]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in text-[#f5e6c8]">
        <div className="w-28 h-28 bg-[#251b0f] rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-850 shadow-inner">
          <span className="text-4xl">🕒</span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-[#d4a85a] mb-2 tracking-[0.05em]">Chưa có giao dịch nào</h2>
        <p className="text-[#d4c3a3] text-sm">Quý khách vui lòng chọn các món ăn ưa thích hoặc đặt bàn để bắt đầu trải nghiệm nhé!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in text-[#f5e6c8]">
      <div className="mb-10 pb-6 border-b border-stone-800/60 text-left">
        <h1 className="text-4xl font-display font-bold text-[#d4a85a] tracking-[0.15em] uppercase">LỊCH SỬ & ĐẶT BÀN</h1>
        <p className="text-[#d4c3a3] mt-2 font-medium text-sm">Theo dõi chi tiết trạng thái đơn hàng, lịch hẹn đặt bàn và gửi đóng góp ý kiến.</p>
      </div>

      <div className="space-y-8">
        {historyItems.map((item) => {
          if (item.type === 'order') {
            const order = item;
            return (
              <div key={order._id} className="bg-[#251b0f] rounded-3xl p-6 md:p-8 shadow-2xl border border-stone-800/80 animate-fade-in-up">
                
                {/* Order Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-800/60 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-white tracking-wide">Mã đơn: #{order._id.slice(-6).toUpperCase()}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider ${
                        order.orderStatus === 'hoan_thanh' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                        order.orderStatus === 'da_huy' ? 'bg-stone-900 text-stone-500 border border-stone-800' :
                        'bg-amber-950 text-[#d4a85a] border border-[#d4a85a]/20'
                      }`}>
                        {order.orderStatus === 'hoan_thanh' ? 'Hoàn thành' : 
                         order.orderStatus === 'da_huy' ? 'Đã hủy' : 'Đang xử lý'}
                      </span>
                    </div>
                    <div className="text-xs text-[#d4c3a3] flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 font-medium">
                      {order.orderType === 'tai_ban' && <span>Bàn số: {order.table?.tableNumber || '?'}</span>}
                      {order.orderType === 'mang_ve' && <span>Đơn mang về</span>}
                      {order.orderType === 'giao_hang' && <span>Giao đến: {order.deliveryAddress}</span>}
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  
                  <div className="text-right w-full md:w-auto bg-[#1a1208] px-5 py-3 rounded-2xl border border-stone-850">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Tổng tiền</div>
                    <div className="text-xl font-bold text-[#d4a85a]">
                      {(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-5">
                  {order.items.map((orderItem, index) => {
                    const displayStatus = order.orderStatus === 'hoan_thanh' ? 'hoan_thanh' : orderItem.status;
                    const config = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.cho_xac_nhan;
                    const Icon = config.icon;

                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#1a1208] p-4 rounded-2xl border border-stone-850/60">
                        <img 
                          src={orderItem.menuItem?.image?.startsWith('http') ? orderItem.menuItem.image : `http://localhost:3000${orderItem.menuItem?.image}`} 
                          alt={orderItem.menuItem?.name} 
                          className="w-16 h-16 rounded-xl object-cover bg-stone-900 border border-stone-850 flex-shrink-0"
                        />
                        
                        <div className="flex-grow w-full">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className="font-bold text-white text-base leading-snug">
                                {orderItem.quantity} x {orderItem.menuItem?.name}
                              </h4>
                              <div className="text-[#d4a85a] font-bold text-xs mt-1">
                                {(orderItem.price * orderItem.quantity).toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                            
                            {order.orderStatus !== 'da_huy' && (
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${config.bg} ${config.color} transition-colors duration-500`}>
                                <Icon className={`w-3.5 h-3.5 ${displayStatus === 'dang_che_bien' ? 'animate-bounce' : ''}`} />
                                {config.label}
                              </div>
                            )}
                          </div>
                          
                          {orderItem.note && (
                            <div className="mt-2 text-[11px] font-medium text-[#d4c3a3] bg-[#251b0f] px-2.5 py-1 rounded-md border border-stone-800 inline-block">
                              Ghi chú: {orderItem.note}
                            </div>
                          )}

                          {/* Timeline progress bar */}
                          {order.orderStatus !== 'da_huy' && (
                            <div className="mt-3 flex gap-1 h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${
                                ['cho_xac_nhan', 'dang_che_bien', 'hoan_thanh'].includes(displayStatus) ? 'bg-rose-500 w-1/3' : 'w-0'
                              }`} />
                              <div className={`h-full transition-all duration-1000 ${
                                ['dang_che_bien', 'hoan_thanh'].includes(displayStatus) ? 'bg-amber-500 w-1/3' : 'w-0'
                              }`} />
                              <div className={`h-full transition-all duration-1000 ${
                                displayStatus === 'hoan_thanh' ? 'bg-[#d4a85a] w-1/3' : 'w-0'
                              }`} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reviews display for Completed Orders */}
                {order.orderStatus === 'hoan_thanh' && order.review && order.review.rating && (
                  <div className="mt-6 p-4 bg-[#1a1208] rounded-2xl border border-[#d4a85a]/10 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < order.review.rating ? 'fill-current' : 'text-stone-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] uppercase font-black text-[#d4a85a] tracking-wider">Đánh giá của bạn</span>
                    </div>
                    {order.review.comment && (
                      <p className="text-xs text-[#d4c3a3] font-medium italic flex gap-1.5 items-start">
                        <MessageSquare className="w-3.5 h-3.5 text-[#d4a85a] shrink-0 mt-0.5" />
                        <span>"{order.review.comment}"</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {order.orderStatus !== 'hoan_thanh' && order.orderStatus !== 'da_huy' && order.orderType === 'tai_ban' ? (
                  <div className="mt-8 pt-6 border-t border-stone-800/60 flex gap-4">
                    <button
                      onClick={() => {
                        setSelectedOrderForService(order);
                        setShowServiceModal(true);
                      }}
                      className="w-full py-3 bg-[#1a1208] hover:bg-[#332514] text-[#d4c3a3] border border-stone-800 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-[#d4a85a]" />
                      Gọi Nhân Viên Hỗ Trợ
                    </button>
                  </div>
                ) : order.orderStatus === 'hoan_thanh' ? (
                  <div className="mt-6 pt-5 border-t border-stone-800/60 space-y-4">
                    {/* Khu vực Thanh toán */}
                    {order.isPaid ? (
                      <div className="w-full py-3 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã thanh toán thành công
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/payment/${order._id}`)}
                        className="w-full py-3.5 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold shadow-lg shadow-amber-500/10 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        💳 Thanh toán hóa đơn
                      </button>
                    )}

                    {/* Nút đánh giá */}
                    {(!order.review || !order.review.rating) && (
                      <button
                        onClick={() => {
                          setSelectedOrderForReview(order);
                          setShowReviewModal(true);
                        }}
                        className="w-full py-3 bg-[#1a1208] hover:bg-[#332514] text-[#d4c3a3] border border-stone-800 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4 text-[#d4a85a]" />
                        Đánh giá bữa ăn & Ghi chú
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          } else {
            // Hiển thị Lịch đặt bàn
            const res = item;
            const config = RES_STATUS_CONFIG[res.status] || RES_STATUS_CONFIG.cho_xac_nhan;
            const Icon = config.icon;
            const totalPreOrder = (res.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);

            return (
              <div key={res._id} className="bg-gradient-to-br from-[#2a2216] to-[#1c150c] rounded-3xl p-6 md:p-8 shadow-2xl border border-[#d4a85a]/30 animate-fade-in-up relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a85a]/5 rounded-bl-full" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d4a85a]/20 pb-6 mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-[#d4a85a] tracking-wide">ĐẶT BÀN: #{res._id.slice(-6).toUpperCase()}</h3>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider ${config.bg} ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="text-xs text-[#d4c3a3] flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 font-medium">
                      <span>Ngày đến: {new Date(res.reservationDate).toLocaleDateString('vi-VN')} {res.reservationTime}</span>
                      <span>•</span>
                      <span>Số khách: {res.partySize} người</span>
                      {res.table && <span>• Bàn số: {res.table.tableNumber}</span>}
                      <span>• Tạo lúc: {new Date(res.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  
                  {totalPreOrder > 0 && (
                    <div className="text-right w-full md:w-auto bg-[#1a1208] px-5 py-3 rounded-2xl border border-[#d4a85a]/20">
                      <div className="text-[10px] uppercase tracking-wider text-[#d4a85a] font-bold mb-1">Tổng Đặt Trước</div>
                      <div className="text-xl font-bold text-[#f5e6c8]">
                        {totalPreOrder.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  )}
                </div>

                {res.items && res.items.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#d4a85a] uppercase tracking-widest mb-3">Món Ăn Đặt Trước</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {res.items.map((i, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-[#1a1208] p-3 rounded-xl border border-stone-850/60">
                          <img 
                            src={i.menuItem?.image?.startsWith('http') ? i.menuItem.image : `http://localhost:3000${i.menuItem?.image}`} 
                            alt={i.menuItem?.name} 
                            className="w-12 h-12 rounded-lg object-cover bg-stone-900 border border-stone-850"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{i.quantity} x {i.menuItem?.name}</div>
                            <div className="text-[#d4a85a] font-bold text-xs mt-0.5">{(i.price * i.quantity).toLocaleString('vi-VN')}đ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {res.note && (
                  <div className="mt-6 p-4 bg-[#1a1208] rounded-xl border border-stone-850 text-sm text-[#d4c3a3]">
                    <span className="font-bold text-[#d4a85a]">Ghi chú:</span> {res.note}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Modals here... */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#251b0f] border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up text-[#f5e6c8]">
            <h3 className="text-xl font-serif font-bold text-[#d4a85a] mb-6 text-center">Quý khách cần hỗ trợ dịch vụ nào?</h3>
            <div className="space-y-3">
              {[
                { label: 'Thêm muỗng, đũa, nĩa', icon: '🍴' },
                { label: 'Lấy thêm nước chấm', icon: '🥣' },
                { label: 'Dọn dẹp bàn ăn', icon: '🧹' },
                { label: 'Cần tư vấn thêm món', icon: '💁' },
                { label: 'Yêu cầu dịch vụ khác', icon: '✨' },
              ].map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCallStaff(reason.label)}
                  className="w-full p-4 flex items-center gap-3 bg-[#1a1208] hover:bg-amber-950/30 border border-stone-850 hover:border-[#d4a85a]/50 rounded-xl font-bold text-[#d4c3a3] hover:text-[#d4a85a] transition-all"
                >
                  <span className="text-xl">{reason.icon}</span>
                  {reason.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowServiceModal(false)}
              className="w-full mt-6 py-3 bg-[#1a1208] border border-stone-800 hover:bg-[#332514] text-[#d4c3a3] rounded-xl font-bold transition-all text-xs uppercase tracking-wider"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#251b0f] border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up text-[#f5e6c8] relative">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-[#d4a85a] transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-serif font-bold text-[#d4a85a] mb-2 text-center">Đánh Giá Bữa Ăn</h3>
            <p className="text-stone-500 text-xs text-center mb-6">Ý kiến của quý khách giúp chúng tôi nâng cao chất lượng phục vụ tốt hơn.</p>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-all active:scale-125"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      star <= rating 
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                        : 'text-stone-800'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#d4c3a3]">Nhận xét & Ghi chú góp ý</label>
              <textarea
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Món ăn có hợp khẩu vị của bạn không?"
                className="w-full p-4 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all resize-none font-semibold"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 bg-[#1a1208] border border-stone-800 hover:bg-[#332514] text-[#d4c3a3] rounded-xl font-bold transition-all text-xs uppercase tracking-wider"
              >
                Bỏ Qua
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold shadow-lg shadow-amber-500/10 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
