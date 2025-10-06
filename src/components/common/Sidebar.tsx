import {
  AccountCircle,
  Analytics as AnalyticsIcon,
  AutoAwesome,
  BarChart,
  Build,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Create as CreateIcon,
  Dashboard as DashboardIcon,
  Description,
  ExpandLess,
  ExpandMore,
  Folder,
  Group,
  Help,
  History,
  Image,
  Notifications,
  Palette,
  Payment as PaymentIcon,
  Schedule,
  Search,
  Settings as SettingsIcon,
  Share,
  TrendingUp,
  VideoFile
} from '@mui/icons-material'
import {
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
  useTheme
} from '@mui/material'
import { Settings } from 'lucide-react'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../../hooks/useI18n'

const drawerWidth = 240
const collapsedWidth = 56

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path?: string
  children?: NavigationItem[]
  badge?: number
  role?: string[]
  enabled?: boolean
  key?: string
}

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { t } = useI18n()

  const [expandedItems, setExpandedItems] = useState<string[]>(['content'])
  const [searchQuery, setSearchQuery] = useState('')

  // Generate navigation items with translations
  const getNavigationItems = (): NavigationItem[] => [
    { key: 'dashboard', text: t('sidebar.dashboard'), icon: <DashboardIcon />, path: '/dashboard', enabled: false },
    {
      key: 'content',
      text: t('sidebar.content'),
      icon: <CreateIcon />,
      enabled: true,
      children: [
        { key: 'createContent', text: t('sidebar.createContent'), icon: <AutoAwesome />, path: '/content/create', enabled: true },
        { key: 'workflow', text: t('sidebar.workflow'), icon: <Build />, path: '/content/workflow', enabled: true },
        { key: 'workflowRuns', text: t('sidebar.workflowRuns'), icon: <History />, path: '/workflows', enabled: true },
        { key: 'contentLibrary', text: t('sidebar.contentLibrary'), icon: <Description />, path: '/content/library', enabled: false },
        { key: 'templates', text: t('sidebar.templates'), icon: <Description />, path: '/templates', enabled: false },
        { key: 'versionHistory', text: t('sidebar.versionHistory'), icon: <History />, path: '/content/versions', enabled: false },
        { key: 'export', text: t('sidebar.export'), icon: <CloudUpload />, path: '/content/export', enabled: false }
      ]
    },
    {
      key: 'socialMedia',
      text: t('sidebar.socialMedia'),
      icon: <Share />,
      enabled: false,
      children: [
        { key: 'accounts', text: t('sidebar.accounts'), icon: <AccountCircle />, path: '/social/accounts', enabled: false },
        { key: 'publishingQueue', text: t('sidebar.publishingQueue'), icon: <Schedule />, path: '/social/queue', badge: 5, enabled: false },
        { key: 'calendar', text: t('sidebar.calendar'), icon: <CalendarToday />, path: '/social/calendar', enabled: false },
        { key: 'socialAnalytics', text: t('sidebar.analytics'), icon: <TrendingUp />, path: '/social/analytics', enabled: false },
        { key: 'platformSettings', text: t('sidebar.platformSettings'), icon: <Settings />, path: '/social/settings', enabled: false },
        { key: 'contentOptimization', text: t('sidebar.contentOptimization'), icon: <BarChart />, path: '/social/optimization', enabled: false }
      ]
    },
    {
      key: 'mediaAssets',
      text: t('sidebar.mediaAssets'),
      icon: <Image />,
      enabled: false,
      children: [
        { key: 'mediaLibrary', text: t('sidebar.mediaLibrary'), icon: <Folder />, path: '/media/library', enabled: false },
        { key: 'imageGenerator', text: t('sidebar.imageGenerator'), icon: <Palette />, path: '/media/generator', enabled: false },
        { key: 'brandKit', text: t('sidebar.brandKit'), icon: <Palette />, path: '/media/brandkit', enabled: false },
        { key: 'assetEditor', text: t('sidebar.assetEditor'), icon: <Image />, path: '/media/editor', enabled: false },
        { key: 'videoProcessor', text: t('sidebar.videoProcessor'), icon: <VideoFile />, path: '/media/video', enabled: false },
        { key: 'assetAnalytics', text: t('sidebar.assetAnalytics'), icon: <AnalyticsIcon />, path: '/media/analytics', enabled: false }
      ]
    },
    { key: 'analytics', text: t('sidebar.analytics'), icon: <AnalyticsIcon />, path: '/analytics', enabled: false },
    { key: 'team', text: t('sidebar.team'), icon: <Group />, path: '/team', role: ['admin', 'manager'], enabled: false }
  ]

  const getSecondaryItems = (): NavigationItem[] => [
    { key: 'notifications', text: t('sidebar.notifications'), icon: <Notifications />, path: '/notifications', badge: 3,enabled:false},
    { key: 'pricing', text: t('sidebar.pricing'), icon: <PaymentIcon />, path: '/pricing',enabled:false },
    { key: 'settings', text: t('sidebar.settings'), icon: <SettingsIcon />, path: '/settings',enabled:true },
    { key: 'helpSupport', text: t('sidebar.helpSupport'), icon: <Help />, path: '/help',enabled:false }
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isParentActive = (item: NavigationItem) => {
    if (item.path) return isActive(item.path)
    return item.children?.some(child => child.path && isActive(child.path)) || false
  }

  const handleExpandClick = (itemKey: string) => {
    setExpandedItems(prev =>
      prev.includes(itemKey)
        ? prev.filter(item => item !== itemKey)
        : [...prev, itemKey]
    )
  }

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    const enabledItems = items.filter(item => item.enabled !== false)

    if (!searchQuery) return enabledItems

    return enabledItems.filter(item => {
      const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase())
      const hasMatchingChildren = item.children?.some(child =>
        child.enabled !== false && child.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesSearch || hasMatchingChildren
    })
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.key || item.text)
    const active = isParentActive(item)

    return (
      <React.Fragment key={item.key || item.text}>
        <ListItem disablePadding>
          <ListItemButton
            selected={active}
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.key || item.text)
              } else if (item.path) {
                handleNavigation(item.path)
              }
            }}
            sx={{
              pl: collapsed ? 1 : 1.5 + level * 1.5,
              pr: collapsed ? 1 : 1,
              minHeight: 40,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 32 }}>
              <Badge badgeContent={item.badge} color="error">
                {React.cloneElement(item.icon, { fontSize: 'small' })}
              </Badge>
            </ListItemIcon>

            {!collapsed && (
              <>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: level > 0 ? '0.75rem' : '0.85rem',
                    fontWeight: active ? 600 : 500
                  }}
                />
                {hasChildren && (
                  <IconButton size="small" sx={{ color: 'inherit' }}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.filter(child => child.enabled !== false).map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const drawerContent = (
    <>
      <Toolbar>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Typography variant="subtitle1" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem' }}>
              {t('sidebar.appTitle')}
            </Typography>
            {onToggleCollapse && (
              <IconButton onClick={onToggleCollapse} size="small">
                <ChevronLeft />
              </IconButton>
            )}
          </Box>
        )}
        {collapsed && onToggleCollapse && (
          <IconButton onClick={onToggleCollapse} size="small">
            <ChevronRight />
          </IconButton>
        )}
      </Toolbar>

      {!collapsed && (
        <Box sx={{ p: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafbfc',
                fontSize: '0.8rem',
              },
              '& .MuiInputBase-input': {
                fontSize: '0.8rem',
              }
            }}
          />
        </Box>
      )}

      <List sx={{ flexGrow: 1, px: 0.5 }}>
        {filterItems(getNavigationItems()).map(item => renderNavigationItem(item))}
      </List>

      <Divider />

      <List sx={{ px: 0.5 }}>
        {filterItems(getSecondaryItems()).map(item => renderNavigationItem(item))}
      </List>
    </>
  )

  return (
    <Box component="nav">
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 1200,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

export default Sidebar