import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getForms } from '../../utils/api';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await getForms();
      setForms(response.data);
    } catch (err) {
      setError('Failed to load forms');
    }
  };

  const handleShare = (formId) => {
    const formUrl = `${window.location.origin}/forms/${formId}/respond`;
    navigator.clipboard.writeText(formUrl);
    // You could add a snackbar notification here
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2 }}>
        <Typography variant="h4">My Forms</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/forms/create')}
        >
          Create Form
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper elevation={3}>
        <List>
          {forms.map((form) => (
            <ListItem key={form.id} divider>
              <ListItemText
                primary={form.title}
                secondary={`Created: ${new Date(
                  form.created_at
                ).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => navigate(`/forms/${form.id}/responses`)}
                  title="View Responses"
                >
                  <VisibilityIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => navigate(`/forms/${form.id}/edit`)}
                  title="Edit Form"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleShare(form.id)}
                  title="Share Form"
                >
                  <ShareIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default FormList;