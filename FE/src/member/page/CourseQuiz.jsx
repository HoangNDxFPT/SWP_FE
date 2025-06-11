import React, { useState, useEffect } from 'react'

function CourseQuiz() {
    const [selected, setSelected] = useState({});
    const [course, setCourse] = useState(null);
    const [quizList, setQuizList] = useState([]);

    useEffect(() => {
        const courseId = localStorage.getItem('course_id');
        if (courseId) {
            fetch(`http://localhost:5000/Courses/${courseId}`)
                .then(res => res.json())
                .then(data => setCourse(data));

            fetch(`http://localhost:5000/CourseQuiz?course_id=${courseId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) setQuizList(data);
                });
        }
    }, []);

    const handleSelect = (quizId, idx) => {
        setSelected(prev => ({ ...prev, [quizId]: idx }));
    };

    return (
        <>
            <div className="bg-gradient-to-b from-cyan-100 to-white py-4 min-h-screen">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Breadcrumb & Title */}
                    <div className="flex items-center gap-2 text-gray-700 text-lg mb-2">
                        <span className="text-2xl">&#9776;</span>
                        <span className="uppercase tracking-widest text-sm">E-COURSES</span>
                        <span className="mx-1 text-cyan-400">•</span>
                        <span className="font-bold text-lg tracking-wide">{course ? course.name?.toUpperCase() : ''}</span>
                    </div>
                    {/* Step Title */}
                    <div className="text-center mt-6 mb-2">
                        <div className="text-cyan-700 italic text-3xl font-semibold mb-4">
                            Check Your Vocabulary
                        </div>
                        <hr className="border-t border-gray-300 mb-6" />
                    </div>
                    {/* Quiz Content */}
                    <div className="text-center mb-8">
                        <p className="text-gray-700 text-lg mb-6">
                            You will next be reading from <span className="italic">{course ? course.name : ''}</span> booklet. Before you begin, check your understanding of the following words that have to do with drugs:
                        </p>
                        {quizList.map((quiz) => (
                            <div key={quiz.id} className="mb-10">
                                <div className="font-bold text-2xl mb-6">
                                    {quiz.question}
                                </div>
                                <form className="flex flex-col items-start gap-6 max-w-2xl mx-auto">
                                    {Array.isArray(quiz.answer) && quiz.answer.map((ans, idx) => (
                                        <label key={idx} className="flex items-center gap-3 cursor-pointer text-lg">
                                            <input
                                                type="radio"
                                                name={`quiz_${quiz.id}`}
                                                checked={selected[quiz.id] === idx}
                                                onChange={() => handleSelect(quiz.id, idx)}
                                                className="accent-cyan-600 w-5 h-5"
                                            />
                                            {ans}
                                        </label>
                                    ))}
                                </form>
                            </div>
                        ))}
                        <div className="flex justify-center mt-8 mb-12">
                            <button
                                className="border-2 border-cyan-400 text-cyan-600 text-xl font-semibold px-16 py-3 rounded transition hover:bg-cyan-50 tracking-widest"
                                disabled={quizList.length === 0 || Object.keys(selected).length !== quizList.length}
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CourseQuiz
