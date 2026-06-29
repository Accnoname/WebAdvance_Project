import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Customer Pages
import MenuPage from '../pages/customer/MenuPage';
import CartPage from '../pages/customer/CartPage';
import MyOrdersPage from '../pages/customer/MyOrdersPage';
import PaymentPage from '../pages/customer/PaymentPage';

// Staff Pages
import StaffDashboard from '../pages/staff/DashboardPage';
import TablesPage from '../pages/staff/TablesPage';
import StaffOrdersPage from '../pages/staff/StaffOrdersPage';
import KitchenPage from '../pages/staff/KitchenPage';

// Manager Pages
import ManagerDashboard from '../pages/manager/DashboardPage';
import MenuManagePage from '../pages/manager/MenuManagePage';
import TableManagePage from '../pages/manager/TableManagePage';
import StaffManagePage from '../pages/manager/StaffManagePage';
import ReportPage from '../pages/manager/ReportPage';

// Route Guard component
const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const router = createBrowserRouter([
  // Auth Routes (No Layout)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // App Routes (With Layout)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Customer routes
      { index: true, element: <MenuPage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'cart', element: <PrivateRoute><CartPage /></PrivateRoute> },
      { path: 'my-orders', element: <PrivateRoute><MyOrdersPage /></PrivateRoute> },
      { path: 'payment/:orderId', element: <PrivateRoute><PaymentPage /></PrivateRoute> },

      // Staff routes
      { path: 'staff', element: <PrivateRoute roles={['nhan_vien', 'quan_ly']}><StaffDashboard /></PrivateRoute> },
      { path: 'staff/tables', element: <PrivateRoute roles={['nhan_vien', 'quan_ly']}><TablesPage /></PrivateRoute> },
      { path: 'staff/orders', element: <PrivateRoute roles={['nhan_vien', 'quan_ly']}><StaffOrdersPage /></PrivateRoute> },
      { path: 'staff/kitchen', element: <PrivateRoute roles={['nhan_vien', 'quan_ly']}><KitchenPage /></PrivateRoute> },

      // Manager routes
      { path: 'manager', element: <PrivateRoute roles={['quan_ly']}><ManagerDashboard /></PrivateRoute> },
      { path: 'manager/menu', element: <PrivateRoute roles={['quan_ly']}><MenuManagePage /></PrivateRoute> },
      { path: 'manager/tables', element: <PrivateRoute roles={['quan_ly']}><TableManagePage /></PrivateRoute> },
      { path: 'manager/staff', element: <PrivateRoute roles={['quan_ly']}><StaffManagePage /></PrivateRoute> },
      { path: 'manager/reports', element: <PrivateRoute roles={['quan_ly']}><ReportPage /></PrivateRoute> },
    ]
  }
]);

export default router;
