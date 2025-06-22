import React, { useEffect, useState } from "react";

const MODULES = [
  { code: "AD01", name: "Dashboard Overview", desc: "Admin dashboard overview" },
  { code: "AD02", name: "User Account Management", desc: "CRUD, Role assignment" },
  { code: "AD03", name: "Course Management", desc: "CRUD, Approve registrations" },
  { code: "AD04", name: "Survey Results Management", desc: "View all, Suggestions" },
  { code: "AD05", name: "Consultation Schedule Management", desc: "View, Edit system-wide" },
  { code: "AD06", name: "Media Program Management", desc: "CRUD, Tracking" },
  { code: "AD07", name: "Consultant Management", desc: "CRUD, Assignment" },
  { code: "AD08", name: "Reports & Statistics", desc: "Dashboard, Export file" },
  { code: "AD09", name: "System Content Management", desc: "Homepage, Blog, Organization info" },
  { code: "AD10", name: "System & Security Control", desc: "Log monitoring" },
  { code: "AD11", name: "Organization/Blog Info Management", desc: "Manager" },
  { code: "AD12", name: "User Profile Management", desc: "Manager" },
];

export default function Dashboard() {
  const [summary, setSummary] = useState([
    { label: "Users", value: 0 },
    { label: "Courses", value: 0 },
    { label: "Surveys", value: 0 },
    { label: "Consultation Schedules", value: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace this with your real API endpoint
    fetch("/api/admin/summary")
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => {
        setSummary([
          { label: "Users", value: data.users || 0 },
          { label: "Courses", value: data.courses || 0 },
          { label: "Surveys", value: data.surveys || 0 },
          { label: "Consultation Schedules", value: data.consultations || 0 },
        ]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Summary API is not available yet.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-40 text-lg">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-red-600">
        <div>{error}</div>
        <div className="mt-2 text-gray-500">Please contact backend team or try again later.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-blue-900">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {summary.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center"
          >
            <div className="text-4xl font-bold text-blue-600 mb-2">{item.value}</div>
            <div className="text-gray-700 font-semibold">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-800">Admin Modules</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Code</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Module</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Description</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Sprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MODULES.map((mod, idx) => (
                <tr key={mod.code} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{mod.code}</td>
                  <td className="px-4 py-2">{mod.name}</td>
                  <td className="px-4 py-2">{mod.desc}</td>
                  <td className="px-4 py-2">{mod.code === "AD10" ? "Non-sprint" : "Sprint 3"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}