import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useState } from 'react';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
}

interface SharePlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: (params: ShareParams) => string;
}

interface ShareParams {
  url: string;
  title: string;
  description?: string;
  hashtags?: string;
  via?: string;
}

const sharePlatforms: SharePlatform[] = [
  {
    name: 'Facebook',
    icon: <FacebookIcon />,
    color: '#1877F2',
    shareUrl: ({ url, title, description }) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title + (description ? ' - ' + description : ''))}`
  },
  {
    name: 'Twitter',
    icon: <TwitterIcon />,
    color: '#1DA1F2',
    shareUrl: ({ url, title, hashtags, via }) => {
      const text = encodeURIComponent(title);
      const hashtagsParam = hashtags ? `&hashtags=${encodeURIComponent(hashtags)}` : '';
      const viaParam = via ? `&via=${encodeURIComponent(via)}` : '';
      return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}${hashtagsParam}${viaParam}`;
    }
  },
  {
    name: 'LinkedIn',
    icon: <LinkedInIcon />,
    color: '#0A66C2',
    shareUrl: ({ url, title, description }) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`
  },
  {
    name: 'WhatsApp',
    icon: <WhatsAppIcon />,
    color: '#25D366',
    shareUrl: ({ url, title }) => 
      `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  },
  {
    name: 'Telegram',
    icon: <TelegramIcon />,
    color: '#0088CC',
    shareUrl: ({ url, title }) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  }
];

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description,
  hashtags = [],
  via,
  size = 'medium',
  showLabels = false
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState(title);
  const [copied, setCopied] = useState(false);
  
  const canNativeShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
  
  const shareParams: ShareParams = {
    url,
    title,
    description,
    hashtags: hashtags.join(','),
    via
  };
  
  const handleShare = (platform: SharePlatform) => {
    const shareUrl = platform.shareUrl(shareParams);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    // Track sharing analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        method: platform.name.toLowerCase(),
        content_type: 'article',
        item_id: url
      });
    }
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };
  
  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await (navigator as any).share({
          title,
          text: description,
          url
        });
      } catch (error) {
        console.error('Native sharing failed:', error);
        setShareDialogOpen(true);
      }
    } else {
      setShareDialogOpen(true);
    }
  };
  
  const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {/* Native Share Button (mobile) */}
        {canNativeShare && (
          <Tooltip title="Share">
            <IconButton
              onClick={handleNativeShare}
              size={size}
              sx={{ color: 'primary.main' }}
            >
              <ShareIcon sx={{ fontSize: iconSize }} />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Platform-specific share buttons */}
        {sharePlatforms.map((platform) => (
          <Tooltip key={platform.name} title={`Share on ${platform.name}`}>
            <IconButton
              onClick={() => handleShare(platform)}
              size={size}
              sx={{ 
                color: platform.color,
                '&:hover': {
                  backgroundColor: `${platform.color}15`
                }
              }}
            >
              {React.cloneElement(platform.icon as React.ReactElement, {
                sx: { fontSize: iconSize }
              })}
            </IconButton>
          </Tooltip>
        ))}
        
        {/* Copy Link Button */}
        <Tooltip title={copied ? 'Copied!' : 'Copy Link'}>
          <IconButton
            onClick={handleCopyLink}
            size={size}
            sx={{ 
              color: copied ? 'success.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CopyIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
        
        {showLabels && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Share
          </Typography>
        )}
      </Box>
      
      {/* Custom Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Content</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Custom Message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Share on Social Media
          </Typography>
          
          <Grid container spacing={2}>
            {sharePlatforms.map((platform) => (
              <Grid item xs={6} sm={4} key={platform.name}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={platform.icon}
                  onClick={() => {
                    handleShare({
                      ...platform,
                      shareUrl: (params) => platform.shareUrl({
                        ...params,
                        title: customMessage
                      })
                    });
                    setShareDialogOpen(false);
                  }}
                  sx={{
                    borderColor: platform.color,
                    color: platform.color,
                    '&:hover': {
                      borderColor: platform.color,
                      backgroundColor: `${platform.color}15`
                    }
                  }}
                >
                  {platform.name}
                </Button>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Direct Link
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={url}
                InputProps={{ readOnly: true }}
              />
              <Button
                variant="outlined"
                onClick={handleCopyLink}
                sx={{ minWidth: 'auto' }}
              >
                <CopyIcon />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};