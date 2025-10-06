import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ContentWorkflowStatus from '../../components/ContentWorkflowStatus';
import { useI18n } from '../../hooks/useI18n';

const ContentWorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [contentId, setContentId] = useState<string>('');
  const [searchedContentId, setSearchedContentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in real app, get from auth context
  const userId = 1;

  const handleSearch = () => {
    const id = parseInt(contentId);
    if (isNaN(id) || id <= 0) {
      setError('Please enter a valid content ID');
      return;
    }
    
    setError(null);
    setSearchedContentId(id);
  };

  const handleViewFullDetails = (runId: number) => {
    navigate(`/workflows/runs/${runId}`);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Content Workflow Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor workflow execution status for specific content items
        </Typography>
      </Box>

      {/* Search Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search by Content ID
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                label="Content ID"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter content ID (e.g., 123)"
                type="number"
                error={!!error}
                helperText={error}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={!contentId}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchedContentId && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Workflow Status for Content ID: {searchedContentId}
          </Typography>
          
          <ContentWorkflowStatus
            contentId={searchedContentId}
            userId={userId}
            showDetails={true}
            onViewFullDetails={handleViewFullDetails}
          />
        </Box>
      )}

      {/* Demo Section */}
      {!searchedContentId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to use this tool
            </Typography>
            <Typography variant="body2" paragraph>
              Enter a content ID to view its workflow execution status. This tool provides:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                Real-time workflow progress monitoring
              </Typography>
              <Typography component="li" variant="body2">
                Node-by-node execution details
              </Typography>
              <Typography component="li" variant="body2">
                Success/failure statistics
              </Typography>
              <Typography component="li" variant="body2">
                Live updates via Server-Sent Events (SSE)
              </Typography>
              <Typography component="li" variant="body2">
                Complete workflow run history
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
              <strong>Example Content IDs to try:</strong> 1, 2, 3, 123, 456
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ContentWorkflowPage;