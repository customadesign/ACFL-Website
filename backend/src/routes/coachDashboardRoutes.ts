import { Router } from 'express';

const router = Router();

// Mock data for coach dashboard
const coachData = {
  profile: {
    id: '1',
    name: 'Dr. Sarah Kim',
    email: 'sarah.kim@actcoaching.com',
    phone: '+1 (555) 123-4567',
    specialties: ['Anxiety', 'Depression', 'Mindfulness'],
    modalities: ['ACT', 'Mindfulness-Based Coaching', 'Values-Based Action'],
    bio: 'I\'m a compassionate ACT coach specializing in anxiety and depression management. I help clients develop psychological flexibility through mindfulness, acceptance, and values-based action.',
    experience: '8 years',
    rating: 4.9,
    totalSessions: 245,
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    certifications: ['Certified ACT Trainer', 'MBSR Teacher Certification', 'ICF Master Certified Coach (MCC)'],
    education: 'Ph.D. in Clinical Psychology, UCLA',
    languages: ['English', 'Spanish'],
    sessionRate: '$175-225/session',
    virtualAvailable: true,
    inPersonAvailable: true,
    location: ['CA', 'NY'],
    availability: {
      monday: ['9:00 AM - 12:00 PM', '2:00 PM - 6:00 PM'],
      tuesday: ['9:00 AM - 12:00 PM', '2:00 PM - 6:00 PM'],
      wednesday: ['9:00 AM - 12:00 PM'],
      thursday: ['9:00 AM - 12:00 PM', '2:00 PM - 6:00 PM'],
      friday: ['9:00 AM - 12:00 PM', '2:00 PM - 5:00 PM'],
      saturday: ['10:00 AM - 2:00 PM'],
      sunday: []
    }
  },
  appointments: [
    {
      id: '1',
      clientName: 'Sarah M.',
      clientId: 'client-1',
      clientEmail: 'sarah.m@email.com',
      clientPhone: '+1 (555) 234-5678',
      sessionType: 'Initial Consultation',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: 60,
      status: 'Confirmed',
      type: 'virtual',
      videoSDKMeetingId: 'abc-defg-hij',
      notes: 'Anxiety management focus',
      clientGoals: ['Reduce anxiety', 'Improve work-life balance'],
      sessionNumber: 1,
      totalSessions: 8,
      requestDate: '2024-01-10',
      coachNotes: 'Client seems motivated and ready for ACT work'
    },
    {
      id: '2',
      clientName: 'John D.',
      clientId: 'client-2',
      clientEmail: 'john.d@email.com',
      clientPhone: '+1 (555) 345-6789',
      sessionType: 'Follow-up Session',
      date: '2024-01-15',
      time: '2:00 PM',
      duration: 50,
      status: 'Confirmed',
      type: 'virtual',
      videoSDKMeetingId: 'xyz-uvw-rst',
      notes: 'Mindfulness practices progress check',
      clientGoals: ['Develop mindfulness habits', 'Values clarification'],
      sessionNumber: 4,
      totalSessions: 12,
      requestDate: '2024-01-08',
      coachNotes: 'Making excellent progress with mindfulness practices'
    },
    {
      id: '3',
      clientName: 'Emily R.',
      clientId: 'client-3',
      clientEmail: 'emily.r@email.com',
      clientPhone: '+1 (555) 456-7890',
      sessionType: 'ACT Values Workshop',
      date: '2024-01-16',
      time: '11:30 AM',
      duration: 90,
      status: 'Confirmed',
      type: 'in-person',
      location: '123 Wellness Center, Los Angeles, CA',
      notes: 'Values identification and commitment',
      clientGoals: ['Clarify personal values', 'Create action plan'],
      sessionNumber: 2,
      totalSessions: 6,
      requestDate: '2024-01-12',
      coachNotes: 'Highly engaged client, ready for deeper values work'
    },
    {
      id: '4',
      clientName: 'Michael T.',
      clientId: 'client-4',
      clientEmail: 'michael.t@email.com',
      clientPhone: '+1 (555) 567-8901',
      sessionType: 'Progress Review',
      date: '2024-01-17',
      time: '3:00 PM',
      duration: 50,
      status: 'Pending',
      type: 'virtual',
      videoSDKMeetingId: 'def-ghi-jkl',
      notes: '6-week progress assessment',
      clientGoals: ['Evaluate progress', 'Adjust treatment plan'],
      sessionNumber: 6,
      totalSessions: 10,
      requestDate: '2024-01-14',
      coachNotes: 'Ready for progress evaluation and treatment adjustment'
    },
    {
      id: '5',
      clientName: 'Alex P.',
      clientId: 'client-5',
      clientEmail: 'alex.p@email.com',
      clientPhone: '+1 (555) 678-9012',
      sessionType: 'New Client Consultation',
      date: '2024-01-18',
      time: '9:00 AM',
      duration: 60,
      status: 'Pending',
      type: 'virtual',
      videoSDKMeetingId: 'mno-pqr-stu',
      notes: 'Depression and life transition support',
      clientGoals: ['Manage depression symptoms', 'Navigate career change'],
      sessionNumber: 1,
      totalSessions: 10,
      requestDate: '2024-01-15',
      coachNotes: 'New client, needs initial assessment'
    },
    {
      id: '6',
      clientName: 'Lisa K.',
      clientId: 'client-6',
      clientEmail: 'lisa.k@email.com',
      clientPhone: '+1 (555) 789-0123',
      sessionType: 'Mindfulness Session',
      date: '2024-01-19',
      time: '2:30 PM',
      duration: 45,
      status: 'Pending',
      type: 'virtual',
      videoSDKMeetingId: 'vwx-yz1-234',
      notes: 'Stress management and mindfulness techniques',
      clientGoals: ['Reduce work stress', 'Develop daily mindfulness practice'],
      sessionNumber: 3,
      totalSessions: 8,
      requestDate: '2024-01-16',
      coachNotes: 'Client struggling with work-life balance'
    }
  ],
  clients: [
    {
      id: 'client-1',
      name: 'Sarah M.',
      email: 'sarah.m@email.com',
      phone: '+1 (555) 234-5678',
      joinDate: '2024-01-01',
      totalSessions: 1,
      lastSession: '2024-01-15',
      status: 'Active',
      primaryGoals: ['Reduce anxiety', 'Improve work-life balance'],
      progressNotes: 'Making good progress with breathing exercises. Shows commitment to practice.',
      nextAppointment: '2024-01-22'
    },
    {
      id: 'client-2',
      name: 'John D.',
      email: 'john.d@email.com',
      phone: '+1 (555) 345-6789',
      joinDate: '2023-12-01',
      totalSessions: 4,
      lastSession: '2024-01-08',
      status: 'Active',
      primaryGoals: ['Develop mindfulness habits', 'Values clarification'],
      progressNotes: 'Excellent engagement with mindfulness practices. Ready for deeper values work.',
      nextAppointment: '2024-01-15'
    },
    {
      id: 'client-3',
      name: 'Emily R.',
      email: 'emily.r@email.com',
      phone: '+1 (555) 456-7890',
      joinDate: '2024-01-05',
      totalSessions: 2,
      lastSession: '2024-01-12',
      status: 'Active',
      primaryGoals: ['Clarify personal values', 'Create action plan'],
      progressNotes: 'Highly motivated client. Quick to grasp ACT concepts.',
      nextAppointment: '2024-01-16'
    }
  ],
  stats: {
    totalClients: 15,
    activeClients: 12,
    completedSessions: 245,
    upcomingAppointments: 8,
    averageRating: 4.9,
    monthlyRevenue: 8750,
    cancelledSessions: 3,
    noShowRate: 2.1
  }
};

// Coach dashboard HTML template
const coachDashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coach Dashboard - ACT Coaching For Life</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'act-blue': '#2563eb',
                        'act-green': '#059669',
                        'act-purple': '#7c3aed'
                    }
                }
            }
        }
    </script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-hover:hover {
            transform: translateY(-2px);
            transition: all 0.3s ease;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center space-x-3">
                        <img 
                            src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                            alt="ACT Coaching For Life Logo" 
                            class="h-10 w-auto"
                        />
                        <div>
                            <h1 class="text-xl font-semibold text-gray-900">Coach Dashboard</h1>
                            <p class="text-sm text-gray-600">Welcome back, ${coachData.profile.name}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-right">
                            <p class="text-sm font-medium text-gray-900">${coachData.profile.name}</p>
                            <p class="text-xs text-gray-600">${coachData.profile.email}</p>
                        </div>
                        <img 
                            src="${coachData.profile.profileImage}" 
                            alt="Profile" 
                            class="h-10 w-10 rounded-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>

        <!-- Navigation Tabs -->
        <div class="bg-white border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex space-x-8">
                    <button 
                        onclick="showTab('dashboard')" 
                        id="dashboard-tab"
                        class="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap"
                    >
                        Dashboard
                    </button>
                    <button 
                        onclick="showTab('appointments')" 
                        id="appointments-tab"
                        class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap"
                    >
                        My Appointments
                    </button>
                    <button 
                        onclick="showTab('clients')" 
                        id="clients-tab"
                        class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap"
                    >
                        My Clients
                    </button>
                    <button 
                        onclick="showTab('profile')" 
                        id="profile-tab"
                        class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap"
                    >
                        Profile Settings
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Dashboard Tab -->
            <div id="dashboard-content" class="tab-content">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6 card-hover">
                        <div class="flex items-center">
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Active Clients</p>
                                <p class="text-2xl font-bold text-gray-900">${coachData.stats.activeClients}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 card-hover">
                        <div class="flex items-center">
                            <div class="p-3 bg-green-100 rounded-lg">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                                <p class="text-2xl font-bold text-gray-900">${coachData.stats.upcomingAppointments}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 card-hover">
                        <div class="flex items-center">
                            <div class="p-3 bg-yellow-100 rounded-lg">
                                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Average Rating</p>
                                <p class="text-2xl font-bold text-gray-900">${coachData.stats.averageRating}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 card-hover">
                        <div class="flex items-center">
                            <div class="p-3 bg-purple-100 rounded-lg">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                <p class="text-2xl font-bold text-gray-900">$${coachData.stats.monthlyRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Today's Schedule -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
                        <div class="space-y-4">
                            ${coachData.appointments.filter(apt => apt.date === '2024-01-15').map(appointment => `
                                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div class="flex-shrink-0">
                                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">${appointment.time} - ${appointment.clientName}</p>
                                        <p class="text-sm text-gray-600">${appointment.sessionType} (${appointment.duration} min)</p>
                                        <p class="text-xs text-gray-500">${appointment.type === 'virtual' ? '📹 Virtual' : '📍 In-Person'}</p>
                                    </div>
                                    ${appointment.type === 'virtual' ? `
                                        <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                                            Join Session
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div class="space-y-4">
                            <div class="flex items-start space-x-3">
                                <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div>
                                    <p class="text-sm text-gray-900">Completed session with John D.</p>
                                    <p class="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-3">
                                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div>
                                    <p class="text-sm text-gray-900">New client inquiry from Alex P.</p>
                                    <p class="text-xs text-gray-500">4 hours ago</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-3">
                                <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                <div>
                                    <p class="text-sm text-gray-900">Sarah M. rescheduled appointment</p>
                                    <p class="text-xs text-gray-500">1 day ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Appointments Tab -->
            <div id="appointments-content" class="tab-content hidden">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">My Appointments</h2>
                    <div class="flex space-x-2">
                        <button onclick="filterAppointments('all')" id="filter-all" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                            All
                        </button>
                        <button onclick="filterAppointments('pending')" id="filter-pending" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                            Pending
                        </button>
                        <button onclick="filterAppointments('confirmed')" id="filter-confirmed" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                            Confirmed
                        </button>
                    </div>
                </div>
                
                <div class="space-y-4">
                    ${coachData.appointments.map(appointment => `
                        <div class="bg-white rounded-lg shadow p-6 appointment-card" data-status="${appointment.status}">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">${appointment.clientName}</h3>
                                    <p class="text-sm text-gray-600">${appointment.clientEmail} • ${appointment.clientPhone}</p>
                                    <p class="text-sm text-gray-500">Session ${appointment.sessionNumber}/${appointment.totalSessions}</p>
                                </div>
                                <div class="text-right">
                                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                                        appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${appointment.status}
                                    </span>
                                    <p class="text-sm text-gray-500 mt-1">Requested: ${appointment.requestDate}</p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Session Details</p>
                                    <p class="text-sm text-gray-900">${appointment.sessionType}</p>
                                    <p class="text-sm text-gray-600">${appointment.duration} minutes • ${appointment.type === 'virtual' ? '📹 Virtual' : '📍 In-Person'}</p>
                                    ${appointment.type === 'in-person' ? `<p class="text-sm text-gray-600">📍 ${appointment.location}</p>` : ''}
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Date & Time</p>
                                    <p class="text-sm text-gray-900">${appointment.date} at ${appointment.time}</p>
                                    ${appointment.videoSDKMeetingId ? `<p class="text-sm text-gray-600">Meeting ID: ${appointment.videoSDKMeetingId}</p>` : ''}
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-sm font-medium text-gray-700 mb-1">Client Goals</p>
                                <ul class="text-sm text-gray-600">
                                    ${appointment.clientGoals.map(goal => `<li>• ${goal}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-sm font-medium text-gray-700 mb-1">Notes</p>
                                <p class="text-sm text-gray-600">${appointment.notes}</p>
                            </div>
                            
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Coach Notes</label>
                                <textarea 
                                    id="coach-notes-${appointment.id}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows="2"
                                    placeholder="Add your notes here..."
                                >${appointment.coachNotes || ''}</textarea>
                            </div>
                            
                            <div class="flex flex-wrap gap-2">
                                ${appointment.status === 'Pending' ? `
                                    <button onclick="acceptAppointment('${appointment.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        ✓ Accept
                                    </button>
                                    <button onclick="rejectAppointment('${appointment.id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        ✗ Reject
                                    </button>
                                ` : ''}
                                
                                ${appointment.status === 'Confirmed' ? `
                                    ${appointment.type === 'virtual' ? `
                                        <button onclick="joinSession('${appointment.videoSDKMeetingId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                            🎥 Join Session
                                        </button>
                                    ` : ''}
                                    <button onclick="rescheduleAppointment('${appointment.id}')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        📅 Reschedule
                                    </button>
                                ` : ''}
                                
                                <button onclick="cancelAppointment('${appointment.id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    ❌ Cancel
                                </button>
                                
                                <button onclick="saveCoachNotes('${appointment.id}')" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    💾 Save Notes
                                </button>
                                
                                <button onclick="viewClientDetails('${appointment.clientId}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    👤 View Client
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Clients Tab -->
            <div id="clients-content" class="tab-content hidden">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">My Clients</h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${coachData.clients.map(client => `
                        <div class="bg-white rounded-lg shadow p-6 card-hover">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">${client.name}</h3>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                                    client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }">
                                    ${client.status}
                                </span>
                            </div>
                            
                            <div class="space-y-3">
                                <div>
                                    <p class="text-sm text-gray-600">Total Sessions</p>
                                    <p class="text-lg font-semibold text-gray-900">${client.totalSessions}</p>
                                </div>
                                
                                <div>
                                    <p class="text-sm text-gray-600">Last Session</p>
                                    <p class="text-sm text-gray-900">${client.lastSession}</p>
                                </div>
                                
                                <div>
                                    <p class="text-sm text-gray-600">Primary Goals</p>
                                    <ul class="text-sm text-gray-900">
                                        ${client.primaryGoals.map(goal => `<li>• ${goal}</li>`).join('')}
                                    </ul>
                                </div>
                                
                                <div>
                                    <p class="text-sm text-gray-600">Progress Notes</p>
                                    <p class="text-sm text-gray-900">${client.progressNotes}</p>
                                </div>
                                
                                <div class="pt-4 border-t">
                                    <div class="flex space-x-2">
                                        <button class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                                            View Details
                                        </button>
                                        <button class="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200">
                                            Schedule
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Profile Tab -->
            <div id="profile-content" class="tab-content hidden">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" value="${coachData.profile.name}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value="${coachData.profile.email}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="tel" value="${coachData.profile.phone}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                    <input type="text" value="${coachData.profile.experience}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md">${coachData.profile.bio}</textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                                    <input type="text" value="${coachData.profile.specialties.join(', ')}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Session Rate</label>
                                    <input type="text" value="${coachData.profile.sessionRate}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                            <div class="text-center">
                                <img src="${coachData.profile.profileImage}" alt="Profile" class="w-32 h-32 rounded-full mx-auto object-cover mb-4">
                                <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Change Picture
                                </button>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600">Total Sessions</span>
                                    <span class="text-sm font-medium">${coachData.profile.totalSessions}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600">Average Rating</span>
                                    <span class="text-sm font-medium">${coachData.profile.rating} ⭐</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600">Years Experience</span>
                                    <span class="text-sm font-medium">${coachData.profile.experience}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.add('hidden'));
            
            // Remove active state from all tabs
            const tabs = document.querySelectorAll('[id$="-tab"]');
            tabs.forEach(tab => {
                tab.classList.remove('border-blue-500', 'text-blue-600');
                tab.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Show selected tab content
            document.getElementById(tabName + '-content').classList.remove('hidden');
            
            // Activate selected tab
            const activeTab = document.getElementById(tabName + '-tab');
            activeTab.classList.remove('border-transparent', 'text-gray-500');
            activeTab.classList.add('border-blue-500', 'text-blue-600');
        }

        // Appointment management functions
        function filterAppointments(status) {
            const cards = document.querySelectorAll('.appointment-card');
            const buttons = document.querySelectorAll('[id^="filter-"]');
            
            // Update button states
            buttons.forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            document.getElementById('filter-' + status).classList.remove('bg-gray-200', 'text-gray-700');
            document.getElementById('filter-' + status).classList.add('bg-blue-600', 'text-white');
            
            // Filter cards
            cards.forEach(card => {
                if (status === 'all' || card.dataset.status === status) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        function acceptAppointment(appointmentId) {
            if (confirm('Accept this appointment request?')) {
                // Update appointment status in the UI
                const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (card) {
                    const statusBadge = card.querySelector('[data-status]');
                    statusBadge.textContent = 'Confirmed';
                    statusBadge.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
                    card.dataset.status = 'Confirmed';
                    
                    // Update action buttons
                    const actionButtons = card.querySelector('.flex.flex-wrap.gap-2');
                    actionButtons.innerHTML = 
                        '<button onclick="joinSession(\'' + appointmentId + '\')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">' +
                            '🎥 Join Session' +
                        '</button>' +
                        '<button onclick="rescheduleAppointment(\'' + appointmentId + '\')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium">' +
                            '📅 Reschedule' +
                        '</button>' +
                        '<button onclick="cancelAppointment(\'' + appointmentId + '\')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">' +
                            '❌ Cancel' +
                        '</button>' +
                        '<button onclick="saveCoachNotes(\'' + appointmentId + '\')" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">' +
                            '💾 Save Notes' +
                        '</button>' +
                        '<button onclick="viewClientDetails(\'' + appointmentId + '\')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">' +
                            '👤 View Client' +
                        '</button>';
                }
                
                // Send to backend (mock)
                console.log('Appointment accepted:', appointmentId);
                showNotification('Appointment accepted successfully!', 'success');
            }
        }

        function rejectAppointment(appointmentId) {
            if (confirm('Reject this appointment request?')) {
                // Remove appointment card from UI
                const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (card) {
                    card.remove();
                }
                
                // Send to backend (mock)
                console.log('Appointment rejected:', appointmentId);
                showNotification('Appointment rejected.', 'info');
            }
        }

        function cancelAppointment(appointmentId) {
            if (confirm('Cancel this appointment? This will notify the client.')) {
                // Update appointment status in the UI
                const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (card) {
                    const statusBadge = card.querySelector('[data-status]');
                    statusBadge.textContent = 'Cancelled';
                    statusBadge.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
                    card.dataset.status = 'Cancelled';
                    
                    // Disable action buttons
                    const actionButtons = card.querySelector('.flex.flex-wrap.gap-2');
                    actionButtons.innerHTML = '<span class="text-sm text-gray-500">Appointment cancelled</span>';
                }
                
                // Send to backend (mock)
                console.log('Appointment cancelled:', appointmentId);
                showNotification('Appointment cancelled successfully!', 'success');
            }
        }

        function rescheduleAppointment(appointmentId) {
            const newDate = prompt('Enter new date (YYYY-MM-DD):');
            const newTime = prompt('Enter new time (HH:MM AM/PM):');
            
            if (newDate && newTime) {
                // Update appointment in the UI
                const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (card) {
                    const dateTimeElement = card.querySelector('.text-sm.text-gray-900');
                    dateTimeElement.textContent = `${newDate} at ${newTime}`;
                }
                
                // Send to backend (mock)
                console.log('Appointment rescheduled:', appointmentId, newDate, newTime);
                showNotification('Appointment rescheduled successfully!', 'success');
            }
        }

        function joinSession(meetingId) {
            // Open VideoSDK session
            const sessionUrl = `https://app.videosdk.live/meeting/${meetingId}`;
            window.open(sessionUrl, '_blank');
            showNotification('Opening VideoSDK session...', 'info');
        }

        function saveCoachNotes(appointmentId) {
            const notesTextarea = document.getElementById(`coach-notes-${appointmentId}`);
            const notes = notesTextarea.value;
            
            // Send to backend (mock)
            console.log('Coach notes saved:', appointmentId, notes);
            showNotification('Notes saved successfully!', 'success');
        }

        function viewClientDetails(clientId) {
            // Navigate to client details page or show modal
            alert(`Viewing details for client: ${clientId}`);
            // In a real app, this would open a modal or navigate to client details
        }

        function showNotification(message, type) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
                type === 'success' ? 'bg-green-600' : 
                type === 'error' ? 'bg-red-600' : 
                'bg-blue-600'
            }`;
            notification.textContent = message;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Initialize appointment filters
        document.addEventListener('DOMContentLoaded', function() {
            // Add data-appointment-id attributes to cards
            const cards = document.querySelectorAll('.appointment-card');
            cards.forEach((card, index) => {
                card.setAttribute('data-appointment-id', index + 1);
            });
        });
    </script>
</body>
</html>
`;

// Routes
router.get('/', (req, res) => {
  res.send(coachDashboardHTML);
});

router.get('/data', (req, res) => {
  res.json(coachData);
});

router.get('/profile', (req, res) => {
  res.json(coachData.profile);
});

router.get('/appointments', (req, res) => {
  res.json(coachData.appointments);
});

router.get('/clients', (req, res) => {
  res.json(coachData.clients);
});

router.get('/stats', (req, res) => {
  res.json(coachData.stats);
});

export default router; 