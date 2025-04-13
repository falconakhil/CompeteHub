import axios from 'axios';

const API_URL = 'http://localhost:8000/contest/';

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

export const createContest = async (contestData) => {
  try {
    // Debug information for duration
    console.log('Duration (minutes):', contestData.duration);
    
    // Create a new object with all the original data
    const formattedData = { ...contestData };
    
    // Ensure duration is an integer representing minutes
    if (typeof contestData.duration !== 'undefined') {
      formattedData.duration = parseInt(String(contestData.duration), 10);
      console.log('Formatted duration (minutes):', formattedData.duration);
    }
    
    console.log('Formatted request data:', formattedData);
    
    // Custom headers to force content type
    const headers = {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    };
    
    // Use raw axios request with manual data handling
    const response = await axios({
      method: 'post',
      url: `${API_URL}create/`,
      data: formattedData,
      headers,
      transformRequest: [(data) => {
        // Final check to ensure duration is an integer (in minutes)
        if (data && data.duration) {
          data.duration = Number(data.duration);
        }
        return JSON.stringify(data);
      }]
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data.detail || 
                         (error.response.data.non_field_errors && error.response.data.non_field_errors[0]) ||
                         'Failed to create contest';
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please check if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up the request: ' + error.message);
    }
  }
};

const registerForContest = async (contestId) => {
  try {
    const response = await axios.post(`${API_URL}register/${contestId}/`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while registering for contest' };
  }
};

const unregisterFromContest = async (contestId) => {
  try {
    const response = await axios.post(`${API_URL}unregister/${contestId}/`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while unregistering from contest' };
  }
};

const getContestProblems = async (contestId) => {
  try {
    const response = await axios.get(`${API_URL}problems/list/${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw { detail: 'You must be registered for this contest to view problems.' };
    }
    throw error.response?.data || { detail: 'An error occurred while fetching contest problems' };
  }
};

const getContestProblemByOrder = async (contestId, order) => {
  try {
    const response = await axios.get(`${API_URL}${contestId}/problems/${order}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching the problem' };
  }
};

const deleteContest = async (contestId) => {
  try {
    const response = await axios.delete(`${API_URL}delete/${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while deleting contest' };
  }
};

const submitContestProblem = async (contestId, problemOrder, answer) => {
  try {
    const response = await axios.post(
      `${API_URL}${contestId}/problems/${problemOrder}/submit/`,
      { answer },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while submitting the answer' };
  }
};

const contestService = {
  getContests,
  getContestDetails,
  createContest,
  registerForContest,
  unregisterFromContest,
  getContestProblems,
  getContestProblemByOrder,
  deleteContest,
  submitContestProblem,
};

export default contestService; 