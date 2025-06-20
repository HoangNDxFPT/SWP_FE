import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { store, persistor } from "./redux/store";

// Member pages
import HomePage from "./member/page/HomePage";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import UserProfilePage from "./member/page/UserProfilePage";

// Admin pages
import AdminLayout from "./admin/AdminLayout";
import AdminProfilePage from "./admin/page/AdminProfilePage";
import UserManage from "./admin/page/UserManage";
import CourseManage from "./admin/page/CourseManage";

// Consultant pages
import ConsultantLayout from "./consultant/ConsultantLayout";
import ConsultantDashboard from "./consultant/page/Dashboard";
import AppointmentList from "./consultant/page/AppointmentList";
import AppointmentDetail from "./consultant/page/AppointmentDetail";
import UserCaseList from "./consultant/page/UserCaseList";
import UserCaseDetail from "./consultant/page/UserCaseDetail";
import ConsultantProfilePage from "./consultant/page/ConsultantProfilePage";
import ForgotPassword from "./member/page/ForgotPassword";
import EnterNewPassword from "./member/page/EnterNewPassword";
import CouresListPage from "./member/page/CouresListPage";
import CourseVideo from "./member/page/CourseVideo";
import ConsultantList from "./member/page/ConsultantList";
function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || !(user.role === "ADMIN" || user.role_id === 1)) {
    return <LoginPage />;
  }
  return children;
}

function RequireConsultant({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || user.role !== "CONSULTANT") {
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
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
      {
    path: "/reset-password",
    element: <EnterNewPassword/>,
  },
       {
    path: "/courseList",
    element: <CouresListPage/>,
  },
         {
    path: "/course/:id",
    element: <CourseVideo/>,
  },
           {
    path: "/consultantList",
    element: <ConsultantList/>,
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
  {
    path: "/consultant",
    element: (
      <RequireConsultant>
        <ConsultantLayout />
      </RequireConsultant>
    ),
    children: [
      { path: "dashboard", element: <ConsultantDashboard /> },
      { path: "appointments", element: <AppointmentList /> },
      { path: "appointments/:id", element: <AppointmentDetail /> },
      { path: "cases", element: <UserCaseList /> },
      { path: "cases/:id", element: <UserCaseDetail /> },
      { path: "profile", element: <ConsultantProfilePage /> },
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