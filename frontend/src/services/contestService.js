import axios from 'axios';

const API_URL = 'http://localhost:8000/contest/';

const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
});

export const getContestDetails = async (contestId) => {
  try {
    const response = await axios.get(`${API_URL}${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching contest details' };
  }
};

export const getActiveContests = async () => {
  try {
    const response = await axios.get(`${API_URL}list/active/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching active contests' };
  }
};

export const getUpcomingContests = async () => {
  try {
    const response = await axios.get(`${API_URL}list/future/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching upcoming contests' };
  }
};

export const registerForContest = async (contestId) => {
  try {
    const response = await axios.post(`${API_URL}register/${contestId}/`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while registering for the contest' };
  }
};

export const unregisterFromContest = async (contestId) => {
  try {
    const response = await axios.post(`${API_URL}unregister/${contestId}/`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while unregistering from the contest' };
  }
};

export const getContestProblems = async (contestId) => {
  try {
    const response = await axios.get(`${API_URL}problems/list/${contestId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching contest problems' };
  }
};

export const getContestProblemByOrder = async (contestId, order) => {
  try {
    const response = await axios.get(`${API_URL}${contestId}/problems/${order}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching the problem' };
  }
};

export const submitContestProblem = async (contestId, order, answer) => {
  try {
    const response = await axios.post(
      `${API_URL}${contestId}/problems/${order}/submit/`,
      { answer },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('You must be registered for this contest to submit answers.');
    }
    throw error.response?.data || new Error('An error occurred while submitting the answer');
  }
};

export const createContest = async (contestData) => {
  try {
    const response = await axios.post(
      `${API_URL}create/`,
      contestData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('An error occurred while creating the contest');
  }
};

export const getContestLeaderboard = async (contestId) => {
  try {
    const response = await axios.get(`${API_URL}leaderboard/${contestId}/top/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching leaderboard' };
  }
};

export const getUserRank = async (contestId, username) => {
  try {
    const response = await axios.get(`${API_URL}leaderboard/${contestId}/user/${username}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred while fetching user rank' };
  }
};

export const getProblemSubmissions = async (contestId, order) => {
  try {
    const response = await axios.get(
      `${API_URL}${contestId}/problems/${order}/submissions/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('An error occurred while fetching problem submissions');
  }
};

const contestService = {
  getContestDetails,
  getActiveContests,
  getUpcomingContests,
  registerForContest,
  unregisterFromContest,
  getContestProblems,
  getContestProblemByOrder,
  submitContestProblem,
  createContest,
  getContestLeaderboard,
  getUserRank,
  getProblemSubmissions,
};

export default contestService; 