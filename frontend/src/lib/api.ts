// Utility function to get API URL based on environment
export const getApiUrl = () => {
  // First check if there's an explicit production API URL set
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('Using explicit API URL from environment:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check multiple conditions to detect production environment
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    (typeof window !== 'undefined' && (
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('192.168') &&
      window.location.protocol === 'https:'
    ));

  console.log('Production check details:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'server',
    isProduction
  });

  // Always use production URL if any production indicator is detected
  if (isProduction) {
    console.log('Using production API URL');
    return 'https://therapist-matcher-backend.onrender.com';
  }

  // Development environment
  console.log('Using development API URL');
  return 'http://localhost:3001';
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