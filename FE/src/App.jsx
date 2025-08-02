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
import ConsultantList from "./member/page/ConsultantList";
import CourseQuiz from "./member/page/CourseQuiz";
import AssessmentResult from "./member/page/AssessmentResult";
import AssessmentHistory from "./member/page/AssessmentHistory";
import ConsultantDetail from "./member/page/ConsultantDetail";
import AboutUs from "./member/page/AboutUs";
import AssessmentPage from "./member/page/AssessmentPage";
import BookingHistory from "./member/page/BookingHistory";
import ProgramList from "./member/page/ProgramList";
import CourseDetailPage from "./member/page/CourseDetailPage";
import QuizResult from "./member/page/QuizResult";

// Admin pages
import AdminLayout from "./admin/AdminLayout";
import AdminProfilePage from "./admin/page/AdminProfilePage";
import UserManage from "./admin/page/UserManage";
import CourseManage from "./admin/page/CourseManage";
import AssessmentManage from "./admin/page/AssessmentManage";
import CourseEnrollmentManage from "./admin/page/CourseEnrollmentManage";
import AssessmentResultManage from "./admin/page/AssessmentResultManage";
import Program from "./admin/page/Program";

// Consultant pages
import ConsultantLayout from "./consultant/ConsultantLayout";

import AppointmentList from "./consultant/page/AppointmentList";

import ConsultantProfilePage from "./consultant/page/ProfilePage";
import ProgramListPage from "./consultant/page/ProgramListPage"; // Added from tri branch
import CourseListPage from "./consultant/page/CourseListPage"; // Added from tri branch
import QuizHistory from "./member/page/QuizHistory";
import Crafft from "./member/page/Crafft";
import AssistAssessment from "./member/page/AssistAssessment";
import CourseDetailForConsultant from "./consultant/components/CourseDetailForConsultant";
import Dashboard from "./admin/page/Dashboard";
import ConsultantManagement from "./admin/page/ConsultantManagement";
import ReportAppointment from "./admin/page/Report&Appointment";
import OAuth2RedirectHandler from "./pages/login/OAuth2RedirectHandler";
import ActivationPage from "./pages/activation";


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
    path: "/activate",
    element: <ActivationPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/login/success",
    element: <OAuth2RedirectHandler />,
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
    path: "/consultantList",
    element: <ConsultantList />,
  }, 
  {
    path: "/quiz/:id",
    element: <CourseQuiz />,
  },
  {
    path: "/course/:id",
    element: <CourseDetailPage />,
  },
  {
    path: "/quiz-result/:id",
    element: <QuizResult />,
  },
  {
    path: "/quiz-history",
    element: <QuizHistory />,
  },
  {
    path: "/assessment-crafft",
    element: <Crafft />,
  },
  {
    path: "/assessment-assist",
    element: <AssistAssessment />,
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
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <AdminProfilePage /> },
      { path: "users", element: <UserManage /> },
      { path: "courses", element: <CourseManage /> },
      { path: "schedule", element: <ConsultantManagement /> },
      { path: "assessment", element: <AssessmentManage /> },
      { path: "assessment-result", element: <AssessmentResultManage /> },
      { path: "course-enrollment", element: <CourseEnrollmentManage /> },
      { path: "program", element: <Program /> },
      { path: "report-appointment", element: <ReportAppointment /> },
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
      
      {
        path: "appointments",
        element: <AppointmentList />,
      },
      { path: "profile", element: <ConsultantProfilePage /> },
      { path: "courses", element: <CourseListPage /> }, // Added new route
      { path: "programs", element: <ProgramListPage /> },
      { path: "course/:id", element: <CourseDetailForConsultant/> }, // Added new route
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