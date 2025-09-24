import {
  Analytics,
  LocalOffer,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import React, { useState } from 'react';



const ContentOptimization: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [contentText, setContentText] = useState('');
  const [analysisResults] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Optimization
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered suggestions to optimize your content for maximum engagement
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Analyzer
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter your content here to get optimization suggestions..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={selectedPlatform}
                    label="Platform"
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    <MenuItem value="all">All Platforms</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="instagram">Instagram</MenuItem>
                    <MenuItem value="twitter">Twitter</MenuItem>
                    <MenuItem value="linkedin">LinkedIn</MenuItem>
                    <MenuItem value="tiktok">TikTok</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Analytics />}
                  onClick={() => setAnalyzing(true)}
                  disabled={!contentText.trim() || analyzing}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Content'}
                </Button>
              </Box>
              {analyzing && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Character Count:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {contentText.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Word Count:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {contentText.trim().split(/\s+/).filter(word => word.length > 0).length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Hashtags:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(contentText.match(/#\w+/g) || []).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {analysisResults && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Optimization Suggestions
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Based on your content analysis, here are some suggestions to improve engagement.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocalOffer color="primary" />
                    <Typography variant="subtitle1">Hashtag Optimization</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Add trending hashtags to increase discoverability
                  </Typography>
                  <Chip label="High Impact" color="success" size="small" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Schedule color="primary" />
                    <Typography variant="subtitle1">Timing Optimization</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Post during peak engagement hours
                  </Typography>
                  <Chip label="Medium Impact" color="warning" size="small" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TrendingUp color="primary" />
                    <Typography variant="subtitle1">Content Enhancement</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Improve readability and engagement
                  </Typography>
                  <Chip label="High Impact" color="success" size="small" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ContentOptimization;