import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ScheduleManage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Fetch all appointments
  useEffect(() => {
    api.get("/consultant/appointments")
      .then(res => setAppointments(res.data || []))
      .catch(() => toast.error("Failed to load appointments!"))
      .finally(() => setLoading(false));
  }, []);

  // Confirm appointment
  const handleConfirm = (id) => {
    api.put(`/consultant/appointments/${id}/confirm`)
      .then(() => {
        toast.success("Appointment confirmed!");
        setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "CONFIRMED" } : a));
      })
      .catch(() => toast.error("Failed to confirm!"));
  };

  // Reject appointment
  const handleReject = (id) => {
    api.put(`/consultant/appointments/${id}/reject`)
      .then(() => {
        toast.success("Appointment rejected!");
        setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "REJECTED" } : a));
      })
      .catch(() => toast.error("Failed to reject!"));
  };

  // Edit note
  const handleSaveNote = () => {
    api.put(`/consultant/appointments/${selected.id}/note`, { note: editNote })
      .then(() => {
        toast.success("Note updated!");
        setAppointments(apps => apps.map(a => a.id === selected.id ? { ...a, note: editNote } : a));
        setEditMode(false);
      })
      .catch(() => toast.error("Failed to update note!"));
  };

  // Edit status
  const handleSaveStatus = () => {
    api.put(`/consultant/appointments/${selected.id}/status`, { status: editStatus })
      .then(() => {
        toast.success("Status updated!");
        setAppointments(apps => apps.map(a => a.id === selected.id ? { ...a, status: editStatus } : a));
        setEditMode(false);
      })
      .catch(() => toast.error("Failed to update status!"));
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Consultation Schedule Management</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">User</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Consultant</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Note</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{a.id}</td>
                  <td className="px-4 py-2">{a.userName || a.user?.fullName}</td>
                  <td className="px-4 py-2">{a.consultantName || a.consultant?.fullName}</td>
                  <td className="px-4 py-2">{a.time || a.appointmentTime}</td>
                  <td className="px-4 py-2">{a.status}</td>
                  <td className="px-4 py-2">{a.note}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => {
                        setSelected(a);
                        setEditNote(a.note || "");
                        setEditStatus(a.status || "");
                        setEditMode(false);
                      }}
                    >
                      View / Edit
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleConfirm(a.id)}
                      disabled={a.status === "CONFIRMED"}
                    >
                      Confirm
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleReject(a.id)}
                      disabled={a.status === "REJECTED"}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal view/edit */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Edit Appointment" : "Appointment Details"}
            </h2>
            <div className="flex flex-col gap-3">
              <div><b>ID:</b> {selected.id}</div>
              <div><b>User:</b> {selected.userName || selected.user?.fullName}</div>
              <div><b>Consultant:</b> {selected.consultantName || selected.consultant?.fullName}</div>
              <div><b>Time:</b> {selected.time || selected.appointmentTime}</div>
              <div>
                <b>Status:</b>
                {editMode ? (
                  <select
                    className="border rounded px-2 py-1 ml-2"
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="DONE">Done</option>
                  </select>
                ) : (
                  <span className="ml-2">{selected.status}</span>
                )}
              </div>
              <div>
                <b>Note:</b>
                {editMode ? (
                  <textarea
                    className="border rounded px-2 py-1 w-full mt-1"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                  />
                ) : (
                  <span className="ml-2">{selected.note}</span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {editMode ? (
                <>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                      handleSaveNote();
                      handleSaveStatus();
                      setSelected(null);
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManage;

