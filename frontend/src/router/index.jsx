import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import StaffLayout from '../components/layout/StaffLayout';
import ManagerLayout from '../components/layout/ManagerLayout';

// Customer Pages
import LandingPage from '../pages/customer/LandingPage';
import MenuPage from '../pages/customer/MenuPage';
import CartPage from '../pages/customer/CartPage';
import MyOrdersPage from '../pages/customer/MyOrdersPage';
import PaymentPage from '../pages/customer/PaymentPage';
import ReservationPage from '../pages/customer/ReservationPage';

// Staff Pages
import StaffDashboard from '../pages/staff/DashboardPage';
import KitchenPage from '../pages/staff/KitchenPage';
import TablesPage from '../pages/staff/TablesPage';
import StaffOrdersPage from '../pages/staff/StaffOrdersPage';

// Manager Pages
import ManagerDashboard from '../pages/manager/DashboardPage';
import MenuManagePage from '../pages/manager/MenuManagePage';
import TableManagePage from '../pages/manager/TableManagePage';
import StaffManagePage from '../pages/manager/StaffManagePage';
import ReportPage from '../pages/manager/ReportPage';
import ReservationsManagePage from '../pages/manager/ReservationsManagePage';

// Route Guard component
const PrivateRoute = ({ children, roles, redirectIfUnauthorized = true }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    if (!redirectIfUnauthorized) return <Navigate to="/" replace />;
    // Redirect về trang chính của role khi bị chặn
    if (user.role === 'quan_ly') return <Navigate to="/manager" replace />;
    if (user.role === 'nhan_vien') return <Navigate to="/staff/kitchen" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  // Auth Routes (No Layout)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Customer Routes (Dark Premium)
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'cart', element: <PrivateRoute roles={['khach_hang', 'nhan_vien', 'quan_ly']}><CartPage /></PrivateRoute> },
      { path: 'my-orders', element: <PrivateRoute roles={['khach_hang', 'nhan_vien', 'quan_ly']}><MyOrdersPage /></PrivateRoute> },
      { path: 'payment/:orderId', element: <PrivateRoute roles={['khach_hang', 'nhan_vien', 'quan_ly']}><PaymentPage /></PrivateRoute> },
      { path: 'reservation', element: <ReservationPage /> },
    ]
  },

  // Staff Routes (Dark, High Contrast)
  {
    path: '/staff',
    element: <PrivateRoute roles={['nhan_vien', 'quan_ly']}><StaffLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Navigate to="/staff/dashboard" replace /> },
      { path: 'dashboard', element: <StaffDashboard /> },
      { path: 'kitchen', element: <KitchenPage /> },
      { path: 'tables', element: <TablesPage /> },
      { path: 'orders', element: <StaffOrdersPage /> },
      { path: 'reservations', element: <ReservationsManagePage /> },
    ]
  },

  // Manager Routes (Executive Dashboard)
  {
    path: '/manager',
    element: <PrivateRoute roles={['quan_ly']}><ManagerLayout /></PrivateRoute>,
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: 'menu', element: <MenuManagePage /> },
      { path: 'tables', element: <TableManagePage /> },
      { path: 'staff', element: <StaffManagePage /> },
      { path: 'reports', element: <ReportPage /> },
      { path: 'reservations', element: <ReservationsManagePage /> },
    ]
  }
]);

export default router;
