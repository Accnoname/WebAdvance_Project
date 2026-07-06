import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/auth.service';
import { VoucherService } from '../../services/voucher.service';
import { Loader2, User, KeyRound, Ticket, Copy, Check, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password states
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Voucher states
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'vouchers') {
      fetchVouchers();
    }
  }, [activeTab]);

  const fetchVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const res = await VoucherService.getAvailableVouchers();
      if (res.success) {
        setVouchers(res.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách voucher');
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      return toast.error('Họ và tên không được để trống');
    }
    try {
      setUpdatingProfile(true);
      const res = await authService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone
      });
      if (res.success) {
        updateUser(res.data);
        toast.success('Cập nhật thông tin cá nhân thành công!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error('Vui lòng điền đầy đủ các trường mật khẩu');
    }
    if (newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Xác nhận mật khẩu mới không trùng khớp');
    }

    try {
      setUpdatingPassword(true);
      const res = await authService.changePassword({ oldPassword, newPassword });
      if (res.success) {
        toast.success('Thay đổi mật khẩu thành công!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const tabsConfig = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'password', label: 'Đổi mật khẩu', icon: KeyRound },
    { id: 'vouchers', label: 'Ưu đãi của bạn', icon: Ticket }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in text-[#f5e6c8]">
      {/* Page Header */}
      <div className="mb-10 pb-6 border-b border-stone-800/60 text-left">
        <h1 className="text-4xl font-display font-bold text-[#d4a85a] tracking-[0.15em] uppercase">TÀI KHOẢN CỦA BẠN</h1>
        <p className="text-[#d4c3a3] mt-2 font-medium text-sm">Quản lý thông tin hồ sơ cá nhân, bảo mật mật khẩu và theo dõi mã giảm giá.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-[#d4a85a] border-[#d4a85a] text-[#1a1208] shadow-md shadow-[#d4a85a]/10'
                    : 'bg-[#251b0f] border-stone-850 text-[#d4c3a3] hover:border-stone-800 hover:text-[#f5e6c8] hover:bg-[#1a1208]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents Panel */}
        <div className="md:col-span-3 bg-[#251b0f] border border-stone-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in-up text-left">
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-1 tracking-tight">Thông Tin Cá Nhân</h2>
                <p className="text-stone-500 text-xs font-medium">Cập nhật họ tên và số điện thoại liên lạc của bạn.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Địa chỉ Email (Không thể thay đổi)</label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850/80 text-stone-500 rounded-xl text-xs font-semibold focus:outline-none cursor-not-allowed opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Nhập họ và tên..."
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Số điện thoại</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Nhập số điện thoại..."
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full md:w-auto px-6 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-in-up text-left">
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-1 tracking-tight">Đổi Mật Khẩu</h2>
                <p className="text-stone-500 text-xs font-medium">Bảo mật tài khoản bằng cách thay đổi mật khẩu định kỳ.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu cũ..."
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Mật khẩu mới <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#d4c3a3]">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full px-4 py-3 bg-[#1a1208] border border-stone-850 text-[#f5e6c8] placeholder-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/25 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full md:w-auto px-6 py-3 bg-[#d4a85a] hover:bg-[#c2984a] text-[#1a1208] rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cập nhật mật khẩu'}
              </button>
            </form>
          )}

          {/* TAB 3: CUSTOMER VOUCHERS LIST */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6 animate-fade-in-up text-left">
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-1 tracking-tight">Ưu Đãi Của Bạn</h2>
                <p className="text-stone-500 text-xs font-medium">Danh sách các mã giảm giá đặc biệt đang khả dụng. Hãy sao chép để áp dụng khi thanh toán.</p>
              </div>

              {loadingVouchers ? (
                <div className="flex justify-center py-16 text-[#d4a85a]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-12 bg-[#1a1208] rounded-2xl border border-stone-850 border-dashed">
                  <span className="text-3xl mb-3 block">🎫</span>
                  <h4 className="text-sm font-bold text-white">Chưa có mã ưu đãi nào khả dụng</h4>
                  <p className="text-stone-500 text-xs mt-1">Chúng tôi sẽ sớm cập nhật các voucher mới. Hãy theo dõi nhé!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vouchers.map((voucher) => (
                    <div 
                      key={voucher._id} 
                      className="bg-[#1a1208] rounded-2xl border border-stone-850 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between aspect-[8/5] group hover:border-[#d4a85a]/40 transition-all duration-300"
                    >
                      {/* Ticket Notch decorations (left and right cutouts) */}
                      <div className="absolute top-1/2 left-[-8px] transform -translate-y-1/2 w-4 h-4 bg-[#251b0f] border-r border-stone-850 rounded-full z-15" />
                      <div className="absolute top-1/2 right-[-8px] transform -translate-y-1/2 w-4 h-4 bg-[#251b0f] border-l border-stone-850 rounded-full z-15" />
                      
                      {/* Brand & Value */}
                      <div className="flex justify-between items-start gap-2 border-b border-dashed border-stone-800/80 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#d4c3a3] uppercase tracking-wider">Mã Giảm Giá</span>
                          <span className="text-sm font-mono font-bold text-[#d4a85a] tracking-wider mt-0.5">{voucher.code}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-white leading-none">
                            {voucher.discountType === 'percentage' 
                              ? `Giảm ${voucher.discountValue}%` 
                              : `Giảm ${voucher.discountValue.toLocaleString('vi-VN')}đ`}
                          </div>
                          {voucher.discountType === 'percentage' && voucher.maxDiscountAmount && (
                            <span className="text-[9px] text-stone-500 font-bold block mt-1">
                              Tối đa {voucher.maxDiscountAmount.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Conditions & Actions */}
                      <div className="mt-3 flex justify-between items-end gap-2">
                        <div className="space-y-1">
                          <div className="text-[9px] text-[#d4c3a3] font-medium leading-none">
                            Đơn tối thiểu: <span className="text-white font-bold">{voucher.minOrderAmount.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <div className="text-[9px] text-stone-500 font-medium leading-none">
                            Hạn dùng: <span className="text-stone-400 font-bold">{new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Copy Code button */}
                        <button
                          type="button"
                          onClick={() => handleCopyCode(voucher.code)}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-950/60 to-amber-900/60 text-[#d4a85a] hover:from-amber-900/80 hover:to-amber-850/80 rounded-lg border border-[#d4a85a]/25 text-[10px] font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                        >
                          {copiedCode === voucher.code ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
