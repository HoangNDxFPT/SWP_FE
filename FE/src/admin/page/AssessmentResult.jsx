import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

function AssessmentResult() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  
  // Risk recommendation states
  const [riskRecommendations, setRiskRecommendations] = useState([]);
  const [currentRecommendation, setCurrentRecommendation] = useState({
    minScore: 0,
    maxScore: 0,
    riskLevel: '',
    recommendationText: '',
    assessmentType: 'CRAFFT' // Default
  });
  
  // Modal states
  const [showResultDetail, setShowResultDetail] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [editingRecommendationId, setEditingRecommendationId] = useState(null);
  
  // Filter states
  const [assessmentType, setAssessmentType] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [scoreBounds, setScoreBounds] = useState({ min: '', max: '' });
  
  const ASSESSMENT_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'CRAFFT', label: 'CRAFFT' },
    { value: 'ASSIST', label: 'ASSIST' }
  ];
  
  const RISK_LEVELS = [
    { value: 'LOW', label: 'Low Risk', color: 'green' },
    { value: 'MODERATE', label: 'Moderate Risk', color: 'yellow' },
    { value: 'HIGH', label: 'High Risk', color: 'red' }
  ];

  useEffect(() => {
    fetchAssessmentResults();
    fetchRiskRecommendations();
  }, []);

  const fetchAssessmentResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assessments/results');
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to load assessment results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskRecommendations = async () => {
    try {
      const response = await api.get('/admin/risk-recommendations');
      setRiskRecommendations(response.data);
    } catch (error) {
      toast.error('Failed to load risk recommendations');
      console.error(error);
    }
  };

  const fetchResultDetails = async (resultId) => {
    try {
      setLoading(true);
      const response = await api.get(`/assessments/results/${resultId}`);
      setSelectedResult(response.data);
      setShowResultDetail(true);
    } catch (error) {
      toast.error('Failed to load result details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecommendation = async () => {
    // Validation
    if (
      !currentRecommendation.assessmentType ||
      !currentRecommendation.riskLevel ||
      !currentRecommendation.recommendationText ||
      currentRecommendation.minScore > currentRecommendation.maxScore
    ) {
      toast.error('Please fill all fields correctly');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/risk-recommendations', currentRecommendation);
      toast.success('Risk recommendation created successfully');
      fetchRiskRecommendations();
      resetRecommendationForm();
      setShowRecommendationModal(false);
    } catch (error) {
      toast.error('Failed to create risk recommendation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecommendation = async () => {
    // Validation
    if (
      !currentRecommendation.assessmentType ||
      !currentRecommendation.riskLevel ||
      !currentRecommendation.recommendationText ||
      currentRecommendation.minScore > currentRecommendation.maxScore
    ) {
      toast.error('Please fill all fields correctly');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/admin/risk-recommendations/${editingRecommendationId}`, currentRecommendation);
      toast.success('Risk recommendation updated successfully');
      fetchRiskRecommendations();
      resetRecommendationForm();
      setShowRecommendationModal(false);
    } catch (error) {
      toast.error('Failed to update risk recommendation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecommendation = async (id) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
      try {
        setLoading(true);
        await api.delete(`/admin/risk-recommendations/${id}`);
        toast.success('Risk recommendation deleted successfully');
        fetchRiskRecommendations();
      } catch (error) {
        toast.error('Failed to delete risk recommendation');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetRecommendationForm = () => {
    setCurrentRecommendation({
      minScore: 0,
      maxScore: 0,
      riskLevel: '',
      recommendationText: '',
      assessmentType: 'CRAFFT'
    });
    setEditingRecommendationId(null);
  };

  const openEditRecommendationModal = (recommendation) => {
    setCurrentRecommendation({
      minScore: recommendation.minScore,
      maxScore: recommendation.maxScore,
      riskLevel: recommendation.riskLevel,
      recommendationText: recommendation.recommendationText,
      assessmentType: recommendation.assessmentType
    });
    setEditingRecommendationId(recommendation.id);
    setShowRecommendationModal(true);
  };

  const filterResults = () => {
    let filtered = [...results];
    
    if (assessmentType) {
      filtered = filtered.filter(result => result.assessmentType === assessmentType);
    }
    
    if (dateRange.startDate) {
      filtered = filtered.filter(result => new Date(result.completedAt) >= new Date(dateRange.startDate));
    }
    
    if (dateRange.endDate) {
      filtered = filtered.filter(result => new Date(result.completedAt) <= new Date(dateRange.endDate));
    }
    
    if (scoreBounds.min !== '') {
      filtered = filtered.filter(result => result.score >= parseInt(scoreBounds.min));
    }
    
    if (scoreBounds.max !== '') {
      filtered = filtered.filter(result => result.score <= parseInt(scoreBounds.max));
    }
    
    return filtered;
  };

  const resetFilters = () => {
    setAssessmentType('');
    setDateRange({ startDate: '', endDate: '' });
    setScoreBounds({ min: '', max: '' });
  };

  const getRiskLevelColor = (riskLevel) => {
    const level = RISK_LEVELS.find(l => l.value === riskLevel);
    return level ? level.color : 'gray';
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  // Special rendering for ASSIST results
  const renderAssistResults = (result) => {
    if (!result.substanceScores || Object.keys(result.substanceScores).length === 0) {
      return <p>No substance data available</p>;
    }

    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Substance Risk Levels</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(result.substanceScores).map(([substance, data]) => (
                <tr key={substance}>
                  <td className="px-6 py-4 whitespace-nowrap">{data.substanceName || substance}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{data.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getRiskLevelColor(data.riskLevel)}-100 text-${getRiskLevelColor(data.riskLevel)}-800`}>
                      {data.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">{data.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const filteredResults = filterResults();

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assessment Results</h1>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => {
            resetRecommendationForm();
            setShowRecommendationModal(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Risk Recommendation
        </button>
      </div>
      
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
            >
              {ASSESSMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input 
                type="date" 
                className="w-full border rounded px-3 py-2"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
              <span className="self-center">to</span>
              <input 
                type="date" 
                className="w-full border rounded px-3 py-2"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                className="w-full border rounded px-3 py-2"
                placeholder="Min"
                value={scoreBounds.min}
                onChange={(e) => setScoreBounds({...scoreBounds, min: e.target.value})}
              />
              <span className="self-center">to</span>
              <input 
                type="number" 
                className="w-full border rounded px-3 py-2"
                placeholder="Max"
                value={scoreBounds.max}
                onChange={(e) => setScoreBounds({...scoreBounds, max: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
          Assessment Results
        </button>
        <button className="px-4 py-2 font-medium text-gray-500 hover:text-blue-600">
          Risk Recommendations
        </button>
      </div>
      
      {/* Results Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-gray-500">No assessment results found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Assessment Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Completed At</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">{result.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{result.userName || "Anonymous"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{result.assessmentType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(result.completedAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{result.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getRiskLevelColor(result.riskLevel)}-100 text-${getRiskLevelColor(result.riskLevel)}-800`}>
                      {result.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => fetchResultDetails(result.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Recommendations Table */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Risk Recommendations</h2>
        {riskRecommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <p className="text-gray-500">No risk recommendations found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Assessment Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Score Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Recommendation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riskRecommendations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{rec.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rec.assessmentType}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rec.minScore} - {rec.maxScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getRiskLevelColor(rec.riskLevel)}-100 text-${getRiskLevelColor(rec.riskLevel)}-800`}>
                        {rec.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {rec.recommendationText.length > 50 
                        ? `${rec.recommendationText.substring(0, 50)}...` 
                        : rec.recommendationText}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => openEditRecommendationModal(rec)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteRecommendation(rec.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Result Detail Modal */}
      {showResultDetail && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assessment Result Details</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowResultDetail(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Assessment ID</p>
                  <p className="font-medium">{selectedResult.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessment Type</p>
                  <p className="font-medium">{selectedResult.assessmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedResult.userName || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed At</p>
                  <p className="font-medium">{formatDate(selectedResult.completedAt)}</p>
                </div>
                {selectedResult.assessmentType !== 'ASSIST' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Total Score</p>
                      <p className="font-medium">{selectedResult.score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Risk Level</p>
                      <p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getRiskLevelColor(selectedResult.riskLevel)}-100 text-${getRiskLevelColor(selectedResult.riskLevel)}-800`}>
                          {selectedResult.riskLevel}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {selectedResult.assessmentType === 'ASSIST' ? (
                // ASSIST specific result display
                renderAssistResults(selectedResult)
              ) : (
                // Standard results
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommendation</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p>{selectedResult.recommendation || "No recommendation available."}</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3 mt-6">Question Responses</h3>
                  {selectedResult.responses && selectedResult.responses.length > 0 ? (
                    <div className="space-y-4">
                      {selectedResult.responses.map((response, index) => (
                        <div key={index} className="border-b pb-4">
                          <p className="font-medium">{response.questionText}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-gray-600">{response.answerText}</p>
                            <p className="text-blue-600">Score: {response.score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No detailed responses available</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => setShowResultDetail(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Recommendation Modal */}
      {showRecommendationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingRecommendationId ? "Edit Risk Recommendation" : "Add Risk Recommendation"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowRecommendationModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentRecommendation.assessmentType}
                  onChange={(e) => setCurrentRecommendation({
                    ...currentRecommendation,
                    assessmentType: e.target.value
                  })}
                >
                  {ASSESSMENT_TYPES.filter(t => t.value).map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentRecommendation.riskLevel}
                  onChange={(e) => setCurrentRecommendation({
                    ...currentRecommendation,
                    riskLevel: e.target.value
                  })}
                >
                  <option value="">Select Risk Level</option>
                  {RISK_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Range <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Min Score"
                    value={currentRecommendation.minScore}
                    onChange={(e) => setCurrentRecommendation({
                      ...currentRecommendation,
                      minScore: parseInt(e.target.value) || 0
                    })}
                    min="0"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Max Score"
                    value={currentRecommendation.maxScore}
                    onChange={(e) => setCurrentRecommendation({
                      ...currentRecommendation,
                      maxScore: parseInt(e.target.value) || 0
                    })}
                    min={currentRecommendation.minScore}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="4"
                  value={currentRecommendation.recommendationText}
                  onChange={(e) => setCurrentRecommendation({
                    ...currentRecommendation,
                    recommendationText: e.target.value
                  })}
                  placeholder="Enter recommendation text"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setShowRecommendationModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={editingRecommendationId ? handleUpdateRecommendation : handleCreateRecommendation}
                  disabled={loading}
                >
                  {loading ? "Processing..." : editingRecommendationId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentResult;