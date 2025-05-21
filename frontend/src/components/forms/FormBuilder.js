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
  Divider,
  Stack,
  Card,
  CardContent,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { createForm, getForm, updateForm } from '../../utils/api';

const questionTypes = [
  { value: 'short_text', label: 'Short Answer' },
  { value: 'long_text', label: 'Paragraph' },
  { value: 'single_choice', label: 'Multiple Choice' },
  { value: 'multiple_choice', label: 'Checkboxes' },
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
    if (id) loadForm();
    // eslint-disable-next-line
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
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
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
    }));
  };

  const handleDuplicateQuestion = (questionId) => {
    const q = formData.questions.find((q) => q.id === questionId);
    if (q) {
      const now = new Date().toISOString();
      const duplicated = {
        ...q,
        id: Date.now(),
        label: `${q.label} (Copy)`,
        options: q.options.map(opt => ({
          ...opt,
          id: Date.now() + Math.random(),
        })),
        createdAt: now,
        createdBy: 'arthurbalaji',
      };
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, duplicated],
        lastModifiedAt: now,
        lastModifiedBy: 'arthurbalaji',
      }));
    }
  };

  const handleQuestionChange = (questionId, field, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
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
    }));
  };

  const handleAddOption = (questionId) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
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
    }));
  };

  const handleOptionChange = (questionId, optionId, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
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
    }));
  };

  const handleDeleteOption = (questionId, optionId) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
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
    }));
  };

  const handleDeleteQuestion = (questionId) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'arthurbalaji',
    }));
  };

  const validateForm = (formData) => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Form title is required');
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
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          p: { xs: 2, sm: 4 },
          bgcolor: '#fdfdfd',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          minHeight: 700,
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <TextField
            variant="standard"
            InputProps={{
              disableUnderline: true,
              style: { fontSize: 28, fontWeight: 600, textAlign: 'center' },
            }}
            placeholder="Untitled Form"
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
            fullWidth
            required
            error={!formData.title.trim()}
            helperText={!formData.title.trim() ? 'Title is required' : ''}
            sx={{
              mb: 0,
              '.MuiInputBase-root': { justifyContent: 'center' },
              '.MuiInput-input': { textAlign: 'center' },
            }}
          />
          <TextField
            variant="standard"
            InputProps={{
              disableUnderline: true,
              style: { fontSize: 16, textAlign: 'center' },
            }}
            placeholder="Form description"
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
            multiline
            rows={2}
            fullWidth
            sx={{
              mb: 0,
              '.MuiInputBase-root': { justifyContent: 'center' },
              '.MuiInput-input': { textAlign: 'center' },
            }}
          />
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Stack spacing={3}>
          {formData.questions.map((question, index) => (
            <Fade in timeout={400} key={question.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
                  border: '1px solid #e0e0e0',
                  transition: 'box-shadow .2s',
                  '&:hover': { boxShadow: '0 3px 10px rgba(0,0,0,0.08)' },
                  px: 1,
                  background: '#fff',
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={1} sx={{ textAlign: 'center', pt: 2 }}>
                      <DragIndicatorIcon color="disabled" sx={{ cursor: 'grab', opacity: 0.5 }} />
                    </Grid>
                    <Grid item xs={11}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TextField
                          variant="standard"
                          InputProps={{
                            disableUnderline: true,
                            style: { fontSize: 18, fontWeight: 500, width: '100%' },
                          }}
                          placeholder={`Question ${index + 1}`}
                          value={question.label}
                          onChange={(e) =>
                            handleQuestionChange(question.id, 'label', e.target.value)
                          }
                          required
                          error={!question.label.trim()}
                          helperText={!question.label.trim() ? 'Question text required' : ''}
                          fullWidth
                          sx={{ mb: 0 }}
                        />
                        <Tooltip title="Duplicate">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateQuestion(question.id)}
                            color="primary"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteQuestion(question.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                  </Grid>
                  <Collapse in>
                    <TextField
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      placeholder="Question description"
                      value={question.description}
                      onChange={(e) =>
                        handleQuestionChange(question.id, 'description', e.target.value)
                      }
                      multiline
                      rows={1}
                      fullWidth
                      sx={{ mt: 1, mb: 1 }}
                    />
                  </Collapse>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={question.type}
                        onChange={(e) =>
                          handleQuestionChange(question.id, 'type', e.target.value)
                        }
                        label="Type"
                      >
                        {questionTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                          size="small"
                        />
                      }
                      label="Required"
                      sx={{ ml: 2, mt: { xs: 1, sm: 0 } }}
                    />
                  </Stack>
                  {['single_choice', 'multiple_choice', 'dropdown'].includes(
                    question.type
                  ) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: 14 }}>
                        Options (minimum 2)
                      </Typography>
                      <Stack spacing={1}>
                        {question.options.map((option, optionIndex) => (
                          <Fade in timeout={300} key={option.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <TextField
                                variant="standard"
                                InputProps={{
                                  disableUnderline: true,
                                  style: { fontSize: 15 },
                                }}
                                placeholder={`Option ${optionIndex + 1}`}
                                value={option.text}
                                onChange={(e) =>
                                  handleOptionChange(
                                    question.id,
                                    option.id,
                                    e.target.value
                                  )
                                }
                                required
                                error={!option.text.trim()}
                                helperText={
                                  !option.text.trim() ? 'Option text required' : ''
                                }
                                sx={{ flex: 1 }}
                              />
                              <IconButton
                                onClick={() => handleDeleteOption(question.id, option.id)}
                                color="error"
                                disabled={question.options.length <= 2}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Fade>
                        ))}
                      </Stack>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddOption(question.id)}
                        sx={{
                          mt: 2,
                          mb: 1,
                          color: 'primary.main',
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          minWidth: 0,
                          '&:hover': { bgcolor: '#e8e8e8' },
                        }}
                        size="small"
                      >
                        Add Option
                      </Button>
                      {question.options.length < 2 && (
                        <Typography color="error" variant="caption" sx={{ display: 'block' }}>
                          At least 2 options required
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
              sx={{
                bgcolor: '#4285f4',
                color: '#fff',
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: '#3367d6' },
              }}
              size="medium"
            >
              Add Question
            </Button>
          </Box>
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
            sx={{
              mt: 4,
              fontWeight: 600,
              fontSize: 16,
              bgcolor: '#34a853',
              '&:hover': { bgcolor: '#2e8b57' },
              borderRadius: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.09)',
              py: 1,
              letterSpacing: 0.3,
            }}
            disabled={loading || (!isDirty && id)}
            onClick={handleSubmit}
          >
            {loading
              ? 'Saving...'
              : id
              ? `Update Form${isDirty ? '' : ' (No Changes)'}`
              : 'Create Form'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default FormBuilder;