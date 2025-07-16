import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import api from '../../config/axios';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

function Program() {
    // Tab management
    const [activeTab, setActiveTab] = useState('programs');

    // Programs state
    const [programs, setPrograms] = useState([]);
    const [currentProgram, setCurrentProgram] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
    });
    const [showAddProgramModal, setShowAddProgramModal] = useState(false);
    const [showEditProgramModal, setShowEditProgramModal] = useState(false);
    const [searchProgramQuery, setSearchProgramQuery] = useState('');

    // Survey Templates state
    const [templates, setTemplates] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState({
        name: '',
        type: 'PRE',
        description: '',
        googleFormUrl: '',
        googleFormUrlEdit: '',
        googleSheetUrl: '',
        program: null
    });
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
    const [searchTemplateQuery, setSearchTemplateQuery] = useState('');

    // Participants state
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [currentProgramParticipants, setCurrentProgramParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [selectedProgramForSurvey, setSelectedProgramForSurvey] = useState(null);
    const [showSendSurveyModal, setShowSendSurveyModal] = useState(false);
    const [surveyType, setSurveyType] = useState('PRE');
    const [sendingSurvey, setSendingSurvey] = useState(false);

    // Enrollments state
    const [enrollments, setEnrollments] = useState([]);
    const [searchEnrollmentQuery, setSearchEnrollmentQuery] = useState('');
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [programStatusFilter, setProgramStatusFilter] = useState('ALL');

    // Shared state
    const [loading, setLoading] = useState(false);

    // Load data on component mount
    useEffect(() => {
        fetchPrograms();
        fetchTemplates();
        fetchAllEnrollments();
    }, []);

    // PROGRAM FUNCTIONS
    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const res = await api.get('/programs');
            const sortedPrograms = res.data.sort((a, b) =>
                new Date(b.start_date) - new Date(a.start_date)
            );
            setPrograms(sortedPrograms);
        } catch (error) {
            console.error('Lỗi khi tải chương trình:', error);
            toast.error('Không thể tải danh sách chương trình');
        } finally {
            setLoading(false);
        }
    };

    const handleProgramInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentProgram({
            ...currentProgram,
            [name]: value,
        });
    };

    const resetProgramForm = () => {
        setCurrentProgram({
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            location: '',
        });
    };

    const validateProgramForm = () => {
        if (!currentProgram.name.trim()) {
            toast.error('Vui lòng nhập tên chương trình');
            return false;
        }
        if (!currentProgram.start_date) {
            toast.error('Vui lòng chọn ngày bắt đầu');
            return false;
        }
        if (!currentProgram.end_date) {
            toast.error('Vui lòng chọn ngày kết thúc');
            return false;
        }
        if (new Date(currentProgram.end_date) < new Date(currentProgram.start_date)) {
            toast.error('Ngày kết thúc phải sau ngày bắt đầu');
            return false;
        }
        if (!currentProgram.location.trim()) {
            toast.error('Vui lòng nhập địa điểm');
            return false;
        }
        return true;
    };

    const handleCreateProgram = async () => {
        if (!validateProgramForm()) return;

        try {
            setLoading(true);
            const res = await api.post('/programs', currentProgram);
            setPrograms([res.data, ...programs]);
            toast.success('Tạo chương trình thành công!');
            setShowAddProgramModal(false);
            resetProgramForm();
        } catch (error) {
            console.error('Lỗi khi tạo chương trình:', error);
            toast.error('Không thể tạo chương trình');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProgram = async () => {
        if (!validateProgramForm()) return;

        try {
            setLoading(true);
            await api.put(`/programs/${currentProgram.id}`, currentProgram);

            const updatedPrograms = programs.map((program) =>
                program.id === currentProgram.id ? currentProgram : program
            );

            setPrograms(updatedPrograms);
            toast.success('Cập nhật chương trình thành công!');
            setShowEditProgramModal(false);
            resetProgramForm();
        } catch (error) {
            console.error('Lỗi khi cập nhật chương trình:', error);
            toast.error('Không thể cập nhật chương trình');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProgram = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa chương trình này?')) {
            try {
                setLoading(true);
                await api.delete(`/programs/${id}`);
                setPrograms(programs.filter((program) => program.id !== id));
                toast.success('Xóa chương trình thành công!');
            } catch (error) {
                console.error('Lỗi khi xóa chương trình:', error);
                toast.error('Không thể xóa chương trình');
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditProgramModal = (program) => {
        setCurrentProgram({ ...program });
        setShowEditProgramModal(true);
    };

    // Thay thế hàm filteredPrograms với phiên bản mới có bộ lọc trạng thái
    const filteredPrograms = programs.filter((program) => {
        // Lọc theo từ khóa tìm kiếm
        const matchesSearchQuery =
            program.name.toLowerCase().includes(searchProgramQuery.toLowerCase()) ||
            program.description?.toLowerCase().includes(searchProgramQuery.toLowerCase()) ||
            program.location.toLowerCase().includes(searchProgramQuery.toLowerCase());

        // Lọc theo trạng thái
        const currentDate = new Date();
        const endDate = new Date(program.end_date);

        if (programStatusFilter === 'ALL') {
            return matchesSearchQuery;
        } else if (programStatusFilter === 'ACTIVE') {
            return matchesSearchQuery && endDate >= currentDate;
        } else if (programStatusFilter === 'ENDED') {
            return matchesSearchQuery && endDate < currentDate;
        }

        return matchesSearchQuery;
    });

    // SURVEY TEMPLATES FUNCTIONS
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/survey-templates');
            const sortedTemplates = res.data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setTemplates(sortedTemplates);
        } catch (error) {
            console.error('Lỗi khi tải mẫu khảo sát:', error);
            toast.error('Không thể tải danh sách mẫu khảo sát');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate({
            ...currentTemplate,
            [name]: value,
        });
    };

    const handleProgramChange = (e) => {
        const programId = parseInt(e.target.value);
        if (programId) {
            const selectedProgram = programs.find(p => p.id === programId);
            setCurrentTemplate({
                ...currentTemplate,
                program: selectedProgram
            });
        } else {
            setCurrentTemplate({
                ...currentTemplate,
                program: null
            });
        }
    };

    const resetTemplateForm = () => {
        setCurrentTemplate({
            name: '',
            type: 'PRE',
            description: '',
            googleFormUrl: '',
            googleSheetUrl: '',
            googleFormUrlEdit: '',
            program: null
        });
    };

    const validateTemplateForm = () => {
        if (!currentTemplate.name.trim()) {
            toast.error('Vui lòng nhập tên mẫu khảo sát');
            return false;
        }
        if (!currentTemplate.googleFormUrl.trim()) {
            toast.error('Vui lòng nhập URL Google Form');
            return false;
        }
        // Kiểm tra URL Google Form hợp lệ
        try {
            new URL(currentTemplate.googleFormUrl);
        } catch (_) {
            toast.error('URL Google Form không hợp lệ');
            return false;
        }
        // Kiểm tra URL Google Form Edit nếu có
        if (currentTemplate.googleFormUrlEdit.trim()) {
            try {
                new URL(currentTemplate.googleFormUrlEdit);
            } catch (_) {
                toast.error('URL Google Form Edit không hợp lệ');
                return false;
            }
        }
        // Kiểm tra URL Google Sheet nếu có
        if (currentTemplate.googleSheetUrl.trim()) {
            try {
                new URL(currentTemplate.googleSheetUrl);
            } catch (_) {
                toast.error('URL Google Sheet không hợp lệ');
                return false;
            }
        }
        return true;
    };

    const handleCreateTemplate = async () => {
        if (!validateTemplateForm()) return;

        try {
            setLoading(true);
            const res = await api.post('/survey-templates', currentTemplate);
            setTemplates([res.data, ...templates]);
            toast.success('Tạo mẫu khảo sát thành công!');
            setShowAddTemplateModal(false);
            resetTemplateForm();
        } catch (error) {
            console.error('Lỗi khi tạo mẫu khảo sát:', error);
            toast.error('Không thể tạo mẫu khảo sát');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTemplate = async () => {
        if (!validateTemplateForm()) return;

        try {
            setLoading(true);
            await api.put(`/survey-templates/${currentTemplate.id}`, currentTemplate);

            const updatedTemplates = templates.map((template) =>
                template.id === currentTemplate.id ? currentTemplate : template
            );

            setTemplates(updatedTemplates);
            toast.success('Cập nhật mẫu khảo sát thành công!');
            setShowEditTemplateModal(false);
            resetTemplateForm();
        } catch (error) {
            console.error('Lỗi khi cập nhật mẫu khảo sát:', error);
            toast.error('Không thể cập nhật mẫu khảo sát');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa mẫu khảo sát này?')) {
            try {
                setLoading(true);
                await api.delete(`/survey-templates/${id}`);
                setTemplates(templates.filter((template) => template.id !== id));
                toast.success('Xóa mẫu khảo sát thành công!');
            } catch (error) {
                console.error('Lỗi khi xóa mẫu khảo sát:', error);
                toast.error('Không thể xóa mẫu khảo sát');
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditTemplateModal = (template) => {
        setCurrentTemplate({ ...template });
        setShowEditTemplateModal(true);
    };

    const filteredTemplates = templates.filter((template) =>
        template.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTemplateQuery.toLowerCase()) ||
        template.program?.name?.toLowerCase().includes(searchTemplateQuery.toLowerCase())
    );

    // PARTICIPANT FUNCTIONS
    const fetchProgramParticipants = async (programId) => {
        try {
            setLoadingParticipants(true);
            const res = await api.get(`/programs/history-program/${programId}`);
            setCurrentProgramParticipants(res.data);
            setShowParticipantsModal(true);
        } catch (error) {
            console.error('Lỗi khi tải danh sách người tham gia:', error);
            toast.error('Không thể tải danh sách người tham gia');
        } finally {
            setLoadingParticipants(false);
        }
    };

    // Send survey functions
    const openSendSurveyModal = (program) => {
        setSelectedProgramForSurvey(program);
        setSurveyType('PRE');
        setShowSendSurveyModal(true);
    };

    const handleSendSurvey = async () => {
        if (!selectedProgramForSurvey || !surveyType) {
            toast.error('Vui lòng chọn loại khảo sát');
            return;
        }

        try {
            setSendingSurvey(true);
            const res = await api.post(`/surveys/send/${selectedProgramForSurvey.id}/${surveyType}`);
            toast.success('Đã gửi email khảo sát thành công!');
            setShowSendSurveyModal(false);
        } catch (error) {
            console.error('Lỗi khi gửi khảo sát:', error);
            toast.error('Không thể gửi khảo sát. Vui lòng thử lại sau!');
        } finally {
            setSendingSurvey(false);
        }
    };

    // ALL ENROLLMENTS FUNCTIONS
    const fetchAllEnrollments = async () => {
        try {
            setLoadingEnrollments(true);
            const res = await api.get('/programs/all');
            setEnrollments(res.data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách người tham gia:', error);
            toast.error('Không thể tải danh sách người tham gia');
        } finally {
            setLoadingEnrollments(false);
        }
    };
    // Format functions
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            console.error('Lỗi định dạng ngày:', error);
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
        } catch (error) {
            console.error('Lỗi định dạng ngày giờ:', error);
            return dateString;
        }
    };

    // Survey type helpers
    const getSurveyTypeLabel = (type) => {
        const types = {
            'PRE': 'Khảo sát trước',
            'POST': 'Khảo sát sau',
        };
        return types[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            'PRE': 'bg-blue-100 text-blue-800',
            'POST': 'bg-green-100 text-green-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const activePrograms = programs.filter(program => new Date(program.end_date) >= new Date());
    const endedPrograms = programs.filter(program => new Date(program.end_date) < new Date());

    return (
        <div className="w-full">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1 className="text-2xl font-bold mb-6 text-blue-900">Quản lý Chương Trình Cộng Đồng</h1>

            {/* Tabs Navigation */}
            <div className="mb-8 border-b border-gray-200">
                <div className="flex flex-wrap space-x-4">
                    <button
                        className={`pb-2 px-4 ${activeTab === 'programs'
                            ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('programs')}
                    >
                        Chương Trình
                    </button>
                    <button
                        className={`pb-2 px-4 ${activeTab === 'templates'
                            ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('templates')}
                    >
                        Mẫu Khảo Sát
                    </button>
                </div>
            </div>

            {/* Programs Tab */}
            {activeTab === 'programs' && (
                <>
                    {/* Search, Filter and Add button */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex flex-col w-full gap-3">
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tìm kiếm chương trình..."
                                        value={searchProgramQuery}
                                        onChange={(e) => setSearchProgramQuery(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setProgramStatusFilter('ALL')}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${programStatusFilter === 'ALL'
                                            ? 'bg-gray-200 text-gray-800'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                            Tất cả ({programs.length})
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setProgramStatusFilter('ACTIVE')}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${programStatusFilter === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Còn hoạt động ({activePrograms.length})
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setProgramStatusFilter('ENDED')}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${programStatusFilter === 'ENDED'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Đã kết thúc ({endedPrograms.length})
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Thông tin số lượng chương trình sau khi lọc */}
                            <div className="text-sm text-gray-600">
                                Hiển thị <span className="font-semibold">{filteredPrograms.length}</span> trên tổng số <span className="font-semibold">{programs.length}</span> chương trình
                                {programStatusFilter === 'ACTIVE' && <span> còn hoạt động</span>}
                                {programStatusFilter === 'ENDED' && <span> đã kết thúc</span>}
                                {searchProgramQuery && <span> phù hợp với từ khóa "<span className="font-medium">{searchProgramQuery}</span>"</span>}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                resetProgramForm();
                                setShowAddProgramModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 w-full sm:w-auto justify-center whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm chương trình mới
                        </button>
                    </div>

                    {/* Programs Table */}
                    {loading && programs.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredPrograms.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h2 className="text-lg font-medium mt-3">Không tìm thấy chương trình nào</h2>
                            <p className="text-gray-500 mt-1">Hãy thêm chương trình mới hoặc thử tìm kiếm với từ khóa khác</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Tên chương trình
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Địa điểm
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Ngày bắt đầu
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Ngày kết thúc
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPrograms.map((program) => (
                                        <tr key={program.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{program.name}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">{program.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{program.location}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(program.start_date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(program.end_date)}</td>
                                            <td className="px-6 py-4">
                                                {new Date(program.end_date) >= new Date() ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <span className="h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                                                        Còn hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
                                                        Đã kết thúc
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => openEditProgramModal(program)}
                                                        className="text-indigo-600 hover:text-indigo-900 tooltip"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => fetchProgramParticipants(program.id)}
                                                        className="text-green-600 hover:text-green-900 tooltip"
                                                        title="Xem người tham gia"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.356-1.283.988-2.386l.548-.547a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => openSendSurveyModal(program)}
                                                        className="text-blue-600 hover:text-blue-900 tooltip"
                                                        title="Gửi khảo sát"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProgram(program.id)}
                                                        className="text-red-600 hover:text-red-900 tooltip"
                                                        title="Xóa"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Survey Templates Tab */}
            {activeTab === 'templates' && (
                <>
                    {/* Search and Add button */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tìm kiếm mẫu khảo sát..."
                                value={searchTemplateQuery}
                                onChange={(e) => setSearchTemplateQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetTemplateForm();
                                setShowAddTemplateModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 w-full sm:w-auto justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm mẫu khảo sát mới
                        </button>
                    </div>

                    {/* Survey Templates Table */}
                    {loading && templates.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-lg font-medium mt-3">Không tìm thấy mẫu khảo sát nào</h2>
                            <p className="text-gray-500 mt-1">Hãy thêm mẫu khảo sát mới hoặc thử tìm kiếm với từ khóa khác</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên mẫu khảo sát
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Loại
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Chương trình
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày tạo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTemplates.map((template) => (
                                        <tr key={template.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">{template.description}</div>
                                                <div className="flex gap-2 mt-1">
                                                    <a
                                                        href={template.googleFormUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Xem Google Form
                                                    </a>
                                                    {template.googleFormUrlEdit && (
                                                        <a
                                                            href={template.googleFormUrlEdit}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-green-600 hover:underline"
                                                        >
                                                            Chỉnh sửa Form
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                                                    {getSurveyTypeLabel(template.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {template.program ? template.program.name : 'Không có'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDateTime(template.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => openEditTemplateModal(template)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modal thêm chương trình */}
            {showAddProgramModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Thêm Chương Trình Mới</h2>
                            <button
                                onClick={() => setShowAddProgramModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên chương trình <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentProgram.name}
                                    onChange={handleProgramInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên chương trình"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={currentProgram.description}
                                    onChange={handleProgramInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mô tả về chương trình"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={currentProgram.start_date}
                                        onChange={handleProgramInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày kết thúc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={currentProgram.end_date}
                                        onChange={handleProgramInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min={currentProgram.start_date}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={currentProgram.location}
                                    onChange={handleProgramInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập địa điểm"
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddProgramModal(false)}
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateProgram}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Thêm chương trình'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Program Modal */}
            {showEditProgramModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Sửa Chương Trình</h2>
                            <button
                                onClick={() => setShowEditProgramModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên chương trình <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentProgram.name}
                                    onChange={handleProgramInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên chương trình"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={currentProgram.description}
                                    onChange={handleProgramInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mô tả về chương trình"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={currentProgram.start_date}
                                        onChange={handleProgramInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày kết thúc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={currentProgram.end_date}
                                        onChange={handleProgramInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min={currentProgram.start_date}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={currentProgram.location}
                                    onChange={handleProgramInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập địa điểm"
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditProgramModal(false)}
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateProgram}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Template Modal */}
            {showAddTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Thêm Mẫu Khảo Sát Mới</h2>
                            <button
                                onClick={() => setShowAddTemplateModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên mẫu khảo sát <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentTemplate.name}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên mẫu khảo sát"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại khảo sát <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={currentTemplate.type}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PRE">Khảo sát trước (PRE)</option>
                                    <option value="POST">Khảo sát sau (POST)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={currentTemplate.description}
                                    onChange={handleTemplateInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mô tả về mẫu khảo sát"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Form <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    name="googleFormUrl"
                                    value={currentTemplate.googleFormUrl}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://forms.google.com/..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Form Edit
                                </label>
                                <input
                                    type="url"
                                    name="googleFormUrlEdit"
                                    value={currentTemplate.googleFormUrlEdit}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://docs.google.com/forms/d/.../edit"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Sheet
                                </label>
                                <input
                                    type="url"
                                    name="googleSheetUrl"
                                    value={currentTemplate.googleSheetUrl}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chương trình
                                </label>
                                <select
                                    onChange={handleProgramChange}
                                    value={currentTemplate.program?.id || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Không có chương trình --</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>
                                            {program.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTemplateModal(false)}
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateTemplate}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Thêm mẫu khảo sát'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Template Modal */}
            {showEditTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Sửa Mẫu Khảo Sát</h2>
                            <button
                                onClick={() => setShowEditTemplateModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên mẫu khảo sát <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentTemplate.name}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên mẫu khảo sát"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại khảo sát <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={currentTemplate.type}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PRE">Khảo sát trước (PRE)</option>
                                    <option value="POST">Khảo sát sau (POST)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={currentTemplate.description}
                                    onChange={handleTemplateInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mô tả về mẫu khảo sát"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Form <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    name="googleFormUrl"
                                    value={currentTemplate.googleFormUrl}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://forms.google.com/..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Form Edit
                                </label>
                                <input
                                    type="url"
                                    name="googleFormUrlEdit"
                                    value={currentTemplate.googleFormUrlEdit}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://docs.google.com/forms/d/.../edit"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Google Sheet
                                </label>
                                <input
                                    type="url"
                                    name="googleSheetUrl"
                                    value={currentTemplate.googleSheetUrl}
                                    onChange={handleTemplateInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chương trình
                                </label>
                                <select
                                    onChange={handleProgramChange}
                                    value={currentTemplate.program?.id || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Không có chương trình --</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>
                                            {program.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditTemplateModal(false)}
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateTemplate}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal danh sách người tham gia */}
            {/* Modal danh sách người tham gia - Cải tiến */}
            {showParticipantsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-5xl p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Danh sách người tham gia</h2>
                            <button
                                onClick={() => setShowParticipantsModal(false)}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loadingParticipants ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-blue-500"></div>
                                <p className="mt-4 text-xl text-gray-600">Đang tải danh sách...</p>
                            </div>
                        ) : currentProgramParticipants.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="mt-6 text-2xl font-medium text-gray-700">Chưa có người tham gia</h3>
                                <p className="mt-2 text-lg text-gray-500">Chương trình này chưa có người tham gia.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Họ tên</th>
                                            <th className="px-8 py-4 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                            <th className="px-8 py-4 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Điện thoại</th>
                                            <th className="px-8 py-4 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Ngày sinh</th>
                                            <th className="px-8 py-4 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Giới tính</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentProgramParticipants.map(participant => (
                                            <tr key={participant.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-gray-900">{participant.fullName}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">{participant.email}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">{participant.phoneNumber || '-'}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">{formatDate(participant.dateOfBirth)}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">
                                                    {participant.gender === 'MALE' ? 'Nam' : participant.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowParticipantsModal(false)}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors duration-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal gửi khảo sát - Make it more responsive */}
            {showSendSurveyModal && selectedProgramForSurvey && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Gửi Email Khảo Sát</h2>
                            <button
                                onClick={() => setShowSendSurveyModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại khảo sát <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={surveyType}
                                    onChange={(e) => setSurveyType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PRE">Khảo sát trước (PRE)</option>
                                    <option value="POST">Khảo sát sau (POST)</option>
                                </select>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSendSurveyModal(false)}
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    disabled={sendingSurvey}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendSurvey}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none flex items-center"
                                    disabled={sendingSurvey}
                                >
                                    {sendingSurvey ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Gửi khảo sát
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Program;