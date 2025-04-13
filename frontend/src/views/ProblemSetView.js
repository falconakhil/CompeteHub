import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';

const ProblemSetView = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProblems();
  }, [page, searchQuery]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/problem/list/?page=${page}&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setProblems(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 10));
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError(error.response?.data?.detail || 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      setPage(1);
      setSearchQuery(event.target.value);
    }
  };

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
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Problem Set
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search problems..."
              size="small"
              onKeyPress={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {problems.map((problem) => (
            <Grid item xs={12} md={6} key={problem.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {problem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {problem.question.length > 200 
                      ? `${problem.question.substring(0, 200)}...` 
                      : problem.question}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {problem.genres?.map((genre) => (
                      <Chip 
                        key={genre.id} 
                        label={genre.name} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => navigate(`/problems/${problem.id}`)}
                  >
                    View Problem
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {problems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No problems found
            </Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProblemSetView; 