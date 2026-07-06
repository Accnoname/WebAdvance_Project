import { useState, useEffect } from 'react';
import { MenuService } from '../../services/menu.service';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'khai_vi', label: 'Khai vị' },
  { id: 'chinh', label: 'Món chính' },
  { id: 'trang_mieng', label: 'Tráng miệng' },
  { id: 'nuoc', label: 'Thức uống' }
];

const MenuManagePage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'chinh',
    price: '',
    prepareTime: 15
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await MenuService.getAll({});
      if (response.success) {
        setMenuItems(response.data);
      }
    } catch (error) {
      toast.error('Không tải được thực đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        prepareTime: item.prepareTime
      });
      setPreviewImage(item.image.startsWith('http') ? item.image : `http://localhost:3000${item.image}`);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: 'chinh',
        price: '',
        prepareTime: 15
      });
      setPreviewImage(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      submitData.append('prepareTime', formData.prepareTime);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingItem) {
        await MenuService.update(editingItem._id, submitData);
        toast.success('Cập nhật thành công!');
      } else {
        await MenuService.create(submitData);
        toast.success('Thêm món thành công!');
      }
      
      setIsModalOpen(false);
      fetchMenu();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa món này không?')) {
      try {
        await MenuService.delete(id);
        toast.success('Xóa món thành công');
        fetchMenu();
      } catch (error) {
        toast.error('Không thể xóa món này');
      }
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await MenuService.toggleAvailability(id);
      fetchMenu();
      toast.success('Đã cập nhật trạng thái món');
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-stone-900">Quản Lý Menu</h1>
          <p className="text-stone-500 mt-2">Thêm, sửa, xóa các món ăn trong thực đơn</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm Món Mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-stone-900 uppercase font-display font-bold text-xs border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">Món ăn</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            item.image
                              ? (item.image.startsWith('http') ? item.image : `http://localhost:3000${item.image}`)
                              : 'https://placehold.co/48x48/e7e5e4/78716c?text=No+Img'
                          }
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100"
                        />
                        <div>
                          <div className="font-bold text-stone-900 text-base">{item.name}</div>
                          <div className="text-stone-500 text-xs mt-0.5 line-clamp-1 w-48">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium">
                        {CATEGORIES.find(c => c.id === item.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary-600">
                      {item.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item._id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          item.isAvailable ? 'bg-green-500' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-stone-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-stone-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-display font-bold text-stone-900">
                {editingItem ? 'Cập Nhật Món Ăn' : 'Thêm Món Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload Area */}
              <div className="flex justify-center">
                <div className="relative group cursor-pointer w-40 h-40 rounded-2xl overflow-hidden border-2 border-dashed border-stone-300 hover:border-primary-500 transition-colors bg-stone-50 flex flex-col items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-stone-400 mb-2" />
                      <span className="text-xs font-medium text-stone-500">Tải ảnh lên</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {previewImage && (
                    <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-sm font-medium">Đổi ảnh</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Tên món ăn <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Danh mục <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Giá bán (VNĐ) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">TG Chuẩn bị (Phút) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.prepareTime}
                    onChange={(e) => setFormData({ ...formData, prepareTime: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-stone-700">Mô tả chi tiết</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/30 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagePage;
