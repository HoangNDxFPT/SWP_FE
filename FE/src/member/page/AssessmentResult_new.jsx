import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssessmentResult() {
  const { assessmentResultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [viewMode, setViewMode] = useState('grouped');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        
        // Thử sử dụng API mới trước (cho ASSIST với multiple substances)
        try {
          const newApiRes = await api.get(`/assessment-results/${assessmentResultId}/by-substance`);
          if (newApiRes.status === 200 && newApiRes.data) {
            console.log('✅ Using new API with substance results:', newApiRes.data);
            setResult(newApiRes.data);
            return;
          }
        } catch (error) {
          console.log('ℹ️ New API not available, trying fallback:', error.message);
        }
        
        // Fallback về API cũ
        const res = await api.get(`/assessment-results/${assessmentResultId}`);
        if (res.status === 200 && res.data) {
          console.log('✅ Using fallback API:', res.data);
          setResult(res.data);
        } else {
          throw new Error('No data received from API');
        }
      } catch (err) {
        console.error('❌ Error fetching assessment result:', err);
        toast.error('Không thể tải kết quả đánh giá!');
        // Navigate back to assessment page after error
        setTimeout(() => navigate('/assessment'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (assessmentResultId) {
      fetchResult();
    }
  }, [assessmentResultId, navigate]);

  // Risk Level Helper Function
  const getRiskLevelInfo = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          text: 'Thấp',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      case 'MEDIUM':
        return {
          text: 'Trung bình',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300'
        };
      case 'HIGH':
        return {
          text: 'Cao',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      default:
        return {
          text: 'Chưa xác định',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải kết quả đánh giá...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy kết quả</h1>
            <p className="text-gray-600 mb-6">Kết quả đánh giá không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/assessment')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
            >
              Quay lại đánh giá
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
            <span>›</span>
            <Link to="/assessment" className="hover:text-blue-600">Đánh giá</Link>
            <span>›</span>
            <span className="text-gray-900">Kết quả đánh giá</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Kết quả đánh giá {result.assessmentType}
                </h1>
                <p className="text-gray-600">
                  Hoàn thành lúc: {new Date(result.completedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {result.score || result.totalScore || 0} điểm
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).bgColor} ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).color} border ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).borderColor}`}>
                  {getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tổng quan
              </button>
              
              {(result.answers?.length > 0 || result.substanceResults?.length > 0) && (
                <button
                  onClick={() => setActiveTab('answers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'answers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chi tiết câu trả lời
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recommendations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Khuyến nghị
              </button>
            </nav>
          </div>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg shadow-sm p-6 animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">Tổng quan kết quả</h3>
            
            {result.assessmentType === 'ASSIST' && result.substanceResults?.length > 0 ? (
              // ASSIST with multiple substances
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-blue-800">Tổng điểm</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{result.score || result.totalScore}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-purple-800">Số chất được đánh giá</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{result.substanceResults.length}</p>
                  </div>
                  
                  <div className={`rounded-lg p-4 border ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).bgColor} ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).borderColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).color}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h4 className={`font-semibold ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).color}`}>Mức độ rủi ro</h4>
                    </div>
                    <p className={`text-2xl font-bold ${getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).color}`}>
                      {getRiskLevelInfo(result.riskLevel || result.overallRiskLevel).text}
                    </p>
                  </div>
                </div>

                {/* Substance Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.substanceResults.map((substanceResult) => {
                    const riskInfo = getRiskLevelInfo(substanceResult.riskLevel);
                    return (
                      <div key={substanceResult.substanceId} className={`rounded-lg border p-6 ${riskInfo.bgColor} ${riskInfo.borderColor}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${riskInfo.bgColor}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${riskInfo.color}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className={`font-semibold ${riskInfo.color}`}>{substanceResult.substanceName}</h4>
                            <p className="text-sm text-gray-600">{substanceResult.answers?.length || 0} câu hỏi</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Điểm số:</span>
                            <span className={`font-bold text-lg ${riskInfo.color}`}>
                              {substanceResult.substanceScore || substanceResult.score || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Mức độ rủi ro:</span>
                            <span className={`font-medium ${riskInfo.color}`}>
                              {riskInfo.text}
                            </span>
                          </div>
                          {substanceResult.criteria && (
                            <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-700">
                              <span className="font-medium">Tiêu chí:</span> {substanceResult.criteria}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Single assessment or CRAFFT
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-blue-800">Loại đánh giá</h4>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{result.assessmentType}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-purple-800">Điểm số</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{result.score || result.totalScore || 0}</p>
                  </div>
                  
                  <div className={`rounded-lg p-4 border ${getRiskLevelInfo(result.riskLevel).bgColor} ${getRiskLevelInfo(result.riskLevel).borderColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${getRiskLevelInfo(result.riskLevel).color}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h4 className={`font-semibold ${getRiskLevelInfo(result.riskLevel).color}`}>Mức độ rủi ro</h4>
                    </div>
                    <p className={`text-2xl font-bold ${getRiskLevelInfo(result.riskLevel).color}`}>
                      {getRiskLevelInfo(result.riskLevel).text}
                    </p>
                  </div>
                </div>

                {result.substance && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Chất được đánh giá:</h4>
                    <p className="text-gray-700">{result.substance.name}</p>
                    {result.substance.description && (
                      <p className="text-sm text-gray-600 mt-1">{result.substance.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Answer Details Tab Content */}
        {activeTab === 'answers' && (result.answers?.length > 0 || result.substanceResults?.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-6 animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">Chi tiết câu trả lời</h3>

            {result.assessmentType === 'ASSIST' && result.substanceResults?.length > 0 ? (
              // ASSIST with substanceResults
              <div>
                {/* ASSIST Overview */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-lg font-semibold text-blue-800">Đánh giá ASSIST</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Kết quả đánh giá cho {result.substanceResults.length} loại chất
                    {' - '}Tổng điểm: {result.score || result.totalScore} - Mức độ rủi ro: <span className="font-semibold">{getRiskLevelInfo(result.riskLevel || result.overallRiskLevel)?.text || 'Chưa xác định'}</span>
                  </p>
                </div>

                {/* Substance Results với answers chi tiết */}
                {result.substanceResults.map((substanceResult) => {
                  const substanceRiskInfo = getRiskLevelInfo(substanceResult.riskLevel);
                  return (
                    <div key={substanceResult.substanceId} className="mb-8">
                      {/* Substance Header */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">{substanceResult.substanceName}</h4>
                              {substanceResult.substanceDescription && (
                                <p className="text-sm text-gray-600">{substanceResult.substanceDescription}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${substanceRiskInfo.bgColor} ${substanceRiskInfo.color} border ${substanceRiskInfo.borderColor}`}>
                              {substanceRiskInfo.text}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Điểm: <span className={`font-bold ${substanceRiskInfo.color}`}>{substanceResult.substanceScore || substanceResult.score}</span>
                            </div>
                          </div>
                        </div>
                        {substanceResult.criteria && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Tiêu chí đánh giá:</span> {substanceResult.criteria}
                          </div>
                        )}
                      </div>

                      {/* Substance Answers */}
                      <div className="space-y-4">
                        {substanceResult.answers.map((answer, answerIndex) => (
                          <div
                            key={`${substanceResult.substanceId}-${answer.questionOrder}-${answerIndex}`}
                            className={`p-4 rounded-lg border ${answer.score > 2
                              ? 'border-red-200 bg-red-50'
                              : answer.score > 0
                                ? 'border-yellow-200 bg-yellow-50'
                                : 'border-gray-200 bg-gray-50'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`inline-flex justify-center items-center w-8 h-8 ${answer.score > 2
                                ? 'bg-red-100 text-red-800'
                                : answer.score > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                } rounded-full shrink-0 font-semibold`}>
                                {answer.questionOrder}
                              </span>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800 mb-3">
                                  {answer.questionText}
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-sm font-medium">Trả lời:</span>
                                    <span className="font-medium text-gray-800 bg-white px-3 py-1 rounded-md border">
                                      {answer.answerText}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-sm font-medium">Điểm:</span>
                                    <span className={`font-bold text-xl ${answer.score > 2
                                      ? 'text-red-600'
                                      : answer.score > 0
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                      }`}>
                                      {answer.score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : result.assessmentType === 'CRAFFT' ? (
              // CRAFFT Assessment
              <div className="space-y-4">
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-lg font-semibold text-green-800">Đánh giá CRAFFT</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Tổng điểm: {result.score || result.totalScore} - Mức độ rủi ro: <span className="font-semibold">{getRiskLevelInfo(result.riskLevel).text}</span>
                  </p>
                </div>

                {result.answers.map((answer, index) => (
                  <div
                    key={`crafft-${answer.questionId}-${index}`}
                    className={`p-4 rounded-lg border ${answer.score > 0
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex justify-center items-center w-6 h-6 ${answer.score > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                        } rounded-full shrink-0 font-medium text-sm`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-2">
                          {answer.questionText}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Câu trả lời:</span>
                            <span className="font-medium">{answer.answerText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Điểm:</span>
                            <span className={`font-medium ${answer.score > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {answer.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback for other types
              <div className="text-center py-8">
                <p className="text-gray-500">Không có dữ liệu chi tiết câu trả lời</p>
              </div>
            )}
          </div>
        )}

        {/* No answers available message */}
        {activeTab === 'answers' && !(result.answers?.length > 0 || result.substanceResults?.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-6 animate-fadeIn text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Không có chi tiết câu trả lời</h3>
            <p className="text-gray-500">
              Dữ liệu chi tiết câu trả lời không khả dụng cho kết quả đánh giá này.
            </p>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-lg shadow-sm p-6 animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">Khuyến nghị điều trị</h3>
            
            {result.recommendations?.length > 0 ? (
              <div className="space-y-4">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">
                          {recommendation.title || `Khuyến nghị ${index + 1}`}
                        </h4>
                        <p className="text-blue-700">{recommendation.description || recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Chưa có khuyến nghị cụ thể</h3>
                <p className="text-gray-500 mb-4">
                  Hãy tham khảo ý kiến chuyên gia để có lời khuyên phù hợp với tình trạng của bạn.
                </p>
                <Link
                  to="/consultant"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Đặt lịch tư vấn
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          <button
            onClick={() => navigate('/assessment')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition shadow font-medium"
          >
            Thực hiện đánh giá mới
          </button>

          <button
            onClick={() => navigate('/assessment-history')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg transition font-medium"
          >
            Xem lịch sử đánh giá
          </button>

          <Link
            to="/consultant"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition shadow font-medium"
          >
            Đặt lịch tư vấn
          </Link>

          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg transition shadow font-medium"
          >
            In kết quả
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default AssessmentResult;
