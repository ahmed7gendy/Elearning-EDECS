import React, { useState, useEffect } from 'react';
import { uploadVideo, saveVideoURL } from '../videoUtils'; // Adjust path as needed
import { useAuth } from '../hooks/useAuth'; // Adjust path as needed
import { ref, get, set, push, remove } from 'firebase/database';
import { database } from '../firebase'; // Adjust path as needed
import './CoursePage.css'; // Adjust path as needed

function CoursePage() {
  const [courses, setCourses] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswers, setNewAnswers] = useState(['', '', '', '']);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      if (user) {
        try {
          const sanitizedEmail = user.email.replace(/\./g, ',');
          const roleRef = ref(database, `roles/${sanitizedEmail}`);
          const roleSnapshot = await get(roleRef);
          const roleData = roleSnapshot.val();

          if (roleData && roleData.role === 'admin') {
            setIsAdmin(true);
            const courseRef = ref(database, 'courses');
            const courseSnapshot = await get(courseRef);
            const courseData = courseSnapshot.val();

            if (courseData) {
              setCourses(Object.entries(courseData).map(([id, course]) => ({ id, ...course })));
            } else {
              setCourses([]);
            }
          } else {
            setIsAdmin(false);
            setError('Access Denied');
          }
        } catch (error) {
          console.error('Error fetching courses or role:', error);
          setError('Access Denied');
        }
      } else {
        setError('Access Denied');
      }
      setLoading(false);
    };

    fetchCourses();
  }, [user]);

  const handleCourseClick = async (course) => {
    if (isAdmin) {
      setSelectedCourse(course);
      const questionsRef = ref(database, `courses/${course.id}/questions`);
      const questionsSnapshot = await get(questionsRef);
      const questionsData = questionsSnapshot.val() || {};
      setQuestions(Object.entries(questionsData).map(([id, q]) => ({ id, ...q })));
    } else {
      setError('Access Denied');
    }
  };

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (videoFile && selectedCourse) {
      try {
        await uploadVideo(videoFile, (progress) => {
          setUploadProgress(progress);
        }).then(async (videoURL) => {
          await saveVideoURL(selectedCourse.id, videoURL, videoFile.name);
        });
      } catch (error) {
        console.error('Error uploading video:', error);
        setError('Failed to upload video');
      }
    } else {
      setError('Please select a video file and a course');
    }
  };

  const handleAddQuestion = async () => {
    if (newQuestion && newAnswers.every(ans => ans)) {
      try {
        const questionData = {
          question: newQuestion,
          answers: newAnswers.reduce((acc, ans, idx) => {
            acc[`option${idx + 1}`] = ans;
            return acc;
          }, {})
        };
        const questionsRef = ref(database, `courses/${selectedCourse.id}/questions`);
        const newQuestionRef = push(questionsRef);
        await set(newQuestionRef, questionData);
        setQuestions([...questions, { id: newQuestionRef.key, ...questionData }]);
        setNewQuestion('');
        setNewAnswers(['', '', '', '']);
      } catch (error) {
        console.error('Error adding question:', error);
        setError('Failed to add question');
      }
    } else {
      setError('Please fill in the question and all answers');
    }
  };

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...newAnswers];
    updatedAnswers[index] = value;
    setNewAnswers(updatedAnswers);
  };

  const handleAddCourse = async () => {
    if (newCourseName && newCourseDescription) {
      try {
        const courseData = {
          name: newCourseName,
          description: newCourseDescription,
        };
        const courseRef = ref(database, 'courses');
        const newCourseRef = push(courseRef);
        await set(newCourseRef, courseData);
        setCourses([...courses, { id: newCourseRef.key, ...courseData }]);
        setNewCourseName('');
        setNewCourseDescription('');
      } catch (error) {
        console.error('Error adding course:', error);
        setError('Failed to add course');
      }
    } else {
      setError('Please fill in course name and description');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await remove(ref(database, `courses/${courseId}`));
        setCourses(courses.filter(course => course.id !== courseId));
        setSelectedCourse(null);
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course');
      }
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await remove(ref(database, `courses/${selectedCourse.id}/questions/${questionId}`));
        setQuestions(questions.filter(question => question.id !== questionId));
      } catch (error) {
        console.error('Error deleting question:', error);
        setError('Failed to delete question');
      }
    }
  };

  const handleUpdateCourse = async () => {
    if (newCourseName && newCourseDescription && selectedCourse) {
      try {
        const updatedCourseData = {
          name: newCourseName,
          description: newCourseDescription,
        };
        await set(ref(database, `courses/${selectedCourse.id}`), updatedCourseData);
        setCourses(courses.map(course => (course.id === selectedCourse.id ? { ...course, ...updatedCourseData } : course)));
        setNewCourseName('');
        setNewCourseDescription('');
        setSelectedCourse(null);
      } catch (error) {
        console.error('Error updating course:', error);
        setError('Failed to update course');
      }
    } else {
      setError('Please fill in course name and description');
    }
  };

  const handleUpdateQuestion = async (questionId) => {
    const updatedQuestion = questions.find(q => q.id === questionId);
    if (updatedQuestion) {
      try {
        const updatedQuestionData = {
          question: newQuestion || updatedQuestion.question,
          answers: newAnswers.reduce((acc, ans, idx) => {
            acc[`option${idx + 1}`] = ans || updatedQuestion.answers[`option${idx + 1}`];
            return acc;
          }, {})
        };
        await set(ref(database, `courses/${selectedCourse.id}/questions/${questionId}`), updatedQuestionData);
        setQuestions(questions.map(q => (q.id === questionId ? { ...q, ...updatedQuestionData } : q)));
        setNewQuestion('');
        setNewAnswers(['', '', '', '']);
      } catch (error) {
        console.error('Error updating question:', error);
        setError('Failed to update question');
      }
    } else {
      setError('Question not found');
    }
  };

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="course-page">
      <header className="page-header">
        <h1 className="page-title">Course Management</h1>
        {error && <p className="error-message">{error}</p>}
      </header>
      
      {isAdmin && (
        <nav className="main-navbar">
          <ul>
            {selectedCourse && (
              <>
                <li><button className="btn" onClick={handleUpdateCourse}>Update Course</button></li>
                <li><button className="btn" onClick={() => handleDeleteCourse(selectedCourse.id)}>Delete Course</button></li>
                <li><button className="btn" onClick={handleAddQuestion}>Add Question</button></li>
                <li><button className="btn" onClick={handleUpload}>Upload Video</button></li>
              </>
            )}
          </ul>
        </nav>
      )}

      {isAdmin && selectedCourse && (
        <nav className="secondary-navbar">
          <ul>
            <li><button className="btn" onClick={() => setSelectedCourse(null)}>Back to Courses</button></li>
            <li><button className="btn" onClick={() => handleDeleteQuestion(question.id)}>Delete Question</button></li>
          </ul>
        </nav>
      )}

      {!selectedCourse ? (
        <div className="course-list">
          <h2>Select a Course</h2>
          {courses.map(course => (
            <div key={course.id} className="course-item" onClick={() => handleCourseClick(course)}>
              <h3>{course.name}</h3>
              <p>{course.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="course-details">
          <h2>{selectedCourse.name}</h2>
          <p>{selectedCourse.description}</p>

          <h3>Upload Video</h3>
          <input type="file" accept="video/*" onChange={handleFileChange} />
          <button className="btn" onClick={handleUpload}>Upload</button>
          {uploadProgress && <p>Upload progress: {uploadProgress}%</p>}

          <h3>Add Question</h3>
          <input
            type="text"
            placeholder="Enter question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          {newAnswers.map((answer, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Answer ${index + 1}`}
              value={answer}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            />
          ))}
          <button className="btn" onClick={handleAddQuestion}>Add Question</button>

          <h3>Questions</h3>
          {questions.map(question => (
            <div key={question.id} className="question-item">
              <p>{question.question}</p>
              {Object.entries(question.answers).map(([key, answer]) => (
                <p key={key}>{answer}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="add-course">
          <h2>Add New Course</h2>
          <input
            type="text"
            placeholder="Course Name"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />
          <textarea
            placeholder="Course Description"
            value={newCourseDescription}
            onChange={(e) => setNewCourseDescription(e.target.value)}
          />
          <button className="btn" onClick={handleAddCourse}>Add Course</button>
        </div>
      )}
    </div>
  );
}

export default CoursePage;
