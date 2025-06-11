import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { store, persistor } from './redux/store';
import HomePage from './member/page/HomePage';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import UserProfilePage from './member/page/UserProfilePage';
import AdminLayout from './admin/AdminLayout';
import AdminProfilePage from './admin/page/AdminProfilePage'; 
import UserManage from './admin/page/UserManage';
import CourseManage from './admin/page/CourseManage';

function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Kiểm tra cả role là chuỗi "ADMIN" hoặc role_id là 1
  if (!user || !(user.role === "ADMIN" || user.role_id === 1)) {
    return <LoginPage />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/profile",
    element: <UserProfilePage />,
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
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
