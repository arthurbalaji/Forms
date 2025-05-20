import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { createForm, getForm, updateForm } from '../../utils/api';

const questionTypes = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice (Radio)' },
  { value: 'multiple_choice', label: 'Multiple Choice (Checkbox)' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
];

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadForm();
    }
  }, [id]);

  const loadForm = async () => {
    try {
      const response = await getForm(id);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load form');
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: Date.now(),
          type: 'short_text',
          label: '',
          required: false,
          options: [],
        },
      ],
    });
  };

  const handleQuestionChange = (questionId, field, value) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  const handleAddOption = (questionId) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, { id: Date.now(), text: '' }] }
          : q
      ),
    });
  };

  const handleOptionChange = (questionId, optionId, value) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text: value } : opt
              ),
            }
          : q
      ),
    });
  };

  const handleDeleteQuestion = (questionId) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== questionId),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await updateForm(id, formData);
      } else {
        await createForm(formData);
      }
      navigate('/forms');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save form');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Edit Form' : 'Create Form'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Form Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Questions
            </Typography>
            {formData.questions.map((question, index) => (
              <Paper key={question.id} sx={{ p: 2, mt: 2 }} elevation={1}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={11}>
                    <TextField
                      fullWidth
                      label={`Question ${index + 1}`}
                      value={question.label}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'label', e.target.value)
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleDeleteQuestion(question.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Question Type</InputLabel>
                      <Select
                        value={question.type}
                        onChange={(e) =>
                          handleQuestionChange(question.id, 'type', e.target.value)
                        }
                        label="Question Type"
                      >
                        {questionTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {['single_choice', 'multiple_choice'].includes(
                    question.type
                  ) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Options
                      </Typography>
                      {question.options.map((option) => (
                        <TextField
                          key={option.id}
                          fullWidth
                          size="small"
                          margin="dense"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(
                              question.id,
                              option.id,
                              e.target.value
                            )
                          }
                          placeholder="Option text"
                        />
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(question.id)}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
          </Box>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            sx={{ mt: 2 }}
          >
            Add Question
          </Button>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            {id ? 'Update Form' : 'Create Form'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FormBuilder;