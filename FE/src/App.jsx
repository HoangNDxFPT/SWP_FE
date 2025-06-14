import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { store, persistor } from './redux/store';

// Member pages
import HomePage from './member/page/HomePage';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import UserProfilePage from './member/page/UserProfilePage';
import Servey from './member/page/Servey';
import CouresListPage from './member/page/CouresListPage';
import ConsultantList from './member/page/ConsultantList';
import ForgotPassword from './member/page/ForgotPassword';
import EnterNewPassword from './member/page/EnterNewPassword';
import CourseVideo from './member/page/CourseVideo';
import BlogFeed from './member/page/Blog';

// Admin pages
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/page/Dashboard';
import AdminProfilePage from './admin/page/AdminProfilePage';
import UserManage from './admin/page/UserManage';
import CourseManage from './admin/page/CourseManage';

function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user && (user.role === "ADMIN" || user.role_id === 1);

  if (!user) {
    return <LoginPage />;
  }

  if (!isAdmin) {
    window.location.href = "/"; // Chuyển người dùng không phải admin về trang chủ
    return null;
  }

  return children;
}

function RequireMember({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user && (user.role === "ADMIN" || user.role_id === 1);

  if (isAdmin) {
    window.location.href = "/admin"; // Chuyển admin về trang admin
    return null;
  }

  return children;
}

const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <EnterNewPassword />,
  },

  // Member routes - protected
  {
    path: "/",
    element: (
      <RequireMember>
        <HomePage />
      </RequireMember>
    ),
  },
  {
    path: "/profile",
    element: (
      <RequireMember>
        <UserProfilePage />
      </RequireMember>
    ),
  },
  {
    path: "/servey",
    element: (
      <RequireMember>
        <Servey />
      </RequireMember>
    ),
  },
  {
    path: "/courseList",
    element: (
      <RequireMember>
        <CouresListPage />
      </RequireMember>
    ),
  },
  {
    path: "/consultantList",
    element: (
      <RequireMember>
        <ConsultantList />
      </RequireMember>
    ),
  },
  {
    path: "/course/:id",
    element: (
      <RequireMember>
        <CourseVideo />
      </RequireMember>
    ),
  },
  {
    path: "/blogs",
    element: (
      <RequireMember>
        <BlogFeed />
      </RequireMember>
    ),
  },

  // Admin routes - protected
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <AdminProfilePage /> },
      { path: "users", element: <UserManage /> },
      { path: "courses", element: <CourseManage /> },
    ],
  },
]);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
}

export default App;