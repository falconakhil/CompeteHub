import axios from 'axios';

const API_URL = 'http://localhost:8000/auth/';

const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL + 'login/', {
      username,
      password,
    });
    
    if (response.data.access) {
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred during login' };
  }
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const getUserProfile = async () => {
  try {
    const response = await axios.get(API_URL + 'profile/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while getting user profile' };
  }
};

const signUp = async (username, email, password) => {
  try {
    const response = await axios.post(API_URL + 'signup/', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred during signup' };
  }
};

const deleteAccount = async (password) => {
  try {
    const response = await axios.delete(API_URL + 'delete/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      data: {
        password
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while deleting account' };
  }
};

const refreshToken = async () => {
  try {
    const response = await axios.post(API_URL + 'login/refresh/', {
      refresh: localStorage.getItem('refresh_token')
    });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while refreshing token' };
  }
};

const authService = {
  login,
  logout,
  getCurrentUser,
  getUserProfile,
  signUp,
  deleteAccount,
  refreshToken,
};

export default authService; 