// src/pages/AdminDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Welcome to the Dashboard</h1>
      <div className="dashboard-content">
        <div className="section">
          <h2>Available Courses:</h2>
          <ul>
            <li>on-pord</li>
            {/* Add more course items dynamically here */}
          </ul>
        </div>
        <div className="section">
          <Link to="/manage-users" className="button">Manage Users</Link>
          <Link to="/add-course" className="button">Add Course</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
