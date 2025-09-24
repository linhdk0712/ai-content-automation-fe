import {
  CheckCircle as ApproveIcon,
  Comment as CommentIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';

interface ContentItem {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video';
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: {
    id: string;
    name: string;
  };
  comments: Comment[];
  priority: 'low' | 'medium' | 'high';
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  type: 'comment' | 'approval' | 'rejection';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ApprovalWorkflow: React.FC = () => {
  const { 
    pendingItems, 
    approvedItems, 
    rejectedItems, 
    approveContent, 
    rejectContent, 
    requestRevision  } = useApprovalWorkflow();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReview = (item: ContentItem, action: 'approve' | 'reject' | 'revision') => {
    setSelectedItem(item);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;

    try {
      switch (reviewAction) {
        case 'approve':
          await approveContent(selectedItem.id, reviewComment);
          break;
        case 'reject':
          await rejectContent(selectedItem.id, reviewComment);
          break;
        case 'revision':
          await requestRevision(selectedItem.id, reviewComment);
          break;
      }
      setReviewDialogOpen(false);
      setReviewComment('');
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'revision_requested': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const renderContentTable = (items: ContentItem[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Content</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Submitted</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography variant="subtitle2">{item.title}</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={item.author.avatar} sx={{ width: 24, height: 24 }}>
                    {item.author.name[0]}
                  </Avatar>
                  {item.author.name}
                </Box>
              </TableCell>
              <TableCell>
                <Chip label={item.type} size="small" />
              </TableCell>
              <TableCell>
                <Chip 
                  label={item.priority} 
                  color={getPriorityColor(item.priority)}
                  size="small" 
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={item.status.replace('_', ' ')} 
                  color={getStatusColor(item.status)}
                  size="small" 
                />
              </TableCell>
              <TableCell>
                {new Date(item.submittedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => {}}>
                    <ViewIcon />
                  </IconButton>
                  {item.status === 'pending' && (
                    <>
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleReview(item, 'approve')}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleReview(item, 'reject')}
                      >
                        <RejectIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleReview(item, 'revision')}
                      >
                        <CommentIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Approval Workflow
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={pendingItems?.length || 0} color="warning">
                  Pending Review
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={approvedItems?.length || 0} color="success">
                  Approved
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={rejectedItems?.length || 0} color="error">
                  Rejected
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Pending Review ({pendingItems?.length || 0})
          </Typography>
          {renderContentTable(pendingItems || [])}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Approved Content ({approvedItems?.length || 0})
          </Typography>
          {renderContentTable(approvedItems || [])}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Rejected Content ({rejectedItems?.length || 0})
          </Typography>
          {renderContentTable(rejectedItems || [])}
        </TabPanel>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' && 'Approve Content'}
          {reviewAction === 'reject' && 'Reject Content'}
          {reviewAction === 'revision' && 'Request Revision'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedItem.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                by {selectedItem.author.name}
              </Typography>
            </Box>
          )}
          
          <TextField
            label="Review Comment"
            multiline
            rows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            fullWidth
            placeholder={
              reviewAction === 'approve' 
                ? 'Optional: Add approval notes...'
                : reviewAction === 'reject'
                ? 'Please explain why this content is being rejected...'
                : 'Please specify what changes are needed...'
            }
          />

          {selectedItem?.comments && selectedItem.comments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Previous Comments
              </Typography>
              <List dense>
                {selectedItem.comments.map((comment) => (
                  <React.Fragment key={comment.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={comment.author.avatar}>
                          {comment.author.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={comment.author.name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {comment.content}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            color={
              reviewAction === 'approve' ? 'success' : 
              reviewAction === 'reject' ? 'error' : 'primary'
            }
          >
            {reviewAction === 'approve' && 'Approve'}
            {reviewAction === 'reject' && 'Reject'}
            {reviewAction === 'revision' && 'Request Revision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalWorkflow;