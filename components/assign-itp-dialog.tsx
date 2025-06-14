import React, { useState, useEffect } from 'react';

// Mock data for demonstration - replace with your actual data fetching
const mockITPs = [
  {
    id: 'itp-1',
    title: 'Highway Concrete Pour Inspection',
    description: 'Quality inspection for highway concrete pouring activities',
    category: 'Structural',
    estimatedDuration: '2 days',
    complexity: 'moderate',
    requiredCertifications: ['Concrete Testing', 'Highway Construction']
  },
  {
    id: 'itp-2', 
    title: 'Asphalt Layer Quality Check',
    description: 'Inspection of asphalt layer thickness and compaction',
    category: 'Roadwork',
    estimatedDuration: '1 day',
    complexity: 'simple',
    requiredCertifications: ['Asphalt Testing']
  },
  {
    id: 'itp-3',
    title: 'Bridge Foundation Inspection',
    description: 'Comprehensive inspection of bridge foundation work',
    category: 'Infrastructure', 
    estimatedDuration: '3 days',
    complexity: 'complex',
    requiredCertifications: ['Structural Engineering', 'Bridge Construction']
  }
];

const mockTeamMembers = [
  {
    id: 'user-1',
    name: 'John Rodriguez',
    role: 'Senior Highway Inspector',
    certifications: ['Concrete Testing', 'Highway Construction', 'Asphalt Testing'],
    currentWorkload: 65
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    role: 'Quality Engineer',
    certifications: ['Structural Engineering', 'Bridge Construction'],
    currentWorkload: 40
  },
  {
    id: 'user-3',
    name: 'Mike Thompson',
    role: 'Site Inspector',
    certifications: ['Asphalt Testing', 'Concrete Testing'],
    currentWorkload: 80
  }
];

// Simple Modal Component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// Simple Components
function Button({ children, onClick, disabled, variant = 'primary', className = '', size = 'md' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const baseClasses = "font-medium transition-colors rounded-md flex items-center justify-center";
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg min-h-[44px]"
  };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, children, placeholder, disabled }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
    >
      <option value="" className="text-gray-500">{placeholder}</option>
      {children}
    </select>
  );
}

function Input({ type = 'text', value, onChange, placeholder, disabled, className = '' }: {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${className}`}
    />
  );
}

function Textarea({ value, onChange, placeholder, disabled, rows = 3 }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-500"
    />
  );
}

function Badge({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm',
    success: 'bg-green-100 text-green-700 px-2 py-1 rounded text-sm',
    warning: 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm',
    danger: 'bg-red-100 text-red-700 px-2 py-1 rounded text-sm',
    info: 'bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm'
  };
  
  return <span className={variants[variant]}>{children}</span>;
}

// Main Component
export default function AssignITPDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedITP, setSelectedITP] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState('');

  // Lot information from the page context
  const lot = {
    id: 'lot-33',
    name: 'Daily Lot Report - 33',
    project: 'Highway 101 Expansion',
    location: 'Highway 101, Section 33',
    priority: 'high'
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedITP('');
    setAssignedTo('');
    setScheduledDate('');
    setPriority('medium');
    setNotes('');
  };

  const selectedITPDetails = mockITPs.find(itp => itp.id === selectedITP);
  const selectedMember = mockTeamMembers.find(member => member.id === assignedTo);

  const calculateEstimatedCompletion = () => {
    if (!scheduledDate || !selectedITPDetails) return '';
    
    const scheduled = new Date(scheduledDate);
    const durationDays = parseInt(selectedITPDetails.estimatedDuration?.split(' ')[0] || '1') || 1;
    const completion = new Date(scheduled.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    
    return completion.toISOString().split('T')[0]!;
  };

  const getCompatibilityScore = (member: any, itp: any) => {
    if (!itp.requiredCertifications) return 100;
    
    const hasRequired = itp.requiredCertifications.every((cert: string) => 
      member.certifications.includes(cert)
    );
    
    return hasRequired ? Math.max(0, 100 - member.currentWorkload) : 0;
  };

  const handleAssign = async () => {
    if (!selectedITP || !assignedTo || !scheduledDate) {
      showNotification('Please fill in all required fields.');
      return;
    }

    // Check certification requirements
    if (selectedITPDetails?.requiredCertifications && selectedMember) {
      const missingCerts = selectedITPDetails.requiredCertifications.filter(
        cert => !selectedMember.certifications.includes(cert)
      );
      
      if (missingCerts.length > 0) {
        showNotification(`Selected team member is missing certifications: ${missingCerts.join(', ')}`);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Simulate API call - replace with your actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification(`Success! ITP "${selectedITPDetails?.title}" assigned to ${selectedMember?.name} for ${lot.name}`);
      setIsOpen(false);
      resetForm();
      
      // In your real app, this would trigger a page refresh or data refetch
      console.log('Assignment completed:', {
        lotId: lot.id,
        itpId: selectedITP,
        assignedTo,
        scheduledDate,
        priority,
        notes
      });
    } catch (error) {
      showNotification('Assignment failed. Please try again.');
      console.error('Assignment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'complex': return 'danger';
      case 'moderate': return 'warning';
      case 'simple': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="w-full">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 max-w-md">
          {notification}
        </div>
      )}

      {/* Main Assign Button - matches your existing style */}
      <Button 
        onClick={() => setIsOpen(true)}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        Assign ITP to Lot
      </Button>

      {/* Assignment Dialog */}
      <Modal isOpen={isOpen} onClose={() => handleOpenChange(false)}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Assign Inspection & Test Plan
              </h2>
              <p className="text-gray-600 mt-1">
                Assign an ITP to <span className="font-medium">{lot.name}</span>
              </p>
            </div>
            <button 
              onClick={() => handleOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lot Information Card */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Lot Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Project:</span>
                <p className="font-medium">{lot.project}</p>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <p className="font-medium">{lot.location}</p>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <Badge variant={getPriorityColor(lot.priority) as any}>
                  {lot.priority.charAt(0).toUpperCase() + lot.priority.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* ITP Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Inspection & Test Plan *
              </label>
              <Select
                value={selectedITP}
                onChange={setSelectedITP}
                placeholder="Choose an inspection plan..."
                disabled={isLoading}
              >
                {mockITPs.map((itp) => (
                  <option key={itp.id} value={itp.id}>
                    {itp.title} - {itp.category} ({itp.estimatedDuration})
                  </option>
                ))}
              </Select>
              
              {selectedITPDetails && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 mb-2">{selectedITPDetails.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="info">Duration: {selectedITPDetails.estimatedDuration}</Badge>
                    <Badge variant={getComplexityColor(selectedITPDetails.complexity) as any}>
                      {selectedITPDetails.complexity} complexity
                    </Badge>
                  </div>
                  {selectedITPDetails.requiredCertifications?.length > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      <strong>Required certifications:</strong> {selectedITPDetails.requiredCertifications.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team Member Assignment */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Assign to Team Member *
              </label>
              <Select
                value={assignedTo}
                onChange={setAssignedTo}
                placeholder="Select team member..."
                disabled={isLoading}
              >
                {mockTeamMembers.map((member) => {
                  const compatibility = selectedITPDetails ? getCompatibilityScore(member, selectedITPDetails) : 100;
                  const isCompatible = compatibility > 0;
                  
                  return (
                    <option 
                      key={member.id} 
                      value={member.id}
                      disabled={!isCompatible}
                    >
                      {member.name} ({member.role}) - Workload: {member.currentWorkload}% 
                      {selectedITPDetails && (isCompatible ? ' ✓' : ' ✗ Missing certs')}
                    </option>
                  );
                })}
              </Select>

              {selectedMember && (
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Certifications:</span>
                    <div className="flex gap-1 flex-wrap">
                      {selectedMember.certifications.map(cert => (
                        <Badge key={cert} variant="default">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduling and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Scheduled Date *
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
                </label>
                <Select
                  value={priority}
                  onChange={setPriority}
                  disabled={isLoading}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Est. Completion
                </label>
                <Input
                  value={calculateEstimatedCompletion()}
                  disabled
                  placeholder="Select date first"
                  className="bg-gray-100"
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Notes
              </label>
              <Textarea
                value={notes}
                onChange={setNotes}
                placeholder="Add any specific instructions or requirements for this inspection..."
                disabled={isLoading}
              />
            </div>

            {/* Assignment Preview */}
            {selectedITPDetails && selectedMember && scheduledDate && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Assignment Ready</p>
                    <p className="text-green-800">
                      <span className="font-medium">{selectedITPDetails.title}</span> will be assigned to{' '}
                      <span className="font-medium">{selectedMember.name}</span>
                    </p>
                    <p className="text-green-700 text-xs mt-1">
                      Scheduled: {new Date(scheduledDate).toLocaleDateString()} • 
                      Est. completion: {calculateEstimatedCompletion() ? new Date(calculateEstimatedCompletion()).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 mt-8 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={isLoading || !selectedITP || !assignedTo || !scheduledDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Assign ITP
                </span>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}