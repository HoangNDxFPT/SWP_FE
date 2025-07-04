import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';

function CourseVideo() {
    const [course, setCourse] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const courseId = id || localStorage.getItem('course_id');
        if (!courseId) return;

        api.get(`courses/${courseId}`)
            .then(res => {
                if (res.status === 200 && res.data) {
                    setCourse(res.data);
                    localStorage.setItem('course_id', courseId);
                }
            })
            .catch(err => {
                console.error('Error fetching course:', err);
            });
    }, [id]);

    const handleContinue = () => {
        if (course) {
            navigate(`/quiz/${course.id}`);
        }
    };

    return (
        <>
            <Header />
            <div className="bg-gradient-to-b from-cyan-100 to-white py-4">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-2 text-gray-700 text-lg mb-2">
                        <span className="text-2xl">&#9776;</span>
                        <Link to="/courseList">
                            <span className="uppercase tracking-widest text-sm">E-COURSES</span>
                        </Link>
                        <span className="mx-1 text-cyan-400">•</span>
                        <span className="font-bold text-lg tracking-wide">
                            {course ? course.name?.toUpperCase() : '...'}
                        </span>
                    </div>

                    <div className="text-center mt-6 mb-2">
                        <div className="text-cyan-700 italic text-3xl font-semibold mb-4">
                            {course ? course.name : ''}
                        </div>
                        <hr className="border-t border-gray-300 mb-6" />
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="w-full max-w-2xl aspect-video bg-gray-200 flex items-center justify-center relative">
                            {course && course.url && course.url.includes('youtube.com') ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={course.url.replace('watch?v=', 'embed/')}
                                    title={course.name}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                            ) : (
                                <video
                                    controls
                                    poster="https://www.drugfreeworld.org/dfw_assets/images/dfw/2019-redesign/courses/drugs-course.jpg"
                                    className="w-full h-full object-cover"
                                >
                                    <source src={course?.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8 mb-12">
                        <button
                            className="border-2 border-cyan-400 text-cyan-600 text-xl font-semibold px-16 py-3 rounded transition hover:bg-cyan-50 tracking-widest"
                            onClick={handleContinue}
                        >
                            CONTINUE
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default CourseVideo;