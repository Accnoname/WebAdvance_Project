import React, { useState, useEffect } from 'react';
import { X, Tag, Loader2, Info } from 'lucide-react';
import { VoucherService } from '../services/voucher.service';
import formatCurrency from '../utils/formatCurrency';

const VoucherSelectorModal = ({ isOpen, onClose, onSelectVoucher, cartTotal }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchVouchers();
    }
  }, [isOpen]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await VoucherService.getAvailableVouchers();
      if (res.success) {
        setVouchers(res.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-stone-900">Chọn Mã Khuyến Mãi</h2>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 bg-white rounded-full shadow-sm hover:shadow transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-stone-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm font-medium text-stone-500">Đang tìm khuyến mãi cho bạn...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                <Tag className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="font-bold text-stone-700">Chưa có mã khuyến mãi nào</h3>
              <p className="text-sm text-stone-500 mt-1">Vui lòng quay lại sau nhé!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vouchers.map(voucher => {
                const isEligible = cartTotal >= voucher.minOrderAmount;
                
                return (
                  <div 
                    key={voucher._id} 
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all p-4 flex items-center gap-4
                      ${isEligible 
                        ? 'bg-white border-primary-100 hover:border-primary-400 cursor-pointer group hover:shadow-md' 
                        : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }
                    `}
                    onClick={() => {
                      if (isEligible) {
                        onSelectVoucher(voucher.code);
                        onClose();
                      }
                    }}
                  >
                    {/* Icon section */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                      ${isEligible ? 'bg-primary-50 text-primary-600' : 'bg-stone-200 text-stone-400'}
                    `}>
                      <span className="text-2xl font-black">
                        {voucher.discountType === 'percent' ? '%' : '₫'}
                      </span>
                    </div>

                    {/* Content section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-black text-lg uppercase tracking-wider
                          ${isEligible ? 'text-stone-800' : 'text-stone-500'}
                        `}>
                          {voucher.code}
                        </span>
                      </div>
                      
                      <div className={`font-bold text-sm mb-1
                        ${isEligible ? 'text-primary-600' : 'text-stone-500'}
                      `}>
                        Giảm {voucher.discountType === 'percent' 
                          ? `${voucher.discountValue}%` 
                          : formatCurrency(voucher.discountValue)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                        <Info className="w-3.5 h-3.5" />
                        Đơn tối thiểu {formatCurrency(voucher.minOrderAmount)}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {isEligible ? (
                        <button className="px-4 py-2 bg-primary-50 text-primary-700 font-bold text-sm rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          Dùng ngay
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-rose-500 px-3 py-1.5 bg-rose-50 rounded-lg whitespace-nowrap">
                          Chưa đủ đ.kiện
                        </span>
                      )}
                    </div>

                    {/* Left border accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                      ${isEligible ? 'bg-primary-500' : 'bg-stone-300'}
                    `} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherSelectorModal;
