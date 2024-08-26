import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import './WelcomePage.css';

function WelcomePage() {
    const [courses, setCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const { user } = useAuth();
    const [error, setError] = useState(null);
    const database = getDatabase();

    useEffect(() => {
        if (user) {
            const sanitizedEmail = user.email.replace(/\./g, ',');
            const userRoleRef = ref(database, `roles/${sanitizedEmail}`);
            onValue(userRoleRef, (snapshot) => {
                const roleData = snapshot.val();
                if (roleData && roleData.courses) {
                    setAvailableCourses(roleData.courses);
                }
            }, (error) => {
                console.error('Error fetching role data:', error);
                setError('Failed to fetch user courses. Please try again later.');
            });

            const coursesRef = ref(database, 'courses');
            onValue(coursesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setCourses(Object.entries(data).map(([id, course]) => ({
                        id,
                        ...course,
                    })));
                }
            }, (error) => {
                console.error('Error fetching courses:', error);
                setError('Failed to fetch courses. Please try again later.');
            });
        }
    }, [user, database]);

    return (
        <div className="welcome-page">
            <h1>Welcome to the Dashboard{user ? `, ${user.email}` : ''}</h1>
            {error && <p className="error-message">{error}</p>}
            {availableCourses.length > 0 ? (
                <div>
                    <h2>Available Courses:</h2>
                    <ul>
                        {courses
                            .filter(course => availableCourses.includes(course.id))
                            .map((course) => (
                                <li key={course.id}>
                                    <Link to={`/course/${course.id}`}>{course.name}</Link>
                                </li>
                            ))}
                    </ul>
                </div>
            ) : (
                <div>No courses available at the moment.</div>
            )}
        </div>
    );
}

export default WelcomePage;
