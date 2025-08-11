// Utility function to get API URL based on environment
export const getApiUrl = () => {
  // In production, directly call the backend service
  if (process.env.NODE_ENV === 'production') {
    return 'https://therapist-matcher-backend.onrender.com';
  }
  // Otherwise use environment variable or localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const API_BASE_URL = getApiUrl();

export async function getAllCoaches() {
  try {
    console.log('Making API call to:', `${API_BASE_URL}/api/client/coaches`);
    
    const response = await fetch(`${API_BASE_URL}/api/client/coaches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch coaches: ${response.status}`);
    }

    const result = await response.json();
    console.log('API result:', result);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error('Failed to get coaches');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function findMatches(preferences: any) {
  try {
    console.log('Making API call to:', `${API_BASE_URL}/api/client/search-coaches`);
    console.log('With preferences:', preferences);
    
    const response = await fetch(`${API_BASE_URL}/api/client/search-coaches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ preferences })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.status}`);
    }

    const result = await response.json();
    console.log('API result:', result);
    
    if (result.success) {
      return { matches: result.data };
    } else {
      throw new Error('Search failed');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function getClientActivity() {
  try {
    console.log('Making API call to:', `${API_BASE_URL}/api/client/activity`);
    
    const response = await fetch(`${API_BASE_URL}/api/client/activity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch client activity: ${response.status}`);
    }

    const result = await response.json();
    console.log('API result:', result);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error('Failed to get client activity');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function getSavedCoaches() {
  try {
    console.log('Making API call to:', `${API_BASE_URL}/api/client/saved-coaches`);
    
    const response = await fetch(`${API_BASE_URL}/api/client/saved-coaches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch saved coaches: ${response.status}`);
    }

    const result = await response.json();
    console.log('API result:', result);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error('Failed to get saved coaches');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
} 