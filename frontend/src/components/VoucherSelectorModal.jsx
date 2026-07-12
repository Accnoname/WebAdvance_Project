import React, { useState, useEffect } from 'react';

import { Ticket, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { VoucherService } from '../services/voucher.service';
import formatCurrency from '../utils/formatCurrency';

const VoucherSelectorModal = ({ isOpen, onClose, subTotal, onApply }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState(null);


  useEffect(() => {
    if (isOpen) {
      fetchVouchers();
      setManualCode('');
      setError(null);
    }
  }, [isOpen, subTotal]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await VoucherService.getAvailableVouchers();
      setVouchers(res.data);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyManual = async () => {
    if (!manualCode.trim()) return;
    try {
      const res = await VoucherService.validate(manualCode, subTotal);
      onApply({
        code: manualCode,
        discountAmount: res.data.discountAmount
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
    }
  };

  const handleSelectVoucher = async (voucher) => {
    if (subTotal < voucher.minOrderAmount) return;
    try {
      const res = await VoucherService.validate(voucher.code, subTotal);
      onApply({
        code: voucher.code,
        discountAmount: res.data.discountAmount
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể áp dụng mã này');
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        />
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
            <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-500" />
              Chọn Khuyến Mãi
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 uppercase"
                />
                <button
                  onClick={handleApplyManual}
                  className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-stone-500">Đang tải dữ liệu...</div>
              ) : vouchers.length > 0 ? (
                vouchers.map(voucher => {
                  const isEligible = subTotal >= voucher.minOrderAmount;
                  return (
                    <div
                      key={voucher._id}
                      onClick={() => isEligible && handleSelectVoucher(voucher)}
                      className={`relative overflow-hidden p-4 border rounded-2xl transition-all ${
                        isEligible 
                          ? 'border-primary-100 bg-primary-50 hover:border-primary-300 cursor-pointer' 
                          : 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                            isEligible ? 'bg-primary-100 text-primary-700' : 'bg-stone-200 text-stone-600'
                          }`}>
                            {voucher.code}
                          </span>
                        </div>
                        {isEligible && <CheckCircle2 className="w-5 h-5 text-primary-500 opacity-50" />}
                      </div>
                      
                      <h4 className="font-bold text-stone-800 mb-1">
                        Giảm {voucher.discountType === 'percentage' 
                          ? `${voucher.discountValue}%` 
                          : formatCurrency(voucher.discountValue)}
                      </h4>
                      
                      <p className="text-sm text-stone-500 mb-2">
                        {voucher.description || 'Áp dụng cho đơn hàng thỏa điều kiện'}
                      </p>
                      
                      <div className="text-xs text-stone-400 flex justify-between items-center pt-2 border-t border-stone-200/60">
                        <span>Đơn tối thiểu: {formatCurrency(voucher.minOrderAmount)}</span>
                        <span>HSD: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      
                      {!isEligible && (
                        <div className="mt-2 text-xs font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded inline-block">
                          Mua thêm {formatCurrency(voucher.minOrderAmount - subTotal)} để sử dụng
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">Hiện chưa có mã khuyến mãi nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default VoucherSelectorModal;
