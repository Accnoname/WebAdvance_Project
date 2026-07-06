import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  Percent, DollarSign, Calendar, X, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { VoucherService } from '../../services/voucher.service';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: 0,
  maxUses: '',
  expiryDate: '',
  description: '',
  isAvailable: true
};

const VoucherFormModal = ({ voucher, onClose, onSaved }) => {
  const isEdit = !!voucher?._id;
  const [form, setForm] = useState(
    isEdit
      ? {
          ...voucher,
          expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split('T')[0] : '',
          maxUses: voucher.maxUses ?? ''
        }
      : { ...EMPTY_FORM }
  );
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Vui lòng nhập mã voucher!');
    if (!form.discountValue || Number(form.discountValue) <= 0) return toast.error('Giá trị giảm phải lớn hơn 0!');
    if (!form.expiryDate) return toast.error('Vui lòng chọn ngày hết hạn!');
    if (new Date(form.expiryDate) < new Date() && !isEdit) return toast.error('Ngày hết hạn không được ở quá khứ!');

    try {
      setLoading(true);
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxUses: form.maxUses !== '' ? Number(form.maxUses) : null,
        expiryDate: new Date(form.expiryDate).toISOString()
      };

      if (isEdit) {
        await VoucherService.update(voucher._id, payload);
        toast.success('Cập nhật voucher thành công!');
      } else {
        await VoucherService.create(payload);
        toast.success('Tạo voucher mới thành công!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 font-admin">
            {isEdit ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mã voucher */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã Voucher <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="VD: SUMMER20"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isEdit}
            />
          </div>

          {/* Loại giảm giá */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại Giảm Giá <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {[
                { value: 'percentage', label: 'Phần trăm (%)', icon: Percent },
                { value: 'fixed', label: 'Số tiền cố định', icon: DollarSign }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('discountType', value)}
                  className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.discountType === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Giá trị giảm & Đơn tối thiểu */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Giá trị giảm {form.discountType === 'percentage' ? '(%)' : '(VNĐ)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={e => set('discountValue', e.target.value)}
                min="1"
                max={form.discountType === 'percentage' ? 100 : undefined}
                placeholder={form.discountType === 'percentage' ? '10' : '50000'}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={e => set('minOrderAmount', e.target.value)}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Số lượt dùng & Ngày hết hạn */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số lượt dùng tối đa</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => set('maxUses', e.target.value)}
                min="1"
                placeholder="Không giới hạn"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày hết hạn <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => set('expiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="VD: Giảm 20% dịp hè 2025"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Trạng thái */}
          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-semibold text-slate-700">Đang kích hoạt</span>
              <button
                type="button"
                onClick={() => set('isAvailable', !form.isAvailable)}
                className={`transition-colors ${form.isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}
              >
                {form.isAvailable ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Đang lưu...' : (
                <><Check className="w-4 h-4" /> {isEdit ? 'Cập nhật' : 'Tạo mới'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VouchersManagePage = () => {
  useDocumentTitle('Quản Lý Voucher');

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [modalVoucher, setModalVoucher] = useState(null); // null=closed, {}=create, {_id,...}=edit

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await VoucherService.getAll({ page, limit, search });
      if (res.success) {
        setVouchers(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleToggle = async (v) => {
    try {
      await VoucherService.update(v._id, { isAvailable: !v.isAvailable });
      toast.success(v.isAvailable ? 'Đã tắt voucher' : 'Đã bật voucher');
      fetchVouchers();
    } catch { toast.error('Có lỗi xảy ra!'); }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Xóa vĩnh viễn voucher "${v.code}"? Hành động này không thể hoàn tác!`)) return;
    try {
      await VoucherService.remove(v._id);
      toast.success('Đã xóa voucher');
      fetchVouchers();
    } catch { toast.error('Có lỗi xảy ra!'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const isExpired = (d) => d && new Date(d) < new Date();

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1400px] mx-auto min-h-full bg-slate-50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-admin tracking-tight">Quản Lý Voucher</h1>
          <p className="text-slate-500 mt-1 text-sm font-sans">Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <button
          onClick={() => setModalVoucher({})}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo Voucher Mới
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã voucher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
          <span className="text-sm text-slate-500">Tổng: <strong className="text-slate-700">{total}</strong> voucher</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã Voucher</th>
                <th className="px-6 py-4 font-semibold">Loại Giảm</th>
                <th className="px-6 py-4 font-semibold">Giá Trị</th>
                <th className="px-6 py-4 font-semibold">Đơn Tối Thiểu</th>
                <th className="px-6 py-4 font-semibold">Đã Dùng</th>
                <th className="px-6 py-4 font-semibold">Hết Hạn</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Đang tải...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Chưa có voucher nào</td></tr>
              ) : vouchers.map(v => (
                <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary-500 shrink-0" />
                      <span className="font-mono font-bold text-slate-900">{v.code}</span>
                    </div>
                    {v.description && <p className="text-xs text-slate-400 mt-0.5 ml-6">{v.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${v.discountType === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {v.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono">
                    {v.discountType === 'percentage' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')}đ`}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                    {v.minOrderAmount > 0 ? `${v.minOrderAmount.toLocaleString('vi-VN')}đ` : 'Không giới hạn'}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700">
                    {v.usedCount} / {v.maxUses ?? '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${isExpired(v.expiryDate) ? 'text-rose-500' : 'text-slate-600'}`}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {fmtDate(v.expiryDate)}
                      {isExpired(v.expiryDate) && <span className="text-rose-500">(Hết hạn)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleToggle(v)} className={`transition-colors ${v.isAvailable ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {v.isAvailable ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModalVoucher(v)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Tổng <span className="font-bold text-slate-700">{total}</span> voucher
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 px-2">Trang {page} / {Math.max(1, Math.ceil(total / limit))}</span>
            <button
              disabled={page >= Math.max(1, Math.ceil(total / limit))}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modalVoucher !== null && (
        <VoucherFormModal
          voucher={Object.keys(modalVoucher).length === 0 ? null : modalVoucher}
          onClose={() => setModalVoucher(null)}
          onSaved={fetchVouchers}
        />
      )}
    </div>
  );
};

export default VouchersManagePage;
