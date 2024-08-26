import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { database, ref, get, set } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import './CourseDetailPage.css';

function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const { user } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (user) {
        try {
          const courseRef = ref(database, `courses/${courseId}`);
          const courseSnapshot = await get(courseRef);
          const courseData = courseSnapshot.val();

          if (courseData) {
            setCourse(courseData);
            setVideos(courseData.videos ? Object.values(courseData.videos) : []);
            if (courseData.questions) {
              const formattedQuestions = Object.entries(courseData.questions).map(([id, q]) => ({
                id,
                question: q.question,
                answers: q.answers ? Object.entries(q.answers) : [],
              }));
              setQuestions(formattedQuestions);
            } else {
              setQuestions([]);
            }
          } else {
            setError('Course not found.');
          }
        } catch (err) {
          setError('Failed to fetch course details. Please try again later.');
        }
      }
    };
    fetchCourseDetails();
  }, [courseId, user]);

  const handleAnswerSelect = (questionId, selectedAnswer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const userRef = ref(database, `users/${user.uid}/results/${courseId}`);
      await set(userRef, selectedAnswers);
      alert('Your answers have been submitted successfully!');
    } catch (error) {
      console.error('Error submitting answers:', error);
    }
  };

  return (
    <div className="course-detail-page">
      {error && <p className="error-message">{error}</p>}
      {course ? (
        <div>
          <h1>{course.name}</h1>
          <p>{course.description}</p>

          <div className="videos-section">
            <h2>Course Videos:</h2>
            {videos.length > 0 ? (
              <ul>
                {videos.map((video, index) => (
                  <li key={index}>
                    <video
                      autoPlay
                      muted={false}
                      controls={true}
                      src={video.url}
                      width="600"
                      loop
                    >
                      Your browser does not support the video tag.
                    </video>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No videos available.</p>
            )}
          </div>

          <div className="questions-section">
            {questions.length > 0 && (
              <div>
                <h2>Question {currentQuestionIndex + 1}:</h2>
                <div><strong>{questions[currentQuestionIndex].question}</strong></div>
                <ul>
                  {questions[currentQuestionIndex].answers.map(([key, answer]) => (
                    <li key={key}>
                      <label>
                        <input
                          type="radio"
                          name={`question-${questions[currentQuestionIndex].id}`}
                          value={key}
                          checked={selectedAnswers[questions[currentQuestionIndex].id] === key}
                          onChange={() => handleAnswerSelect(questions[currentQuestionIndex].id, key)}
                        />
                        {answer}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="navigation-buttons">
                  <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    Previous
                  </button>
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNextQuestion}>Next</button>
                  ) : (
                    <button onClick={handleSubmit}>Submit</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Loading course details...</p>
      )}
    </div>
  );
}

export default CourseDetailPage;
