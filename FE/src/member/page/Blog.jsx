import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';

function BlogFeed() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/Blogs');
        setBlogs(response.data);
      } catch (error) {
        console.error('Failed to fetch blogs', error);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <>
    <Header/>
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Blog Feed</h1>
      {blogs.length === 0 ? (
        <p>Loading...</p>
      ) : (
        blogs.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
          >
            {post.thumbnail_url && (
              <img
                src={post.thumbnail_url}
                alt="Thumbnail"
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 text-sm mb-2">
                {new Date(post.created_at).toLocaleDateString()} | {post.status}
              </p>
              <p className="text-gray-800 mb-4 line-clamp-3">
                {post.content}
              </p>
              <a
                href={`/blog/${post.id}`}
                className="text-blue-500 hover:underline font-medium"
              >
                Read more
              </a>
            </div>
          </div>
        ))
      )}
    </div>
    </>
  );
}

export default BlogFeed;
