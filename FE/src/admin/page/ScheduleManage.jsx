import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';

function ScheduleManage() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editMode, setEditMode] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    done: 0
  });
  
  // Create appointment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [users, setUsers] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    userId: "",
    consultantId: "",
    appointmentTime: "",
    note: ""
  });

  // Fetch all appointments
  useEffect(() => {
    fetchAppointments();
    fetchConsultantsAndUsers();
  }, []);
  
  // Apply filters when appointments, search term, or filters change
  useEffect(() => {
    applyFilters();
  }, [appointments, searchTerm, statusFilter, dateFilter]);
  
  // Calculate stats when appointments change
  useEffect(() => {
    calculateStats();
  }, [appointments]);
  
  const fetchAppointments = () => {
    setLoading(true);
    api.get("/consultant/appointments")
      .then(res => {
        setAppointments(res.data || []);
      })
      .catch(() => toast.error("Failed to load appointments!"))
      .finally(() => setLoading(false));
  };
  
  const fetchConsultantsAndUsers = () => {
    // Fetch consultants
    api.get("/consultant/all-profiles")
      .then(res => setConsultants(res.data || []))
      .catch(() => toast.error("Failed to load consultants!"));
    
    // Fetch users - assuming there's an endpoint for this
    api.get("/profile/all")
      .then(res => setUsers(res.data || []))
      .catch(() => toast.error("Failed to load users!"));
  };
  
  const calculateStats = () => {
    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "PENDING").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      rejected: appointments.filter(a => a.status === "REJECTED").length,
      done: appointments.filter(a => a.status === "DONE").length
    };
    setStats(stats);
  };
  
  const applyFilters = () => {
    let filtered = [...appointments];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.userName || a.user?.fullName || "").toLowerCase().includes(term) ||
        (a.consultantName || a.consultant?.fullName || "").toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(a.time || a.appointmentTime).toISOString().split('T')[0];
        return appointmentDate === dateFilter;
      });
    }
    
    setFilteredAppointments(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("");
  };

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
  
  // Create new appointment
  const handleCreateAppointment = () => {
    // Validate input
    if (!newAppointment.userId || !newAppointment.consultantId || !newAppointment.appointmentTime) {
      toast.error("Please fill in all required fields!");
      return;
    }
    
    api.post("/consultant/appointments", newAppointment)
      .then(() => {
        toast.success("Appointment created successfully!");
        setShowCreateModal(false);
        setNewAppointment({
          userId: "",
          consultantId: "",
          appointmentTime: "",
          note: ""
        });
        fetchAppointments();
      })
      .catch((err) => toast.error("Failed to create appointment: " + (err.response?.data?.message || "Unknown error")));
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "DONE": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Format date for display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    try {
      const date = new Date(dateTimeStr);
      return format(date, "yyyy-MM-dd HH:mm");
    } catch (e) {
      return dateTimeStr;
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Header with title and create button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Consultation Schedule Management</h1>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Appointment
        </button>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Appointments</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Confirmed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Completed</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.done}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search by user or consultant name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-48">
            <select
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          
          <div className="w-48">
            <input
              type="date"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          
          {(searchTerm || statusFilter || dateFilter) && (
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Showing results count */}
      <p className="text-sm text-gray-500 mb-2">
        Showing {filteredAppointments.length} of {appointments.length} appointments
        {statusFilter && ` with status ${statusFilter}`}
        {dateFilter && ` on date ${dateFilter}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </p>
      
      {/* Table */}
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
                <td colSpan={7} className="text-center py-4">
                  <div className="flex justify-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No appointments found
                </td>
              </tr>
            ) : (
              filteredAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{a.id}</td>
                  <td className="px-4 py-2">{a.userName || a.user?.fullName}</td>
                  <td className="px-4 py-2">{a.consultantName || a.consultant?.fullName}</td>
                  <td className="px-4 py-2">{formatDateTime(a.time || a.appointmentTime)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{a.note ? 
                    (a.note.length > 30 ? a.note.substring(0, 30) + '...' : a.note) : 
                    <span className="text-gray-400">No note</span>}
                  </td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => {
                        setSelected(a);
                        setEditNote(a.note || "");
                        setEditStatus(a.status || "");
                        setEditMode(false);
                      }}
                      title="View details and edit if needed"
                    >
                      View / Edit
                    </button>
                    <button
                      className={`bg-blue-500 text-white px-3 py-1 rounded text-xs ${a.status === "CONFIRMED" ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
                      onClick={() => handleConfirm(a.id)}
                      disabled={a.status === "CONFIRMED"}
                      title="Confirm this appointment"
                    >
                      Confirm
                    </button>
                    <button
                      className={`bg-red-500 text-white px-3 py-1 rounded text-xs ${a.status === "REJECTED" ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
                      onClick={() => handleReject(a.id)}
                      disabled={a.status === "REJECTED"}
                      title="Reject this appointment"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editMode ? "Edit Appointment" : "Appointment Details"}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div><b>ID:</b> {selected.id}</div>
              <div><b>User:</b> {selected.userName || selected.user?.fullName}</div>
              <div><b>Consultant:</b> {selected.consultantName || selected.consultant?.fullName}</div>
              <div><b>Time:</b> {formatDateTime(selected.time || selected.appointmentTime)}</div>
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
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selected.status)}`}>
                    {selected.status}
                  </span>
                )}
              </div>
              <div>
                <b>Note:</b>
                {editMode ? (
                  <textarea
                    className="border rounded px-2 py-1 w-full mt-1"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="ml-2 mt-1 whitespace-pre-wrap">{selected.note || <span className="text-gray-400">No notes</span>}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {editMode ? (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    onClick={() => {
                      handleSaveNote();
                      handleSaveStatus();
                      setSelected(null);
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
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
      
      {/* Create appointment modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Appointment</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.userId}
                  onChange={e => setNewAppointment({...newAppointment, userId: e.target.value})}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Consultant <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.consultantId}
                  onChange={e => setNewAppointment({...newAppointment, consultantId: e.target.value})}
                >
                  <option value="">Select Consultant</option>
                  {consultants.map(consultant => (
                    <option key={consultant.id} value={consultant.id}>{consultant.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Appointment Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.appointmentTime}
                  onChange={e => setNewAppointment({...newAppointment, appointmentTime: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.note}
                  onChange={e => setNewAppointment({...newAppointment, note: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleCreateAppointment}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManage;

