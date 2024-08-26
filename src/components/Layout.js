import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div>
      <Navbar /> {/* الـ Navbar يظهر فقط في الصفحات التي تستخدم هذا التخطيط */}
      <Outlet /> {/* يتم عرض المكونات الفرعية هنا */}
    </div>
  );
}

export default Layout;
