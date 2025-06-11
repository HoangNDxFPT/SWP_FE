import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

function CouresListPage() {
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/Courses')
            .then(res => res.json())
            .then(data => setCourses(data))
            .catch(() => setCourses([]));
    }, []);

    // Lọc courses theo tên
    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(search.toLowerCase())
    );

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
                        src="https://cdn.discordapp.com/attachments/1203731339766141021/1377606127147159683/kids_en.png?ex=6839932f&is=683841af&hm=77ea418268c5cdcb59d0173c30a8602b34c1036984df0534cc761d5e3d85ba3c&"
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
                    {filteredCourses.length === 0 && (
                        <div className="text-gray-500 text-center">No courses found.</div>
                    )}
                    {filteredCourses.map(course => (
                        <div key={course.id} className="bg-white rounded shadow-md flex flex-col md:flex-row">
                            <div className="flex-1 p-6 flex flex-col">
                                <h2 className="text-2xl font-bold text-blue-700 mb-2">{course.name}</h2>
                                <p className="text-gray-700 mb-4">{course.description}</p>
                                <div className="flex flex-wrap gap-4 mb-4 text-gray-500 text-sm">
                                    <span><b>Type:</b> {course.type}</span>
                                    <span><b>Target Age:</b> {course.target_age_group}</span>
                                    <span><b>Start:</b> {course.start_date}</span>
                                    <span><b>End:</b> {course.end_date}</span>
                                </div>
                                <Link
                                    to={`/course/${course.id}`}
                                    className="w-fit"
                                >
                                    <button className="border border-blue-700 text-blue-700 px-6 py-2 rounded font-semibold hover:bg-blue-50 transition w-fit">
                                        Start This Free Course
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
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