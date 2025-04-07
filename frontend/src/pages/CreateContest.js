import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import authService from '../services/authService';

const steps = ['Contest Details', 'Add Problems'];

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(username, password);
      onLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
      setError(error.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Please Login First
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>
    </Box>
  );
};

const CreateContest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [contestId, setContestId] = useState(null);
  const [contestDetails, setContestDetails] = useState({
    name: '',
    description: '',
    starting_time: new Date(),
    duration: 60,
    genre_names: []
  });
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [availableProblems, setAvailableProblems] = useState([]);
  const [genres] = useState(['Algorithms', 'Data Structures', 'Mathematics', 'Dynamic Programming']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Add useEffect to log when contestId changes
  useEffect(() => {
    console.log('contestId changed:', contestId);
  }, [contestId]);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      
      // Verify token by making a test call
      try {
        await axios.get('http://localhost:8000/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setIsAuthenticated(true);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
          
          // Try to refresh token
          try {
            await authService.refreshToken();
            setIsAuthenticated(true);
          } catch (refreshError) {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
    
    if (location.state) {
      // Handle refreshing problems
      if (location.state.refreshProblems && isAuthenticated) {
        fetchProblems();
      }
      
      // Handle returning to step 1 (Add Problems)
      if (location.state.returnToStep === 1 && location.state.contestId) {
        setContestId(location.state.contestId);
        setActiveStep(1);
        fetchProblems();
      }
    }
  }, [location.state, isAuthenticated]);

  const handleLoginSuccess = () => {
    checkAuthentication();
  };

  const handleLogout = async () => {
    try {
      authService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchProblems = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      console.log('Fetching problems...');
      
      const response = await axios.get('http://localhost:8000/problem/list/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Problems fetched:', response.data);
      console.log('Number of problems:', response.data.results ? response.data.results.length : 0);
      
      setAvailableProblems(response.data.results || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  };

  const handleSaveContestDetails = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Try to refresh token first
      try {
        await authService.refreshToken();
        // Remove token refresh log
      } catch (refreshError) {
        console.warn("Could not refresh token");
      }

      // Format duration as minutes (integer)
      const formattedData = {
        name: contestDetails.name,
        description: contestDetails.description,
        starting_time: contestDetails.starting_time.toISOString(),
        duration: parseInt(contestDetails.duration),
        genre_names: contestDetails.genre_names
      };

      // Remove data logging
      
      const token = localStorage.getItem('access_token');
      // Remove token logging
      
      const response = await axios.post(
        'http://localhost:8000/contest/create/', 
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Log full response
      console.log('Contest creation response:', response);
      console.log('Response data:', response.data);

      if (response.status === 201) {
        // Success
        console.log('Contest created with ID:', response.data.id);
        setContestId(response.data.id);
        setActiveStep(1);
        fetchProblems();
      }
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // Remove console logs
        if (error.response.status === 401) {
          setErrorMessage('Authentication error. Please refresh token or log out and log in again.');
        } else {
          setErrorMessage(`Error: ${error.response.data.detail || 'Failed to create contest'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        // Remove console log
        setErrorMessage('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setErrorMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = async (problemId) => {
    if (!contestId) {
      setErrorMessage('Please save contest details first');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Ensure problemId is a number
      const numericProblemId = parseInt(problemId, 10);
      
      const requestData = { problem_ids: [numericProblemId] };
      console.log('Sending data:', requestData);
      
      // Log request details
      const url = `http://localhost:8000/contest/problems/add/${contestId}/`;
      console.log('Making request to:', url);
      console.log('Contest ID:', contestId);
      console.log('Problem ID:', numericProblemId);
      
      const response = await axios.post(
        url,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        // Update selected problems
        const problem = availableProblems.find(p => p.id === numericProblemId);
        if (problem) {
          setSelectedProblems([...selectedProblems, problem]);
          setAvailableProblems(availableProblems.filter(p => p.id !== numericProblemId));
        }
      }
    } catch (error) {
      console.error('Error adding problem:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setErrorMessage(`Error adding problem: ${error.response.data.detail || error.message}`);
      } else {
        setErrorMessage(`Error adding problem: ${error.message}`);
      }
    }
  };

  const handleRemoveProblem = async (problemId) => {
    if (!contestId) {
      setErrorMessage('Please save contest details first');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Ensure problemId is a number
      const numericProblemId = parseInt(problemId, 10);
      
      // Log request details
      const url = `http://localhost:8000/contest/problems/remove/${contestId}/${numericProblemId}/`;
      console.log('Making request to:', url);
      console.log('Contest ID:', contestId);
      console.log('Problem ID:', numericProblemId);
      
      const response = await axios.delete(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        // Update selected problems
        const problem = selectedProblems.find(p => p.id === numericProblemId);
        if (problem) {
          setAvailableProblems([...availableProblems, problem]);
          setSelectedProblems(selectedProblems.filter(p => p.id !== numericProblemId));
        }
      }
    } catch (error) {
      console.error('Error removing problem:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setErrorMessage(`Error removing problem: ${error.response.data.detail || error.message}`);
      } else {
        setErrorMessage(`Error removing problem: ${error.message}`);
      }
    }
  };

  const handleCreateProblem = () => {
    // Pass the contestId as state to CreateProblem
    navigate('/create-problem', { state: { contestId } });
  };

  const handleFinish = () => {
    if (selectedProblems.length === 0) {
      alert('Please add at least one problem to the contest.');
      return;
    }
    navigate('/dashboard', { state: { refresh: true } });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Contest Name"
              value={contestDetails.name}
              onChange={(e) => setContestDetails({ ...contestDetails, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={contestDetails.description}
              onChange={(e) => setContestDetails({ ...contestDetails, description: e.target.value })}
              required
              multiline
              rows={4}
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Starting Time"
                value={contestDetails.starting_time}
                onChange={(newValue) => {
                  if (newValue) {
                    setContestDetails({ ...contestDetails, starting_time: newValue });
                  }
                }}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
            <TextField
              label="Duration (minutes)"
              type="number"
              value={contestDetails.duration}
              onChange={(e) => setContestDetails({ ...contestDetails, duration: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Genres</InputLabel>
              <Select
                multiple
                value={contestDetails.genre_names}
                onChange={(e) => setContestDetails({ ...contestDetails, genre_names: e.target.value })}
                renderValue={(selected) => selected.join(', ')}
              >
                {genres.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleSaveContestDetails}
              disabled={loading || !contestDetails.name || !contestDetails.description || !contestDetails.starting_time || !contestDetails.duration}
            >
              {loading ? 'Saving...' : 'Save and Continue'}
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Selected Problems</Typography>
              <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                <List>
                  {selectedProblems.map((problem) => (
                    <ListItem
                      key={problem.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveProblem(problem.id)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <Typography>{problem.title}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Available Problems</Typography>
              <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                <List>
                  {availableProblems.map((problem) => (
                    <ListItem
                      key={problem.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleAddProblem(problem.id)}>
                          <AddIcon />
                        </IconButton>
                      }
                    >
                      <Typography>{problem.title}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleCreateProblem}>
                Create New Problem
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFinish}
                disabled={selectedProblems.length === 0}
              >
                Finish
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Contest
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {!isAuthenticated ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CreateContest; 