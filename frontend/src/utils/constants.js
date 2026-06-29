export const ROLES = {
  MANAGER: 'quan_ly',
  STAFF: 'nhan_vien',
  CUSTOMER: 'khach_hang',
};

export const ORDER_STATUS = {
  NEW: 'moi',
  PROCESSING: 'dang_xu_ly',
  COMPLETED: 'hoan_thanh',
  CANCELLED: 'da_huy',
};

export const ORDER_ITEM_STATUS = {
  PENDING: 'cho_xac_nhan',
  PREPARING: 'dang_che_bien',
  DONE: 'hoan_thanh',
  CANCELLED: 'huy',
};

export const TABLE_STATUS = {
  EMPTY: 'trong',
  SERVING: 'dang_phuc_vu',
  RESERVED: 'dat_truoc',
  CLOSED: 'dong',
};

export const PAYMENT_METHOD = {
  CASH: 'tien_mat',
  TRANSFER: 'chuyen_khoan',
  VNPAY: 'vnpay',
};

export const MENU_CATEGORY = {
  STARTER: 'khai_vi',
  MAIN: 'chinh',
  DESSERT: 'trang_mieng',
  DRINK: 'nuoc',
};

export const STATUS_LABELS = {
  moi: 'Mới',
  dang_xu_ly: 'Đang xử lý',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
  trong: 'Trống',
  dang_phuc_vu: 'Đang phục vụ',
  dat_truoc: 'Đặt trước',
  dong: 'Đóng cửa',
};
