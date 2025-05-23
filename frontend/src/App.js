import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { createTheme, ThemeProvider, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import authService from './services/authService';
import CreateContest from './pages/CreateContest';
import CreateProblem from './pages/CreateProblem';
import ContestListView from './views/ContestListView';
import ContestDetailsView from './views/ContestDetailsView';
import ContestProblemView from './views/ContestProblemView';
import ContestProblemsView from './views/ContestProblemsView';
import ProblemSetView from './views/ProblemSetView';
import ProblemDetailView from './views/ProblemDetailView';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5', // Deep blue
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#7c4dff', // Deep violet
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    background: {
      default: '#0a1929', // Very dark blue-grey
      paper: '#132f4c', // Slightly lighter dark blue
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #3f51b5 30%, #7c4dff 90%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*::selection': {
          backgroundColor: '#3f51b5',
          color: '#ffffff',
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          {/* Add padding to account for fixed navbar */}
          <Box sx={{ pt: 8 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* These routes will be implemented later */}
              <Route path="/create-contest" element={<CreateContest />} />
              <Route path="/create-problem" element={<CreateProblem />} />
              <Route path="/problem-set" element={<ProblemSetView />} />
              <Route path="/problems/:problemId" element={<ProblemDetailView />} />
              <Route path="/contests" element={<ContestListView />} />
              <Route path="/contests/:contestId" element={<ContestDetailsView />} />
              <Route path="/contests/:contestId/problems" element={<ContestProblemsView />} />
              <Route path="/contests/:contestId/problems/:problemOrder" element={<ContestProblemView />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 