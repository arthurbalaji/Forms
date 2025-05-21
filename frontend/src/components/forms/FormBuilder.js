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
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { createForm, getForm, updateForm } from '../../utils/api';

const questionTypes = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice (Radio)' },
  { value: 'multiple_choice', label: 'Multiple Choice (Checkbox)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'file', label: 'File Upload' },
];

const defaultFormData = {
  title: '',
  description: '',
  questions: [],
  createdBy: 'arthurbalaji',
  createdAt: '2025-05-21T05:28:13Z',
  lastModifiedAt: '2025-05-21T05:28:13Z',
  lastModifiedBy: 'arthurbalaji',
  version: 1,
};

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (id) {
      loadForm();
    }
  }, [id]);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await getForm(id);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load form');
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: Date.now(),
          type: 'short_text',
          label: '',
          description: '',
          required: false,
          options: [],
          createdAt: new Date().toISOString(),
          createdBy: 'arthurbalaji',
        },
      ],
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const handleDuplicateQuestion = (questionId) => {
    const questionToDuplicate = formData.questions.find((q) => q.id === questionId);
    if (questionToDuplicate) {
      const now = new Date().toISOString();
      const duplicatedQuestion = {
        ...questionToDuplicate,
        id: Date.now(),
        label: `${questionToDuplicate.label} (Copy)`,
        options: questionToDuplicate.options.map(opt => ({
          ...opt,
          id: Date.now() + Math.random(),
        })),
        createdAt: now,
        createdBy: 'arthurbalaji',
      };

      setIsDirty(true);
      setFormData({
        ...formData,
        questions: [...formData.questions, duplicatedQuestion],
        lastModifiedAt: now,
        lastModifiedBy: 'arthurbalaji',
      });
    }
  };

  const handleQuestionChange = (questionId, field, value) => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: formData.questions.map((q) => {
        if (q.id === questionId) {
          if (field === 'type') {
            if (!['single_choice', 'multiple_choice', 'dropdown'].includes(value)) {
              return {
                ...q,
                [field]: value,
                options: [],
                lastModifiedAt: new Date().toISOString(),
                lastModifiedBy: 'arthurbalaji',
              };
            }
          }
          return {
            ...q,
            [field]: value,
            lastModifiedAt: new Date().toISOString(),
            lastModifiedBy: 'arthurbalaji',
          };
        }
        return q;
      }),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const handleAddOption = (questionId) => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                {
                  id: Date.now(),
                  text: '',
                  createdAt: new Date().toISOString(),
                  createdBy: 'arthurbalaji',
                },
              ],
              lastModifiedAt: new Date().toISOString(),
              lastModifiedBy: 'arthurbalaji',
            }
          : q
      ),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const handleOptionChange = (questionId, optionId, value) => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId
                  ? {
                      ...opt,
                      text: value,
                      lastModifiedAt: new Date().toISOString(),
                      lastModifiedBy: 'arthurbalaji',
                    }
                  : opt
              ),
              lastModifiedAt: new Date().toISOString(),
              lastModifiedBy: 'arthurbalaji',
            }
          : q
      ),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const handleDeleteOption = (questionId, optionId) => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((opt) => opt.id !== optionId),
              lastModifiedAt: new Date().toISOString(),
              lastModifiedBy: 'arthurbalaji',
            }
          : q
      ),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const handleDeleteQuestion = (questionId) => {
    setIsDirty(true);
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== questionId),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    });
  };

  const validateForm = (formData) => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Form title is required');
    }

    formData.questions.forEach((question, index) => {
      if (!question.label.trim()) {
        errors.push(`Question ${index + 1} label is required`);
      }

      if (['single_choice', 'multiple_choice', 'dropdown'].includes(question.type)) {
        if (question.options.length < 2) {
          errors.push(`Question ${index + 1} requires at least 2 options`);
        }

        question.options.forEach((option, optIndex) => {
          if (!option.text.trim()) {
            errors.push(
              `Question ${index + 1}, Option ${optIndex + 1} text is required`
            );
          }
        });
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const updatedFormData = {
        ...formData,
        version: formData.version + 1,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: 'arthurbalaji',
      };

      if (id) {
        await updateForm(id, updatedFormData);
      } else {
        await createForm(updatedFormData);
      }
      setIsDirty(false);
      navigate('/forms');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save form');
      console.error('Error saving form:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading form...</Typography>
      </Container>
    );
  }

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
            onChange={(e) => {
              setIsDirty(true);
              setFormData({
                ...formData,
                title: e.target.value,
                lastModifiedAt: new Date().toISOString(),
                lastModifiedBy: 'arthurbalaji',
              });
            }}
            required
            error={!formData.title.trim()}
            helperText={!formData.title.trim() ? 'Title is required' : ''}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => {
              setIsDirty(true);
              setFormData({
                ...formData,
                description: e.target.value,
                lastModifiedAt: new Date().toISOString(),
                lastModifiedBy: 'arthurbalaji',
              });
            }}
          />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Questions
            </Typography>
            {formData.questions.map((question, index) => (
              <Paper
                key={question.id}
                sx={{ p: 2, mt: 2 }}
                elevation={1}
              >
                <Grid container spacing={2}>
                  <Grid item xs={10}>
                    <TextField
                      fullWidth
                      label={`Question ${index + 1}`}
                      value={question.label}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'label', e.target.value)
                      }
                      required
                      error={!question.label.trim()}
                      helperText={!question.label.trim() ? 'Question is required' : ''}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Duplicate question">
                      <IconButton
                        onClick={() => handleDuplicateQuestion(question.id)}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete question">
                      <IconButton
                        onClick={() => handleDeleteQuestion(question.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Question Description"
                      value={question.description}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'description', e.target.value)
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
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
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={question.required}
                          onChange={(e) =>
                            handleQuestionChange(
                              question.id,
                              'required',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Required"
                    />
                  </Grid>

                  {['single_choice', 'multiple_choice', 'dropdown'].includes(
                    question.type
                  ) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Options (Minimum 2 required)
                      </Typography>
                      {question.options.map((option, optionIndex) => (
                        <Box
                          key={option.id}
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <TextField
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
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                            error={!option.text.trim()}
                            helperText={
                              !option.text.trim() ? 'Option text is required' : ''
                            }
                          />
                          <IconButton
                            onClick={() => handleDeleteOption(question.id, option.id)}
                            color="error"
                            disabled={question.options.length <= 2}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(question.id)}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                      {question.options.length < 2 && (
                        <Typography
                          color="error"
                          variant="caption"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          At least 2 options are required
                        </Typography>
                      )}
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
            <Alert severity="error" sx={{ mt: 2 }}>
              {error.split('\n').map((err, index) => (
                <div key={index}>{err}</div>
              ))}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading || (!isDirty && id)}
          >
            {loading
              ? 'Saving...'
              : id
              ? `Update Form${isDirty ? '' : ' (No Changes)'}`
              : 'Create Form'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FormBuilder;