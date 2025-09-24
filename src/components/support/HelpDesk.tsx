import React, { useState, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Chip,
  Avatar,
  Badge
} from '@mui/material';
import {
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useSupport } from '@/hooks/useSupport';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export const HelpDesk: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  
  const {
    faqItems,
    searchFAQ,
    submitTicket,
    isSubmitting,
    unreadMessages,
    chatHistory
  } = useSupport();
  
  const [filteredFAQ, setFilteredFAQ] = useState(faqItems);
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchFAQ(searchQuery);
      setFilteredFAQ(filtered);
    } else {
      setFilteredFAQ(faqItems);
    }
  }, [searchQuery, faqItems, searchFAQ]);
  
  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      return;
    }
    
    try {
      await submitTicket({
        subject: ticketSubject,
        message: ticketMessage,
        priority: 'medium',
        category: 'general'
      });
      
      setTicketSubject('');
      setTicketMessage('');
      setTabValue(0); // Switch to FAQ tab
    } catch (error) {
      console.error('Failed to submit ticket:', error);
    }
  };
  
  return (
    <>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setOpen(true)}
      >
        <Badge badgeContent={unreadMessages} color="error">
          <HelpIcon />
        </Badge>
      </Fab>
      
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon />
            Help & Support
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label="FAQ" />
            <Tab label="Contact Support" />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Live Chat
                  {unreadMessages > 0 && (
                    <Chip size="small" label={unreadMessages} color="error" />
                  )}
                </Box>
              }
            />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
            
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredFAQ.map((item, index) => (
                <Accordion key={index as any}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                    {item.links && (
                      <Box sx={{ mt: 2 }}>
                        {item.links.map((link, linkIndex: any) => (
                          <Button
                            key={linkIndex}
                            size="small"
                            href={link.url}
                            target="_blank"
                            sx={{ mr: 1 }}
                          >
                            {link.label}
                          </Button>
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Submit a Support Ticket
            </Typography>
            
            <TextField
              fullWidth
              label="Subject"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Describe your issue"
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                href="mailto:support@aicontentautomation.com"
              >
                Email Support
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PhoneIcon />}
                href="tel:+1234567890"
              >
                Call Support
              </Button>
            </Box>
            
            <Button
              variant="contained"
              onClick={handleSubmitTicket}
              disabled={!ticketSubject.trim() || !ticketMessage.trim() || isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Live Chat Support
            </Typography>
            
            <Box sx={{ 
              height: '300px', 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              p: 2,
              overflow: 'auto',
              mb: 2
            }}>
              {chatHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  No messages yet. Start a conversation with our support team!
                </Typography>
              ) : (
                <List>
                  {chatHistory.map((message, index: any) => (
                    <ListItem key={index} sx={{ 
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      px: 0
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: 1,
                        maxWidth: '70%'
                      }}>
                        {message.sender !== 'user' && (
                          <Avatar sx={{ width: 32, height: 32 }}>S</Avatar>
                        )}
                        <Box sx={{
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                          color: message.sender === 'user' ? 'white' : 'text.primary',
                          p: 1.5,
                          borderRadius: 2,
                          maxWidth: '100%'
                        }}>
                          <Typography variant="body2">{message.text}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              fullWidth
              onClick={() => {
                // Initialize chat or open chat widget
                console.log('Starting live chat...');
              }}
            >
              Start Live Chat
            </Button>
          </TabPanel>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};