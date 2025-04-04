import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const CreateProblem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contestId = location.state?.contestId;
  const [problemData, setProblemData] = useState({
    title: '',
    question: '',
    answer: '',
    type: 'descriptive',
    options: [''],
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  const handleOptionChange = (index, value) => {
    const newOptions = [...problemData.options];
    newOptions[index] = value;
    setProblemData({ ...problemData, options: newOptions });
  };

  const addOption = () => {
    setProblemData({
      ...problemData,
      options: [...problemData.options, ''],
    });
  };

  const removeOption = (index) => {
    const newOptions = problemData.options.filter((_, i) => i !== index);
    setProblemData({ ...problemData, options: newOptions });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      setProblemData({
        ...problemData,
        tags: [...problemData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setProblemData({
      ...problemData,
      tags: problemData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        title: problemData.title,
        question: problemData.type === 'mcq' 
          ? `${problemData.question}\nOptions:\n${problemData.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}`
          : problemData.question,
        answer: problemData.answer,
        genre_names: problemData.tags,
      };

      const response = await fetch('http://localhost:8000/problem/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        navigate('/create-contest', { 
          state: { 
            refreshProblems: true,
            contestId: contestId,
            returnToStep: 1
          } 
        });
      } else {
        const errorData = await response.json();
        console.error('Error creating problem:', errorData);
      }
    } catch (error) {
      console.error('Error creating problem:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Problem
          {contestId && (
            <Typography variant="subtitle1" color="text.secondary">
              This problem will be added to your contest
            </Typography>
          )}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Problem Title"
            value={problemData.title}
            onChange={(e) => setProblemData({ ...problemData, title: e.target.value })}
            margin="normal"
            required
          />

          <FormControl component="fieldset" margin="normal">
            <Typography variant="subtitle1">Problem Type</Typography>
            <RadioGroup
              value={problemData.type}
              onChange={(e) => setProblemData({ ...problemData, type: e.target.value })}
            >
              <FormControlLabel value="mcq" control={<Radio />} label="Multiple Choice" />
              <FormControlLabel value="descriptive" control={<Radio />} label="Descriptive" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Problem Description"
            multiline
            rows={4}
            value={problemData.question}
            onChange={(e) => setProblemData({ ...problemData, question: e.target.value })}
            margin="normal"
            required
          />

          {problemData.type === 'mcq' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Options
              </Typography>
              {problemData.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                  {index > 0 && (
                    <IconButton onClick={() => removeOption(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addOption}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Option
              </Button>
            </Box>
          )}

          <TextField
            fullWidth
            label="Correct Answer"
            multiline
            rows={problemData.type === 'descriptive' ? 4 : 1}
            value={problemData.answer}
            onChange={(e) => setProblemData({ ...problemData, answer: e.target.value })}
            margin="normal"
            required
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <TextField
              fullWidth
              label="Add Tags (Press Enter)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleAddTag}
              margin="normal"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {problemData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              Finish Creation
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProblem; 