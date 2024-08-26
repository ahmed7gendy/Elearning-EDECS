import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './AdminPage.css';

function AdminPage() {
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState({});
    const [courses, setCourses] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const auth = getAuth();
    const database = getDatabase();

    useEffect(() => {
        const fetchAdminsAndUsers = async () => {
            try {
                // Fetch admins
                const adminRef = ref(database, 'admins');
                onValue(adminRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setAdmins(Object.keys(data));
                    } else {
                        setAdmins([]);
                    }
                });

                // Fetch users
                const userRef = ref(database, 'users');
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setUsers(Object.keys(data));
                    } else {
                        setUsers([]);
                    }
                });

                // Fetch roles
                const roleRef = ref(database, 'roles');
                onValue(roleRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setRoles(data);
                    }
                });

                // Fetch courses
                const courseRef = ref(database, 'courses');
                onValue(courseRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setCourses(Object.keys(data));
                    }
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchAdminsAndUsers();
    }, []);

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddUser = async () => {
        if (newEmail && password) {
            try {
                if (!isValidEmail(newEmail)) {
                    setError('Invalid email address.');
                    return;
                }

                const sanitizedEmail = newEmail.replace(/\./g, ',');
                const role = isAdmin ? 'admin' : 'user';

                // Create user with email and password
                await createUserWithEmailAndPassword(auth, newEmail, password);

                // Add user role
                await set(ref(database, `roles/${sanitizedEmail}`), {
                    email: newEmail,
                    role: role,
                    courses: []
                });

                // Add user to users list
                await set(ref(database, `users/${sanitizedEmail}`), {
                    email: newEmail,
                    role: role
                });

                if (isAdmin) {
                    // Add admin to admins list
                    await set(ref(database, `admins/${sanitizedEmail}`), {
                        email: newEmail
                    });
                }

                setSuccess('User added successfully!');
                setNewEmail('');
                setPassword('');
                setIsAdmin(false);
                setShowPassword(false);
            } catch (error) {
                setError('Failed to add user. Please try again.');
                console.error('Error adding user:', error);
            }
        } else {
            setError('Email and password are required.');
        }
    };

    const handleResetPassword = async (email) => {
        const trimmedEmail = email.trim();
        if (!isValidEmail(trimmedEmail)) {
            setError('Invalid email address.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, trimmedEmail);
            setSuccess('Password reset email sent!');
        } catch (error) {
            let errorMessage = 'Failed to send password reset email.';
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No user found with this email.';
            } else if (error.code === 'auth/missing-email') {
                errorMessage = 'Email address is missing.';
            }
            setError(errorMessage);
            console.error('Error sending password reset email:', error);
        }
    };

    const handleRoleChange = async (email, newRole) => {
        try {
            const sanitizedEmail = email.replace(/\./g, ',');
            await set(ref(database, `roles/${sanitizedEmail}/role`), newRole);
            setRoles((prevRoles) => ({
                ...prevRoles,
                [sanitizedEmail]: { ...prevRoles[sanitizedEmail], role: newRole }
            }));
            setSuccess('Role updated successfully!');
        } catch (error) {
            setError('Failed to update role.');
            console.error('Error updating role:', error);
        }
    };

    const handleCourseSelectionChange = (email, courseId, isChecked) => {
        const sanitizedEmail = email.replace(/\./g, ',');
        const updatedCourses = isChecked
            ? [...(roles[sanitizedEmail]?.courses || []), courseId]
            : (roles[sanitizedEmail]?.courses || []).filter(c => c !== courseId);

        set(ref(database, `roles/${sanitizedEmail}/courses`), updatedCourses);
        setRoles((prevRoles) => ({
            ...prevRoles,
            [sanitizedEmail]: { ...prevRoles[sanitizedEmail], courses: updatedCourses }
        }));
    };

    const handleRemoveUser = async (email) => {
        try {
            const sanitizedEmail = email.replace(/\./g, ',');

            // Remove from admins
            await set(ref(database, `admins/${sanitizedEmail}`), null);

            // Remove from users
            await set(ref(database, `users/${sanitizedEmail}`), null);

            // Remove from roles
            await set(ref(database, `roles/${sanitizedEmail}`), null);

            setSuccess('User removed successfully!');
        } catch (error) {
            setError('Failed to remove user.');
            console.error('Error removing user:', error);
        }
    };

    const handleDisableUser = async (email) => {
        try {
            const sanitizedEmail = email.replace(/\./g, ',');
            // Update user role to 'disabled'
            await set(ref(database, `roles/${sanitizedEmail}/role`), 'disabled');
            setRoles((prevRoles) => ({
                ...prevRoles,
                [sanitizedEmail]: { ...prevRoles[sanitizedEmail], role: 'disabled' }
            }));
            setSuccess('User disabled successfully!');
        } catch (error) {
            setError('Failed to disable user.');
            console.error('Error disabling user:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="admin-page">
            <h2>Admin Page</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <div>
                <h3>Add New User:</h3>
                <input
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                />
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
                <label>
                    <input
                        type="checkbox"
                        checked={isAdmin}
                        onChange={() => setIsAdmin(!isAdmin)}
                    />
                    Register as Admin
                </label>
                <button onClick={handleAddUser}>Add User</button>
            </div>
            <h3>Admins:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                        <th>Courses</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.length > 0 ? (
                        admins.map((admin, index) => (
                            <tr key={index}>
                                <td>{admin}</td>
                                <td>
                                    <select
                                        value={roles[admin.replace(/\./g, ',')]?.role || 'user'}
                                        onChange={(e) => handleRoleChange(admin, e.target.value)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </td>
                                <td className="actions">
                                    <button onClick={() => handleResetPassword(admin)}>Reset Password</button>
                                    <button onClick={() => handleRemoveUser(admin)}>Remove User</button>
                                    <button onClick={() => handleDisableUser(admin)}>Disable User</button>
                                </td>
                                <td>
                                    {courses.map((course) => (
                                        <label key={course}>
                                            <input
                                                type="checkbox"
                                                checked={roles[admin.replace(/\./g, ',')]?.courses?.includes(course) || false}
                                                onChange={(e) => handleCourseSelectionChange(admin, course, e.target.checked)}
                                            />
                                            {course}
                                        </label>
                                    ))}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No admins available</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <h3>Users:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                        <th>Courses</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user, index) => (
                            <tr key={index}>
                                <td>{user}</td>
                                <td>
                                    <select
                                        value={roles[user.replace(/\./g, ',')]?.role || 'user'}
                                        onChange={(e) => handleRoleChange(user, e.target.value)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </td>
                                <td className="actions">
                                    <button onClick={() => handleResetPassword(user)}>Reset Password</button>
                                    <button onClick={() => handleRemoveUser(user)}>Remove User</button>
                                    <button onClick={() => handleDisableUser(user)}>Disable User</button>
                                </td>
                                <td>
                                    {courses.map((course) => (
                                        <label key={course}>
                                            <input
                                                type="checkbox"
                                                checked={roles[user.replace(/\./g, ',')]?.courses?.includes(course) || false}
                                                onChange={(e) => handleCourseSelectionChange(user, course, e.target.checked)}
                                            />
                                            {course}
                                        </label>
                                    ))}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No users available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AdminPage;
