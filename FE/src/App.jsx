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
import ForgotPassword from "./member/page/ForgotPassword";
import EnterNewPassword from "./member/page/EnterNewPassword";
import CouresListPage from "./member/page/CouresListPage";
import CourseVideo from "./member/page/CourseVideo";
import ConsultantList from "./member/page/ConsultantList";
import CourseQuiz from "./member/page/CourseQuiz";
import CourseResultPage from "./member/page/CourseResultPage";
import AssessmentResult from "./member/page/AssessmentResult";
import AssessmentHistory from "./member/page/AssessmentHistory";
import ConsultantDetail from "./member/page/ConsultantDetail";
import AboutUs from "./member/page/AboutUs";
import AssessmentPage from "./member/page/AssessmentPage";
import BookingHistory from "./member/page/BookingHistory";
import Assessment from "./member/page/Assessment";

// Admin pages
import AdminLayout from "./admin/AdminLayout";
import AdminProfilePage from "./admin/page/AdminProfilePage";
import UserManage from "./admin/page/UserManage";
import CourseManage from "./admin/page/CourseManage";
import AssessmentManage from "./admin/page/AssessmentManage";
import ConsultantScheduleManage from "./admin/page/ConsultantScheduleManage";
import CourseEnrollmentManage from "./admin/page/CourseEnrollmentManage";
import AssessmentResultManage from "./admin/page/AssessmentResultManage";
import Program from "./admin/page/Program";
// Consultant pages
import ConsultantLayout from "./consultant/ConsultantLayout";
import ConsultantDashboard from "./consultant/page/Dashboard";
import AppointmentList from "./consultant/page/AppointmentList";
import UserCaseList from "./consultant/page/UserCaseList";
import ConsultantProfilePage from "./consultant/page/ProfilePage";
import ProgramList from "./member/page/ProgramList";





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
    path: "/about-us",
    element: <AboutUs />,
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
    element: <EnterNewPassword />,
  },
  {
    path: "/courseList",
    element: <CouresListPage />,
  },
  {
    path: "/course/:id",
    element: <CourseVideo />,
  },
  {
    path: "/consultantList",
    element: <ConsultantList />,
  }, {
    path: "/quiz/:courseId",
    element: <CourseQuiz />,
  },
  {
    path: "/quiz-result/:id",
    element: <CourseResultPage />,
  },
  {
    path: "/assessment/:type",
    element: <Assessment />,
  },
  {
    path: "/assessment-result/:assessmentResultId",
    element: <AssessmentResult />,
  },
  {
    path: "/assessment-history",
    element: <AssessmentHistory />,
  },
  {
    path: "/consultantDetail/:id",
    element: <ConsultantDetail />,
  },
  {
    path: "/assessment",
    element: <AssessmentPage />,
  },

  {
    path: "/booking-history",
    element: <BookingHistory />,
  },
  {
    path: "/com-program",
    element: <ProgramList />,
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
      { path: "schedule", element: <ConsultantScheduleManage /> },
      { path: "assessment", element: <AssessmentManage /> },
      { path: "assessment-result", element: <AssessmentResultManage /> },
      { path: "course-enrollment", element: <CourseEnrollmentManage /> },
      { path: "program", element: <Program /> },
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
      {
        path: "appointments",
        element: <AppointmentList />,

      },

      { path: "cases", element: <UserCaseList /> },

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