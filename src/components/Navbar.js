import React from 'react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <ul>
        <li><a href="/welcome">Home</a></li>
        <li><a href="/admin">Admin</a></li>
        <li><a href="/course">Courses</a></li>
        {/* أضف المزيد من الروابط هنا حسب الحاجة */}
      </ul>
    </nav>
  );
}

export default Navbar;
