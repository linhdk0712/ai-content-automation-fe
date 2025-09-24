import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Rating,
  Divider,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoIcon,
  QuestionAnswer as QAIcon,
  ContactSupport as ContactIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Bookmark as BookmarkIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useHelpCenter } from '../../hooks/useHelpCenter';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdated: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  views: number;
  rating: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const HelpCenter: React.FC = () => {
  const { 
    articles, 
    videos, 
    faqs, 
    searchResults, 
    loading,
    searchArticles,
    rateArticle,
    submitFeedback 
  } = useHelpCenter();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Help Center']);

  const categories = [
    'Getting Started',
    'Content Creation',
    'AI Features',
    'Team Collaboration',
    'Analytics',
    'Billing & Subscriptions',
    'Troubleshooting'
  ];

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      await searchArticles(term);
    }
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
    setBreadcrumbs(['Help Center', 'Articles', article.category, article.title]);
  };

  const handleVideoClick = (video: VideoTutorial) => {
    setSelectedVideo(video);
    setBreadcrumbs(['Help Center', 'Videos', video.category, video.title]);
  };

  const handleRating = async (articleId: string, helpful: boolean) => {
    try {
      await rateArticle(articleId, helpful);
    } catch (error) {
      console.error('Failed to rate article:', error);
    }
  };

  const handleContactSubmit = async () => {
    try {
      await submitFeedback(feedbackMessage);
      setContactDialogOpen(false);
      setFeedbackMessage('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
      <Link
        color="inherit"
        href="#"
        onClick={() => {
          setSelectedArticle(null);
          setSelectedVideo(null);
          setBreadcrumbs(['Help Center']);
        }}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Help Center
      </Link>
      {breadcrumbs.slice(1).map((crumb, index) => (
        <Typography key={index} color="text.primary">
          {crumb}
        </Typography>
      ))}
    </Breadcrumbs>
  );

  const renderArticleView = () => (
    <Box>
      {renderBreadcrumbs()}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {selectedArticle?.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={selectedArticle?.author.avatar} sx={{ width: 32, height: 32 }}>
                  {selectedArticle?.author.name[0]}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  By {selectedArticle?.author.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {selectedArticle?.lastUpdated && new Date(selectedArticle.lastUpdated).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedArticle?.views} views
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {selectedArticle?.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton>
                <BookmarkIcon />
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
              <IconButton>
                <PrintIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {selectedArticle?.content}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Was this article helpful?</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<ThumbUpIcon />}
                onClick={() => selectedArticle && handleRating(selectedArticle.id, true)}
                variant="outlined"
                size="small"
              >
                Yes ({selectedArticle?.helpful})
              </Button>
              <Button
                startIcon={<ThumbDownIcon />}
                onClick={() => selectedArticle && handleRating(selectedArticle.id, false)}
                variant="outlined"
                size="small"
              >
                No ({selectedArticle?.notHelpful})
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderVideoView = () => (
    <Box>
      {renderBreadcrumbs()}
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {selectedVideo?.title}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <video
              width="100%"
              height="400"
              controls
              poster={selectedVideo?.thumbnail}
            >
              <source src={selectedVideo?.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Duration: {selectedVideo?.duration}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedVideo?.views} views
            </Typography>
            <Rating value={selectedVideo?.rating} readOnly size="small" />
          </Box>
          
          <Typography variant="body1">
            {selectedVideo?.description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  if (selectedArticle) {
    return renderArticleView();
  }

  if (selectedVideo) {
    return renderVideoView();
  }

  return (
    <Box sx={{ p: 3 }}>
      {renderBreadcrumbs()}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Help Center
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Find answers to your questions and learn how to make the most of our platform
      </Typography>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search for help articles, tutorials, or FAQs..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(0)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ArticleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Articles</Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed guides and documentation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(1)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <VideoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Video Tutorials</Typography>
              <Typography variant="body2" color="text.secondary">
                Step-by-step video guides
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(2)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <QAIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">FAQs</Typography>
              <Typography variant="body2" color="text.secondary">
                Frequently asked questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setContactDialogOpen(true)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ContactIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Contact Support</Typography>
              <Typography variant="body2" color="text.secondary">
                Get help from our team
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Articles" />
            <Tab label="Video Tutorials" />
            <Tab label="FAQs" />
          </Tabs>
        </Box>

        {/* Articles Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {categories.map(category => (
              <Grid item xs={12} md={6} key={category}>
                <Typography variant="h6" gutterBottom>
                  {category}
                </Typography>
                <List dense>
                  {articles?.filter(article => article.category === category).slice(0, 5).map(article => (
                    <ListItem
                      key={article.id}
                      button
                      onClick={() => handleArticleClick(article)}
                    >
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={article.title}
                        secondary={`${article.views} views`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Video Tutorials Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {videos?.map(video => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => handleVideoClick(video)}>
                  <Box
                    sx={{
                      height: 200,
                      backgroundImage: `url(${video.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {video.duration}
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {video.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={video.rating} readOnly size="small" />
                      <Typography variant="caption">
                        {video.views} views
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* FAQs Tab */}
        <TabPanel value={tabValue} index={2}>
          {categories.map(category => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {category}
              </Typography>
              {faqs?.filter(faq => faq.category === category).map(faq => (
                <Accordion key={faq.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {faq.answer}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Was this helpful?
                      </Typography>
                      <IconButton size="small">
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption">{faq.helpful}</Typography>
                      <IconButton size="small">
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </TabPanel>
      </Card>

      {/* Contact Support Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Describe your issue or question..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleContactSubmit} variant="contained">
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HelpCenter;