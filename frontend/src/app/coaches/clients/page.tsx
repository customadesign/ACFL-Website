'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, User, Calendar, Clock, FileText } from 'lucide-react';
import CoachPageWrapper from '@/components/CoachPageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Client {
  id: string;
  user_id: string; // Add user_id for messaging
  name: string;
  email: string;
  phone?: string;
  totalSessions: number;
  lastSession?: string;
  nextSession?: string;
  status: 'active' | 'inactive';
  startDate: string;
  concerns: string[];
  notes?: string;
}

export default function MyClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/coach/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || client.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleSendMessage = (client: Client) => {
    setSelectedClient(client);
    setMessageSubject('');
    setMessageContent('');
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = async () => {
    if (!selectedClient || !messageSubject.trim() || !messageContent.trim()) return;

    try {
      setSendingMessage(true);
      
      // Use the client's user_id for messaging
      const response = await axios.post(`${API_URL}/api/coach/send-message`, {
        receiverId: selectedClient.user_id, // Use user_id instead of client.id
        subject: messageSubject.trim(),
        content: messageContent.trim(),
        messageType: 'general'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setShowMessageModal(false);
        setMessageSubject('');
        setMessageContent('');
        setSelectedClient(null);
        // Show success message or redirect to messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <CoachPageWrapper title="My Clients" description="Manage and view your client relationships">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clients...</p>
          </div>
        </div>
      </CoachPageWrapper>
    );
  }

  return (
    <CoachPageWrapper title="My Clients" description="Manage and view your client relationships">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, client) => sum + client.totalSessions, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClients.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No clients found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                    <p className="text-sm text-gray-500">{client.phone}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                    <p className="text-sm text-gray-900">{client.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Since</p>
                    <p className="text-sm text-gray-900">
                      {new Date(client.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Session</p>
                    <p className="text-sm text-gray-900">
                      {client.lastSession ? new Date(client.lastSession).toLocaleDateString() : 'No sessions yet'}
                    </p>
                  </div>
                  {client.nextSession && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Next Session</p>
                      <p className="text-sm text-gray-900">
                        {new Date(client.nextSession).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Areas of Focus</p>
                  <div className="flex flex-wrap gap-1">
                    {client.concerns.map((concern, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>

                {client.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900 mt-1">{client.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleViewDetails(client)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <User className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    onClick={() => handleSendMessage(client)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Client Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">
                Client Details - {selectedClient.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{selectedClient.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status)}`}>
                      {selectedClient.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Session History</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                    <p className="text-sm text-gray-900">{selectedClient.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Since</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedClient.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Session</p>
                    <p className="text-sm text-gray-900">
                      {selectedClient.lastSession ? new Date(selectedClient.lastSession).toLocaleDateString() : 'No sessions yet'}
                    </p>
                  </div>
                  {selectedClient.nextSession && (
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium text-gray-500">Next Session</p>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(selectedClient.nextSession).toLocaleDateString()} at{' '}
                        {new Date(selectedClient.nextSession).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Areas of Focus */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Areas of Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.concerns.map((concern, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleSendMessage(selectedClient);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">
                Send Message to {selectedClient.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMessageModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Message subject..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {messageContent.length}/1000 characters
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1"
                  disabled={sendingMessage}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessageSubmit}
                  disabled={sendingMessage || !messageSubject.trim() || !messageContent.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CoachPageWrapper>
  );
}