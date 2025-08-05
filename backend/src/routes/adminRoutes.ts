import { Router } from 'express';

const router = Router();

// Mock data for coaches
const coaches = [
  {
    id: '1',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@actcoaching.com',
    specialties: ['Anxiety', 'Depression'],
    status: 'Active',
    rating: 4.9,
    totalSessions: 45
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    email: 'james.wilson@actcoaching.com',
    specialties: ['PTSD', 'Addiction'],
    status: 'Active',
    rating: 4.8,
    totalSessions: 38
  },
  {
    id: '3',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@actcoaching.com',
    specialties: ['Relationships', 'Stress'],
    status: 'Active',
    rating: 4.7,
    totalSessions: 52
  }
];

// Simple HTML template for admin interface
const adminHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACT Coaching For Life - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center space-x-3">
                        <img 
                            src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png" 
                            alt="ACT Coaching For Life Logo" 
                            class="h-10 w-auto"
                        />
                        <h1 class="text-xl font-semibold text-gray-900">ACT Coaching For Life - Admin</h1>
                    </div>
                    <div class="hidden sm:flex items-center space-x-4">
                        <span class="text-sm text-gray-500">Backend Admin Dashboard</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-blue-50 rounded-lg p-6">
                            <div class="text-sm font-medium text-gray-600">Total Coaches</div>
                            <div class="text-2xl font-bold text-gray-900">${coaches.length}</div>
                        </div>
                        <div class="bg-green-50 rounded-lg p-6">
                            <div class="text-sm font-medium text-gray-600">Active Coaches</div>
                            <div class="text-2xl font-bold text-gray-900">${coaches.filter(c => c.status === 'Active').length}</div>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-6">
                            <div class="text-sm font-medium text-gray-600">Average Rating</div>
                            <div class="text-2xl font-bold text-gray-900">${(coaches.reduce((sum, c) => sum + c.rating, 0) / coaches.length).toFixed(1)}</div>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4">All Coaches</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialties</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${coaches.map(coach => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">${coach.name}</div>
                                            <div class="text-sm text-gray-500">${coach.email}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">${coach.specialties.join(', ')}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${coach.rating}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${coach.totalSessions}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                ${coach.status}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

// Routes
router.get('/', (req, res) => {
  res.send(adminHTML);
});

router.get('/coaches', (req, res) => {
  res.json(coaches);
});

router.get('/stats', (req, res) => {
  res.json({
    totalCoaches: coaches.length,
    activeCoaches: coaches.filter(c => c.status === 'Active').length,
    totalSessions: coaches.reduce((sum, c) => sum + c.totalSessions, 0),
    averageRating: coaches.reduce((sum, c) => sum + c.rating, 0) / coaches.length
  });
});

export default router;