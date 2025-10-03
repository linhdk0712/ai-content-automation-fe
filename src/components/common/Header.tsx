import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Logout,
  Settings,
  Search,
  NavigateNext,
  DarkMode,
  LightMode,
  Help,
  Feedback,
  Person,
  Dashboard,
  AutoAwesome,
  Schedule,
  Analytics} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { LanguageSwitcher } from '../internationalization/LanguageSwitcher'
import { useI18n } from '../../hooks/useI18n'

interface HeaderProps {
  onToggleSidebar?: () => void
  onToggleTheme?: () => void
  isDarkMode?: boolean
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onToggleTheme, 
  isDarkMode = false 
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { t } = useI18n()

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    handleClose()
  }

  const handleSettings = () => {
    navigate('/settings')
    handleClose()
  }

  const handleProfile = () => {
    navigate('/profile')
    handleClose()
  }

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment)
    const breadcrumbs = [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard fontSize="small" /> }
    ]

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Map path segments to readable names
      const segmentMap: Record<string, string> = {
        'content': t('common.content'),
        'create': t('common.create'),
        'library': t('common.library'),
        'templates': t('common.templates'),
        'social': t('common.social'),
        'accounts': t('common.accounts'),
        'queue': t('common.queue'),
        'calendar': t('common.calendar'),
        'analytics': t('common.analytics'),
        'media': t('common.media'),
        'generator': t('common.generator'),
        'brandkit': t('common.brandkit'),
        'settings': t('common.settings'),
        'team': t('common.team')
      }

      const label = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      if (index < pathSegments.length - 1 || pathSegments.length === 1) {
        breadcrumbs.push({ label, path: currentPath, icon: null as any })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Mock notifications with translations
  const notifications = [
    { id: 1, title: t('notifications.postPublished'), time: '2 min ago', type: 'success' },
    { id: 2, title: t('notifications.contentGenerated'), time: '5 min ago', type: 'info' },
    { id: 3, title: t('notifications.postFailed'), time: '10 min ago', type: 'error' },
    { id: 4, title: t('notifications.teamMemberJoined'), time: '1 hour ago', type: 'info' }
  ]

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onToggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Logo/Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('header.appTitle')}
          </Typography>
        </Box>

        {/* Breadcrumbs */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              aria-label="breadcrumb"
            >
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={crumb.path}
                  color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                  href={crumb.path}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(crumb.path)
                  }}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {crumb.icon && <Box sx={{ mr: 0.5 }}>{crumb.icon}</Box>}
                  {crumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
        )}

        {/* Search */}
        {!isMobile && (
          <Box sx={{ mr: 2 }}>
            <TextField
              size="small"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick Actions */}
          {!isMobile && (
            <>
              <Tooltip title={t('header.createContent')}>
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/content/create')}
                >
                  <AutoAwesome />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={t('header.schedulePost')}>
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/social/calendar')}
                >
                  <Schedule />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={t('header.viewAnalytics')}>
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/analytics')}
                >
                  <Analytics />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Language Switcher */}
          <Box sx={{ mr: 1 }}>
            <LanguageSwitcher compact={isMobile} showFlags={!isMobile} />
          </Box>

          {/* Theme Toggle */}
          <Tooltip title={isDarkMode ? t('header.switchToLightMode') : t('header.switchToDarkMode')}>
            <IconButton onClick={onToggleTheme} color="inherit">
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title={t('common.notifications')}>
            <IconButton 
              color="inherit"
              onClick={handleNotificationMenu}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title={t('header.account')}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {user?.profilePictureUrl ? (
                <Avatar
                  src={user.profilePictureUrl}
                  alt={user.username}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 }
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">{t('common.notifications')}</Typography>
          </Box>
          
          {notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={handleNotificationClose}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          
          <Divider />
          <MenuItem onClick={() => navigate('/notifications')}>
            <Typography variant="body2" color="primary">
              {t('header.viewAllNotifications')}
            </Typography>
          </MenuItem>
        </Menu>

        {/* User Menu */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { width: 250 }
          }}
        >
          {/* User Info */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={user?.profilePictureUrl}
                sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
              >
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.profile')}</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.settings')}</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => navigate('/help')}>
            <ListItemIcon>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.help')}</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => navigate('/feedback')}>
            <ListItemIcon>
              <Feedback fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.feedback')}</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.logout')}</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header