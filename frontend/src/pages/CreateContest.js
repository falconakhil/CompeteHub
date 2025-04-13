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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import authService from '../services/authService';
import contestService, { createContest } from '../services/contestService';

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

// Add Debug utility function for tracking values throughout the code
const debugValue = (label, value) => {
  console.log(`DEBUG ${label}:`, value, 'Type:', typeof value, 'Is Integer:', Number.isInteger(value));
  return value;
};

const CreateContest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [contestId, setContestId] = useState(null);
  const [contestDetails, setContestDetails] = useState({
    name: '',
    description: '',
    starting_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    genre_names: []
  });
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [availableProblems, setAvailableProblems] = useState([]);
  const [genres] = useState(['Algorithms', 'Data Structures', 'Mathematics', 'Dynamic Programming']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Add a separate state for duration to ensure explicit control
  const [durationMinutes, setDurationMinutes] = useState('');

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
            console.error('Token refresh failed:', refreshError);
            setIsAuthenticated(false);
            localStorage.removeItem('access_token'); // Clear invalid token
            localStorage.removeItem('refresh_token'); // Clear refresh token
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
    
    // Validate token when component loads
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          return;
        }
        
        // Try a test request with the token
        try {
          await axios.get('http://localhost:8000/auth/profile/', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (error) {
          if (error.response && error.response.status === 401) {
            console.log('Token invalid on load, attempting refresh...');
            try {
              await authService.refreshToken();
              console.log('Token refreshed successfully on component load');
            } catch (refreshError) {
              console.error('Failed to refresh token on component load:', refreshError);
              // Clear invalid tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error('Error validating token on load:', error);
      }
    };
    
    validateTokenOnLoad();
    
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
      const response = await axios.get('http://localhost:8000/problem/list/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setAvailableProblems(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setErrorMessage('Failed to fetch available problems');
    }
  };

  const handleSaveContestDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      debugValue('Starting contest creation with duration', durationMinutes);
      
      // Validate required fields
      if (!contestDetails.name || !contestDetails.description || !contestDetails.starting_time) {
        setErrorMessage('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Check if starting time is in the future
      if (new Date(contestDetails.starting_time) <= new Date()) {
        setErrorMessage('The contest starting time must be in the future');
        setLoading(false);
        return;
      }

      // Check authentication first
      if (!localStorage.getItem('access_token')) {
        setErrorMessage('You are not logged in. Please log in first.');
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      // Validate duration is a positive integer
      if (!durationMinutes || isNaN(parseInt(durationMinutes, 10)) || parseInt(durationMinutes, 10) <= 0) {
        setErrorMessage('Duration must be a positive number');
        setLoading(false);
        return;
      }
      
      // Create request data with proper types
      const requestData = {
        name: contestDetails.name,
        description: contestDetails.description,
        starting_time: contestDetails.starting_time.toISOString(),
        duration: parseInt(durationMinutes, 10) * 60, // Convert minutes to seconds
        genre_names: Array.isArray(contestDetails.genre_names) ? 
          contestDetails.genre_names.map(name => name.toLowerCase()) : []
      };
      
      debugValue('Request data for contest service', requestData);
      
      try {
        // Use the contestService to create the contest
        const createdContest = await createContest(requestData);
        debugValue('Created contest response', createdContest);
        
        // Set the contest ID for the next step
        setContestId(createdContest.id);
        
        // Move to the next step
        setActiveStep(1);
        
        // Fetch available problems
        await fetchProblems();
      } catch (apiError) {
        console.error('API error details:', apiError);
        
        // Try token refresh if unauthorized
        if (apiError.message === 'Authentication error') {
          try {
            console.log('Attempting token refresh...');
            await authService.refreshToken();
            
            // Get new token after refresh
            const newToken = localStorage.getItem('access_token');
            console.log('New token after refresh (first 10 chars):', newToken ? newToken.substring(0, 10) + '...' : 'No token found');
            
            // Retry with new token
            console.log('Retrying request with new token...');
            
            // Use the contestService again after token refresh
            const retryContest = await createContest(requestData);
            debugValue('Retry created contest response', retryContest);
            
            // Set the contest ID for the next step
            setContestId(retryContest.id);
            
            // Move to the next step
            setActiveStep(1);
            
            // Fetch available problems
            await fetchProblems();
          } catch (refreshError) {
            console.error('Token refresh failed during contest creation:', refreshError);
            setErrorMessage('Authentication failed. Please log out and log in again.');
            setIsAuthenticated(false);
          }
        } else {
          throw apiError; // Pass error to outer catch block
        }
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      
      // Format error message
      let errorMsg = 'Failed to create contest';
      
      if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
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
              label="Duration (Minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  setDurationMinutes(value);
                } else if (e.target.value === '') {
                  setDurationMinutes('');
                }
              }}
              InputProps={{
                inputProps: { min: 1 }
              }}
              required
              fullWidth
              helperText="Enter the duration in minutes"
            />
            <FormControl fullWidth sx={{ zIndex: 1000, mb: 2 }}>
              <InputLabel id="genre-label">Genres</InputLabel>
              <Select
                labelId="genre-label"
                multiple
                value={contestDetails.genre_names}
                onChange={(e) => {
                  setContestDetails({ ...contestDetails, genre_names: e.target.value });
                }}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 48 * 4.5,
                      width: 250,
                      zIndex: 1500
                    },
                  },
                  autoClose: true
                }}
                label="Genres"
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
              disabled={loading || !contestDetails.name || !contestDetails.description || 
                !contestDetails.starting_time || !durationMinutes || parseInt(durationMinutes, 10) <= 0}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleLogout}
                size="small"
              >
                Logout
              </Button>
            </Box>
            
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