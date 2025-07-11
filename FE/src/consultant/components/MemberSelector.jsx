// consultant/components/MemberSelector.jsx
import React, { useState } from 'react';
import { AutoComplete, Card, message } from 'antd';
import { Search, User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MemberSelector = ({ 
  members, 
  onSelectMember, 
  selectedMember, 
  loading = false 
}) => {
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchMembers = (searchText) => {
    if (!searchText || searchText.length < 1) {
      setSearchOptions([]);
      return;
    }


    const filteredMembers = members.filter(member => 
      member.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      member.email.toLowerCase().includes(searchText.toLowerCase()) ||
      member.phoneNumber.includes(searchText)
    );

    const options = filteredMembers.map(member => ({
      value: member.fullName,
      label: (
        <div className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{member.fullName}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              {member.phoneNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              {member.address || 'Chưa có địa chỉ'}
            </div>
          </div>
        </div>
      ),
      member: member
    }));

    setSearchOptions(options);
  };

  const handleSelectMember = (value, option) => {
    const member = option.member;
    onSelectMember(member);
    message.success(`Đã chọn khách hàng: ${member.fullName}`);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Tìm kiếm khách hàng</h3>
        </div>
        
        <AutoComplete
          value={searchValue}
          placeholder="🔍 Nhập tên, email hoặc số điện thoại để tìm kiếm khách hàng..."
          options={searchOptions}
          onSearch={handleSearchMembers}
          onSelect={handleSelectMember}
          className="w-full"
          size="large"
          loading={loading}
          filterOption={false}
          dropdownClassName="member-search-dropdown"
        />
        
        <div className="text-sm text-blue-600 mt-2">
          💡 Nhập ít nhất 1 ký tự để bắt đầu tìm kiếm
        </div>
      </Card>

      {/* Selected Member Indicator */}
      {selectedMember && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-semibold text-green-800">
                ✅ Đã chọn khách hàng: {selectedMember.fullName}
              </div>
              <div className="text-sm text-green-600">
                Email: {selectedMember.email}
              </div>
              <div className="text-sm text-green-600">
                SĐT: {selectedMember.phoneNumber}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MemberSelector;
