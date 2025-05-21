import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { getForms, deleteForm } from '../../utils/api';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    loadForms();
    // eslint-disable-next-line
  }, []);

  const loadForms = async () => {
    try {
      const response = await getForms();
      setForms(response.data);
    } catch (err) {
      setError('Failed to load forms');
    }
  };

  const handleCopy = (formId) => {
    const formUrl = `${window.location.origin}/forms/${formId}/respond`;
    navigator.clipboard.writeText(formUrl);
    setSnackbar({ open: true, message: 'Form link copied to clipboard!', severity: 'success' });
  };

  const handleDeleteClick = (form) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;
    setDeleting(true);
    try {
      await deleteForm(formToDelete.id);
      setForms((prev) => prev.filter((f) => f.id !== formToDelete.id));
      setDeleteDialogOpen(false);
      setFormToDelete(null);
      setSnackbar({ open: true, message: 'Form deleted!', severity: 'success' });
    } catch (err) {
      setError('Failed to delete form');
      setSnackbar({ open: true, message: 'Failed to delete form', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFormToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <AssignmentIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Forms
          </Typography>
        </Stack>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/forms/create')}
          sx={{
            borderRadius: 999,
            fontWeight: 600,
            bgcolor: '#4285f4',
            px: 4,
            py: 1.5,
            fontSize: 18,
            boxShadow: '0 2px 12px rgba(66,133,244,0.12)',
            '&:hover': { bgcolor: '#1a73e8' },
          }}
        >
          Create Form
        </Button>
      </Box>

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
      )}

      <Grid container spacing={4}>
        {forms.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No forms found.
              </Typography>
              <Typography variant="body2">
                Click <b>Create Form</b> to make your first form!
              </Typography>
            </Paper>
          </Grid>
        )}
        {forms.map((form) => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                bgcolor: '#f8f9fa',
                boxShadow: '0 4px 24px rgba(60,64,67,0.10)',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 6px 32px rgba(60,64,67,0.18)' },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: '#222',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={form.title}
                >
                  {form.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: 36 }}
                  noWrap
                >
                  {form.description || <span style={{ color: '#bbb' }}>No description</span>}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    size="small"
                    label={`Created: ${new Date(form.created_at).toLocaleDateString()}`}
                    sx={{ bgcolor: '#e3e7ea', color: '#333' }}
                  />
                  <Chip
                    size="small"
                    label={`Questions: ${form.questions?.length ?? 0}`}
                    sx={{ bgcolor: '#e3e7ea', color: '#333' }}
                  />
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Tooltip title="View Responses">
                  <IconButton
                    onClick={() => navigate(`/forms/${form.id}/responses`)}
                    color="primary"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Form">
                  <IconButton
                    onClick={() => navigate(`/forms/${form.id}/edit`)}
                    color="info"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy Form Link">
                  <IconButton
                    onClick={() => handleCopy(form.id)}
                    color="secondary"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Form">
                  <IconButton
                    onClick={() => handleDeleteClick(form)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Form</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the form{' '}
          <b>{formToDelete && formToDelete.title}</b>? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2300}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default FormList;