import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useTeam } from '../../hooks/useTeam';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive: string;
}

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}

const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const handleSubmit = () => {
    if (email) {
      onInvite(email, role);
      setEmail('');
      setRole('viewer');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Team Member</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TeamManagement: React.FC = () => {
  const { members, inviteMember, updateMemberRole, removeMember, loading } = useTeam();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleInvite = async (email: string, role: string) => {
    try {
      await inviteMember(email, role);
      setSnackbar({ open: true, message: 'Invitation sent successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send invitation', severity: 'error' });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(memberId, newRole);
      setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update role', severity: 'error' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(memberId);
        setSnackbar({ open: true, message: 'Member removed successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'editor': return 'warning';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Team Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Member
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Members ({members?.length || 0})
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        >
                          <MenuItem value="viewer">Viewer</MenuItem>
                          <MenuItem value="editor">Editor</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        color={getStatusColor(member.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(member.lastActive).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMember(member.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <InviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInvite}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamManagement;