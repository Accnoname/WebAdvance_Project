import { useState } from 'react';
import { ReservationService } from '../../services/reservation.service';
import { Calendar, Clock, Users, FileText, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReservationPage = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    note: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.reservationDate || !formData.reservationTime) {
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    setIsSubmitting(true);
    try {
      await ReservationService.create(formData);
      setIsSuccess(true);
      toast.success('Gửi yêu cầu đặt bàn thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt bàn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in-up text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-display font-black text-stone-900 mb-4">Đặt Bàn Thành Công!</h1>
        <p className="text-lg text-stone-600 mb-8">
          Cảm ơn bạn đã tin tưởng. Nhà hàng sẽ liên hệ qua số điện thoại <b>{formData.customerPhone}</b> để xác nhận lại thông tin trong thời gian sớm nhất.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          Trở về Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-black text-stone-900 mb-4">Đặt Bàn Trực Tuyến</h1>
        <p className="text-stone-500 max-w-xl mx-auto">Vui lòng điền thông tin bên dưới để giữ chỗ. Chúng tôi sẽ chuẩn bị không gian tuyệt vời nhất cho bạn.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên khách hàng */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Tên của bạn</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Quân"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full pl-4 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* SĐT */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Số điện thoại</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="VD: 0987654321"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full pl-4 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Ngày đặt */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Ngày đặt bàn</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Giờ đặt */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Giờ đến</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="time"
                  required
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Số người */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-stone-700">Số lượng người</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Users className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-stone-700">Ghi chú thêm (Không bắt buộc)</label>
              <div className="relative">
                <div className="absolute top-4 left-4 pointer-events-none">
                  <FileText className="w-5 h-5 text-stone-400" />
                </div>
                <textarea
                  rows="3"
                  placeholder="Có trẻ em, dị ứng hải sản, muốn ngồi phòng riêng..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-medium text-stone-800 transition-all bg-stone-50 focus:bg-white resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-primary-500/30 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Gửi Yêu Cầu Đặt Bàn'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationPage;
