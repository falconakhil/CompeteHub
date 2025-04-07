import axios from 'axios';

const API_URL = 'http://localhost:8000/contests/';

const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
});

const getContests = async (type, page = 1) => {
  try {
    const response = await axios.get(`${API_URL}list/${type}/?page=${page}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching contests' };
  }
};

const getContestDetails = async (contestId) => {
  try {
    const response = await axios.get(`${API_URL}${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching contest details' };
  }
};

const createContest = async (contestData) => {
  try {
    const response = await axios.post(API_URL, contestData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while creating contest' };
  }
};

const registerForContest = async (contestId) => {
  try {
    const response = await axios.post(`${API_URL}${contestId}/register/`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while registering for contest' };
  }
};

const deleteContest = async (contestId) => {
  try {
    const response = await axios.delete(`${API_URL}${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while deleting contest' };
  }
};

const contestService = {
  getContests,
  getContestDetails,
  createContest,
  registerForContest,
  deleteContest,
};

export default contestService; 