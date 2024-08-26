import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import WelcomePage from './pages/WelcomePage';
import AdminPage from './pages/AdminPage';
import CoursePage from './pages/CoursePage';
import CourseDetailPage from './pages/CourseDetailPage'; // استيراد صفحة تفاصيل الكورس
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/course/:courseId" element={<CourseDetailPage />} /> {/* إضافة المسار لصفحة تفاصيل الكورس */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
