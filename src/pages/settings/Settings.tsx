import {
  AdminPanelSettings as AdminIcon,
  List as ListIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSettings from '../../pages/settings/AdminSettings';
import UserSettings from '../../pages/settings/UserSettings';
import ListOfValues from '../../pages/settings/ListOfValues';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [selectedSetting, setSelectedSetting] = useState<string>('user');

  // Check if user is root admin
  const isRootAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ROOT_ADMIN');

  if (!user) {
    return <Box>Loading...</Box>;
  }

  const settingsMenu = [
    { key: 'user', label: 'User Settings', icon: <SettingsIcon />, component: <UserSettings /> },
    { key: 'list-of-values', label: 'List of Values', icon: <ListIcon />, component: <ListOfValues /> },
    ...(isRootAdmin ? [{ key: 'admin', label: 'Admin Settings', icon: <AdminIcon />, component: <AdminSettings /> }] : [])
  ];

  const renderContent = () => {
    const setting = settingsMenu.find(s => s.key === selectedSetting);
    return setting ? setting.component : <UserSettings />;
  };

  return (
    <Box sx={{ 
      p: 3,
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mb: 3
      }}>
        <SettingsIcon />
        Settings
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        minHeight: '600px'
      }}>
        {/* Sidebar */}
        <Box sx={{ 
          width: 280, 
          flexShrink: 0
        }}>
          <Card sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            height: 'fit-content'
          }}>
            <List sx={{ p: 0 }}>
              {settingsMenu.map((setting) => (
                <ListItem
                  key={setting.key}
                  button
                  selected={selectedSetting === setting.key}
                  onClick={() => setSelectedSetting(setting.key)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {setting.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={setting.label}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: selectedSetting === setting.key ? 600 : 400
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          flex: 1,
          minWidth: 0 // Prevents flex item from overflowing
        }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;