import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-[#1a1208] text-[#f5e6c8] font-body selection:bg-primary-500 selection:text-white">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
