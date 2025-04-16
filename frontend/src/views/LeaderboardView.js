import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import contestService from '../services/contestService';
import authService from '../services/authService';

const LeaderboardView = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
          navigate('/login');
          return;
        }

        // Fetch leaderboard data
        const leaderboardData = await contestService.getContestLeaderboard(contestId);
        setLeaderboard(leaderboardData);

        // Try to fetch user rank, but don't fail if it doesn't exist
        try {
          const userData = await contestService.getUserRank(contestId, currentUser.username);
          setUserRank(userData);
        } catch (rankError) {
          console.log('User rank not found, showing only leaderboard');
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error.detail || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [contestId, navigate]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate(`/contests/${contestId}/problems`)}
        >
          Back to Problems
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Contest Leaderboard
        </Typography>
        {userRank && (
          <Chip
            label={`Your Rank: ${userRank.rank} | Points: ${userRank.points}`}
            color="primary"
            sx={{ mb: 2 }}
          />
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Username</TableCell>
              <TableCell align="right">Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow
                key={entry.username}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell>{entry.username}</TableCell>
                <TableCell align="right">{entry.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/contests/${contestId}/problems`)}
        >
          Back to Problems
        </Button>
      </Box>
    </Container>
  );
};

export default LeaderboardView; 