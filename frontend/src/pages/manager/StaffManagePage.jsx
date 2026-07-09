import { useState, useEffect } from 'react';
import { UserService } from '../../services/user.service';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Plus, Trash2, Shield, User as UserIcon, X, Search, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  quan_ly: { label: 'Quản Lý', badge: 'bg-primary-100 text-primary-700 border-primary-200' },
  nhan_vien: { label: 'Nhân Viên', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  khach_hang: { label: 'Khách Hàng', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
};

const StaffManagePage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore(state => state.user);
  
  // Search & Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'khach_hang'
  });

  const [deletingId, setDeletingId] = useState(null);

  // Password reset states
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 6) {
      return toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
    }
    
    setIsResettingPassword(true);
    try {
      await UserService.updateStaff(resetPasswordUser._id, { password: newPasswordValue });
      toast.success(`Đã đổi mật khẩu tài khoản ${resetPasswordUser.name} thành "${newPasswordValue}"`);
      setResetPasswordUser(null);
      setNewPasswordValue('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu lúc này');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await UserService.getAllUsers({ search, role: roleFilter });
      if (res.success) {
        setStaffList(res.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStaff();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Vui lòng điền đầy đủ thông tin');
    }
    
    setIsSubmitting(true);
    try {
      await UserService.createStaff(formData);
      toast.success('Tạo tài khoản thành công');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'khach_hang' });
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi khi tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác!')) return;
    
    setDeletingId(id);
    try {
      await UserService.deleteStaff(id);
      toast.success('Đã xóa tài khoản');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản lúc này');
    } finally {
      setDeletingId(null);
    }
  };

  const isProtectedUser = (user) => {
    return user.email === 'admin@gmail.com' || (currentUser && user._id === currentUser._id);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-admin mb-2">Quản Lý Tài Khoản</h1>
          <p className="text-slate-500 font-medium">Kiểm soát tài khoản và phân quyền cho người dùng hệ thống</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm tài khoản
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản theo tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800 placeholder-slate-400 bg-white"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800 bg-white cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="khach_hang">Khách hàng</option>
            <option value="nhan_vien">Nhân viên</option>
            <option value="quan_ly">Quản lý</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading && staffList.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-5">Tài khoản</th>
                  <th className="px-6 py-5">Vai trò</th>
                  <th className="px-6 py-5">Ngày tham gia</th>
                  <th className="px-6 py-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="text-sm text-slate-500">{staff.email}</div>
                          {staff.phone && <div className="text-xs text-slate-400 font-semibold">{staff.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${ROLE_CONFIG[staff.role]?.badge || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {staff.role === 'quan_ly' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                        {ROLE_CONFIG[staff.role]?.label || 'Không rõ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setResetPasswordUser(staff);
                          setNewPasswordValue('123456');
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors inline-flex"
                        title="Đổi mật khẩu"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      {!isProtectedUser(staff) ? (
                        <button
                          onClick={() => handleDelete(staff._id)}
                          disabled={deletingId === staff._id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50 inline-flex"
                          title="Xóa tài khoản"
                        >
                          {deletingId === staff._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      ) : (
                        <span className="p-2 text-slate-300 cursor-not-allowed inline-flex" title="Không thể xóa tài khoản này">
                          <Trash2 className="w-5 h-5 opacity-45" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                      Không tìm thấy tài khoản nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 font-admin">Thêm Tài Khoản</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên tài khoản</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800"
                  placeholder="VD: nv.a@nhahang.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800"
                >
                  <option value="khach_hang">Khách Hàng</option>
                  <option value="nhan_vien">Nhân Viên (Bếp/Phục vụ/Thu ngân)</option>
                  <option value="quan_ly">Quản Lý (Toàn quyền)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setResetPasswordUser(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 font-admin">Đặt Lại Mật Khẩu</h3>
              <button onClick={() => setResetPasswordUser(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-500 mb-4 text-sm font-medium">
              Đổi mật khẩu cho tài khoản: <strong className="text-slate-800">{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPasswordValue}
                  onChange={e => setNewPasswordValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800 font-mono text-lg"
                  placeholder="Nhập mật khẩu mới"
                />
                <p className="text-xs text-slate-400 mt-1">Mật khẩu mới phải có ít nhất 6 ký tự.</p>
              </div>

              <div className="flex gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResettingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagePage;
