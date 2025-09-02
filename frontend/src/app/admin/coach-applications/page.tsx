'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Simple Badge component since ui/badge doesn't exist
const Badge = ({ children, className = '', variant = 'default' }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700',
    destructive: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface CoachApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  coaching_expertise: string[];
  coaching_experience_years: string;
  act_training_level: string;
  languages_fluent: string[];
}

interface ApplicationDetails extends CoachApplication {
  educational_background: string;
  professional_certifications: string[];
  age_groups_comfortable: string[];
  coaching_philosophy: string;
  coaching_techniques: string[];
  session_structure: string;
  scope_handling_approach: string;
  professional_discipline_history: boolean;
  discipline_explanation?: string;
  boundary_maintenance_approach: string;
  comfortable_with_suicidal_thoughts: string;
  self_harm_protocol: string;
  weekly_hours_available: string;
  preferred_session_length: string;
  availability_times: string[];
  video_conferencing_comfort: string;
  internet_connection_quality: string;
  references: Array<{
    name: string;
    title: string;
    organization: string;
    email: string;
    phone?: string;
  }>;
  agreements_accepted: Record<string, boolean>;
}

export default function CoachApplicationsPage() {
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetchApplications(storedToken);
    }
  }, [statusFilter, searchTerm, experienceFilter, sortBy, sortOrder]);

  const fetchApplications = async (authToken?: string) => {
    try {
      setLoading(true);
      
      // Get token from parameter or localStorage
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (experienceFilter !== 'all') params.append('experience', experienceFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const url = `${getApiUrl()}/api/coach-applications/applications?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      
      // Apply client-side filtering for search term if backend doesn't support it
      let filteredApplications = data.applications || [];
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredApplications = filteredApplications.filter((app: CoachApplication) =>
          app.first_name.toLowerCase().includes(term) ||
          app.last_name.toLowerCase().includes(term) ||
          app.email.toLowerCase().includes(term) ||
          app.coaching_expertise.some(expertise => expertise.toLowerCase().includes(term))
        );
      }
      
      setApplications(filteredApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/coach-applications/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setSelectedApplication(data.application);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, reason?: string) => {
    try {
      setActionLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setActionLoading(false);
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/coach-applications/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reason,
          reviewerId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh applications list
      await fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      suspended: { color: 'bg-gray-100 text-gray-800', label: 'Suspended' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coach Applications</h1>
          <p className="text-gray-600">Review and manage coach verification applications</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <Button onClick={() => fetchApplications()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {application.first_name} {application.last_name}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Email:</strong> {application.email}</p>
                        <p><strong>Phone:</strong> {application.phone || 'Not provided'}</p>
                        <p><strong>Experience:</strong> {application.coaching_experience_years}</p>
                      </div>
                      <div>
                        <p><strong>ACT Training:</strong> {application.act_training_level}</p>
                        <p><strong>Languages:</strong> {application.languages_fluent.join(', ')}</p>
                        <p><strong>Submitted:</strong> {formatDate(application.submitted_at)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <strong>Expertise:</strong> {application.coaching_expertise.slice(0, 3).join(', ')}
                        {application.coaching_expertise.length > 3 && ` +${application.coaching_expertise.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => fetchApplicationDetails(application.id)}
                      variant="outline"
                      size="sm"
                    >
                      Review
                    </Button>
                    
                    {application.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Quick Approve
                        </Button>
                        <Button
                          onClick={() => updateApplicationStatus(application.id, 'rejected', 'Application did not meet requirements')}
                          size="sm"
                          variant="destructive"
                        >
                          Quick Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => {
            setShowModal(false);
            setSelectedApplication(null);
          }}
          onStatusUpdate={updateApplicationStatus}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Application Details Modal Component
const ApplicationDetailsModal = ({ 
  application, 
  onClose, 
  onStatusUpdate, 
  loading 
}: {
  application: ApplicationDetails;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, reason?: string) => Promise<void>;
  loading: boolean;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const handleApprove = () => {
    onStatusUpdate(application.id, 'approved');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onStatusUpdate(application.id, 'rejected', rejectionReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {application.first_name} {application.last_name}
              </h2>
              <p className="text-gray-600">{application.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(application.status)}
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Professional Background */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Professional Background</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Education:</strong> {application.educational_background}</p>
                <p><strong>Experience:</strong> {application.coaching_experience_years}</p>
                <p><strong>ACT Training:</strong> {application.act_training_level}</p>
              </div>
              <div>
                <p><strong>Certifications:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  {application.professional_certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Specialization */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Specialization & Expertise</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Areas of Expertise:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.coaching_expertise.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p><strong>Age Groups:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.age_groups_comfortable.map((group, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Coaching Philosophy */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Coaching Philosophy</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">{application.coaching_philosophy}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Techniques Used:</strong></p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {application.coaching_techniques.map((technique, index) => (
                    <li key={index}>{technique}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p><strong>Session Structure:</strong> {application.session_structure}</p>
              </div>
            </div>
          </section>

          {/* Ethics & Crisis Management */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Ethics & Crisis Management</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p><strong>Scope Handling Approach:</strong></p>
                <div className="bg-gray-50 p-3 rounded mt-1">
                  {application.scope_handling_approach}
                </div>
              </div>
              
              <div>
                <p><strong>Professional Discipline History:</strong> {application.professional_discipline_history ? 'Yes' : 'No'}</p>
                {application.professional_discipline_history && application.discipline_explanation && (
                  <div className="bg-yellow-50 p-3 rounded mt-1">
                    <p><strong>Explanation:</strong> {application.discipline_explanation}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p><strong>Boundary Maintenance:</strong> {application.boundary_maintenance_approach}</p>
              </div>
              
              <div>
                <p><strong>Comfort with Suicidal Thoughts:</strong> {application.comfortable_with_suicidal_thoughts}</p>
              </div>
              
              <div>
                <p><strong>Self-Harm Protocol:</strong></p>
                <div className="bg-gray-50 p-3 rounded mt-1">
                  {application.self_harm_protocol}
                </div>
              </div>
            </div>
          </section>

          {/* Availability & Technology */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Availability & Technology</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Weekly Hours:</strong> {application.weekly_hours_available}</p>
                <p><strong>Session Length:</strong> {application.preferred_session_length}</p>
                <p><strong>Video Comfort:</strong> {application.video_conferencing_comfort}</p>
                <p><strong>Internet Quality:</strong> {application.internet_connection_quality}</p>
              </div>
              <div>
                <p><strong>Availability Times:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.availability_times.map((time, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
                
                <p className="mt-3"><strong>Languages:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.languages_fluent.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Professional References */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Professional References</h3>
            <div className="grid gap-4">
              {application.references.map((ref, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium">Reference {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p><strong>Name:</strong> {ref.name}</p>
                      <p><strong>Title:</strong> {ref.title}</p>
                    </div>
                    <div>
                      <p><strong>Organization:</strong> {ref.organization}</p>
                      <p><strong>Email:</strong> {ref.email}</p>
                      {ref.phone && <p><strong>Phone:</strong> {ref.phone}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="border-t pt-6">
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={() => setShowRejectionForm(true)}
                  variant="destructive"
                  disabled={loading}
                >
                  Reject Application
                </Button>
                
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Approve Application'}
                </Button>
              </div>
              
              {showRejectionForm && (
                <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Please provide a detailed reason for rejection..."
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      onClick={() => setShowRejectionForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      size="sm"
                      disabled={loading || !rejectionReason.trim()}
                    >
                      {loading ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    suspended: { color: 'bg-gray-100 text-gray-800', label: 'Suspended' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
};