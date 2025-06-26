import React, { useEffect, useState } from 'react'
import api from '../../config/axios'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

function CouresListPage() {
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState('');
    const [completedCourses, setCompletedCourses] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const COURSES_PER_PAGE = 5;

    // Lấy thông tin user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('profile');
                if (res.status === 200 && res.data) {
                    setUser(res.data);
                }
            } catch (err) {
                setUser(null);
                console.error('Failed to fetch user profile:', err);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchCompleted = async () => {
            if (user?.userId) {
                try {
                    const res = await api.get(`quiz/completed/${user.userId}`);
                    if (Array.isArray(res.data)) {
                        setCompletedCourses(res.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch completed courses:', err);
                }
            }
        };
        fetchCompleted();
    },);


    // Tính nhóm tuổi
    let userAgeGroup = '';
    if (user && user.dateOfBirth) {
        const birth = new Date(user.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        userAgeGroup = age < 18 ? 'Teenagers' : 'Adults';
    }

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const fetchCourses = async () => {
                setLoading(true);
                try {
                    let url = 'http://localhost:8080/api/courses/list';
                    if (search.trim() !== '') {
                        url = `http://localhost:8080/api/courses/search?name=${encodeURIComponent(search.trim())}`;
                    }

                    const token = localStorage.getItem('token'); // or wherever you're storing it

                    const res = await api.get(url, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: '*/*',
                        },
                    });

                    if (res.status === 200 && Array.isArray(res.data)) {
                        setCourses(res.data);
                        setCurrentPage(1);
                    } else {
                        setCourses([]);
                    }
                } catch (error) {
                    console.error('Fetch error:', error);
                    setCourses([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchCourses();
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [search]);


    // Lọc theo nhóm tuổi
    const filteredCourses = courses.filter(course =>
        userAgeGroup ? course.targetAgeGroup === userAgeGroup : true
    );

    // Phân trang
    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * COURSES_PER_PAGE,
        currentPage * COURSES_PER_PAGE
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <>
            <Header />
            {/* Banner */}
            <div className="bg-blue-700 py-10 px-0 w-full">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Free Truth About Drugs<br />E-Courses
                        </h1>
                        <p className="text-white text-lg mb-4">
                            This series of interactive Truth About Drugs courses has been designed so you can learn the truth about drugs at your own pace. Find out what drugs are, what they are made of, their short- and long-term effects, and view real stories from real people about each of the most popular drugs of choice. To begin, choose one of the courses from the list below.
                        </p>
                    </div>
                    <img
                        src=""
                        alt="Group"
                        className="w-[500px] h-auto object-contain"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto py-10 flex flex-col md:flex-row gap-8">
                {/* Course List */}
                <div className="flex flex-col gap-8 w-full md:w-2/3">
                    {/* Thanh tìm kiếm */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search course name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded shadow focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {loading ? (
                        <div className="text-center text-gray-500">Loading...</div>
                    ) : paginatedCourses.length === 0 ? (
                        <div className="text-gray-500 text-center">No courses found.</div>
                    ) : (
                        
                            paginatedCourses.map(course => (
                                <div key={course.id} className="bg-white rounded shadow-md flex flex-col md:flex-row">
                                    <div className="flex-1 p-6 flex flex-col">
                                        <h2 className="text-2xl font-bold text-blue-700 mb-2">{course.name}</h2>
                                        <p className="text-gray-700 mb-4">{course.description}</p>
                                        <div className="flex flex-wrap gap-4 mb-4 text-gray-500 text-sm">
                                            <span><b>Type:</b> {course.type}</span>
                                            <span><b>Target Age:</b> {course.targetAgeGroup}</span>
                                            <span><b>Start:</b> {course.startDate}</span>
                                            <span><b>End:</b> {course.endDate}</span>
                                        </div>
                                        {completedCourses.includes(course.id) ? (
                                            <button className="px-6 py-2 rounded font-semibold bg-gray-200 text-gray-500 cursor-not-allowed" disabled>
                                                Course Completed
                                            </button>
                                        ) : (
                                            <Link to={`/course/${course.id}`} className="w-fit">
                                                <button className="border border-blue-700 text-blue-700 px-6 py-2 rounded font-semibold hover:bg-blue-50 transition">
                                                    Start This Free Course
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-4 gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            {[...Array(totalPages)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    onClick={() => handlePageChange(idx + 1)}
                                    className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? 'bg-blue-700 text-white' : ''}`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
                {/* Sidebar */}
                <div className="md:w-1/3 flex flex-col gap-6">
                    <div className="bg-white rounded shadow-md p-6">
                        <div className="font-semibold text-blue-700 mb-2">Get your learn on!</div>
                        <div className="text-gray-700 mb-4">
                            Sign up for the free e-courses and educate yourself on the truth about drugs!
                        </div>
                        <div className="flex items-start gap-3 mb-2">
                            <span className="text-2xl text-purple-500">📝</span>
                            <span className="text-gray-700">Keep track of your progress through lesson and section quizzes.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl text-blue-600">💬</span>
                            <span className="text-gray-700">Join a community of passionate people who are making a drug-free world!</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CouresListPage