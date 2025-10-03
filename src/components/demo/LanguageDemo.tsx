/**
 * Language Demo Component
 * Demonstrates the language switching functionality
 */

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useI18n } from '../../hooks/useI18n';

const LanguageDemo: React.FC = () => {
  const { 
    t, 
    currentLanguage, 
    supportedLanguages, 
    changeLanguage, 
    formatDate, 
    formatTime, 
    formatNumber, 
    formatCurrency,
    isRTL 
  } = useI18n();

  const now = new Date();
  const sampleNumber = 1234567.89;
  const sampleAmount = 99.99;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('common.dashboard')} - Language Demo
      </Typography>
      
      <Grid container spacing={3}>
        {/* Current Language Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Language Settings
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Language: <strong>{currentLanguage}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Text Direction: <strong>{isRTL ? 'Right-to-Left' : 'Left-to-Right'}</strong>
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Available Languages:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {supportedLanguages.map((lang) => (
                  <Chip
                    key={lang.code}
                    label={`${lang.flag} ${lang.nativeName}`}
                    variant={lang.code === currentLanguage ? 'filled' : 'outlined'}
                    color={lang.code === currentLanguage ? 'primary' : 'default'}
                    onClick={() => changeLanguage(lang.code)}
                    clickable
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Translated Content */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Translated Content
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={t('common.dashboard')}
                    secondary="common.dashboard"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={t('common.content')}
                    secondary="common.content"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={t('common.analytics')}
                    secondary="common.analytics"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={t('common.settings')}
                    secondary="common.settings"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Formatting Examples */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Locale-specific Formatting
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Date Format:</Typography>
                  <Typography variant="body1">{formatDate(now)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Time Format:</Typography>
                  <Typography variant="body1">{formatTime(now)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Number Format:</Typography>
                  <Typography variant="body1">{formatNumber(sampleNumber)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Currency Format:</Typography>
                  <Typography variant="body1">{formatCurrency(sampleAmount)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Language Switch */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Language Switch
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant={currentLanguage === 'en' ? 'contained' : 'outlined'}
                  onClick={() => changeLanguage('en')}
                >
                  🇺🇸 English
                </Button>
                <Button 
                  variant={currentLanguage === 'vi' ? 'contained' : 'outlined'}
                  onClick={() => changeLanguage('vi')}
                >
                  🇻🇳 Tiếng Việt
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LanguageDemo;