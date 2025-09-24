import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Badge,
  useTheme
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Create as CreateIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  ExpandLess,
  ExpandMore,
  Search,
  Folder,
  Schedule,
  Image,
  VideoFile,
  Share,
  Group,
  Notifications,
  Help,
  ChevronLeft,
  ChevronRight,
  Description,
  AutoAwesome,
  CalendarToday,
  Palette,
  CloudUpload,
  BarChart,
  TrendingUp,
  AccountCircle,
  History
} from '@mui/icons-material'
import { Settings } from 'lucide-react'

const drawerWidth = 280
const collapsedWidth = 64

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path?: string
  children?: NavigationItem[]
  badge?: number
  role?: string[]
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    text: 'Content',
    icon: <CreateIcon />,
    children: [
      { text: 'Create Content', icon: <AutoAwesome />, path: '/content/create' },
      { text: 'Content Library', icon: <Description />, path: '/content/library' },
      { text: 'Templates', icon: <Description />, path: '/templates' },
      { text: 'Version History', icon: <History />, path: '/content/versions' },
      { text: 'Workflow', icon: <Group />, path: '/content/workflow' },
      { text: 'Export', icon: <CloudUpload />, path: '/content/export' }
    ]
  },
  {
    text: 'Social Media',
    icon: <Share />,
    children: [
      { text: 'Accounts', icon: <AccountCircle />, path: '/social/accounts' },
      { text: 'Publishing Queue', icon: <Schedule />, path: '/social/queue', badge: 5 },
      { text: 'Calendar', icon: <CalendarToday />, path: '/social/calendar' },
      { text: 'Analytics', icon: <TrendingUp />, path: '/social/analytics' },
      { text: 'Platform Settings', icon: <Settings />, path: '/social/settings' },
      { text: 'Content Optimization', icon: <BarChart />, path: '/social/optimization' }
    ]
  },
  {
    text: 'Media & Assets',
    icon: <Image />,
    children: [
      { text: 'Media Library', icon: <Folder />, path: '/media/library' },
      { text: 'Image Generator', icon: <Palette />, path: '/media/generator' },
      { text: 'Brand Kit', icon: <Palette />, path: '/media/brandkit' },
      { text: 'Asset Editor', icon: <Image />, path: '/media/editor' },
      { text: 'Video Processor', icon: <VideoFile />, path: '/media/video' },
      { text: 'Asset Analytics', icon: <AnalyticsIcon />, path: '/media/analytics' }
    ]
  },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Team', icon: <Group />, path: '/team', role: ['admin', 'manager'] }
]

const secondaryItems: NavigationItem[] = [
  { text: 'Notifications', icon: <Notifications />, path: '/notifications', badge: 3 },
  { text: 'Pricing', icon: <PaymentIcon />, path: '/pricing' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Help & Support', icon: <Help />, path: '/help' }
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  
  const [expandedItems, setExpandedItems] = useState<string[]>(['Content', 'Social Media'])
  const [searchQuery, setSearchQuery] = useState('')

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isParentActive = (item: NavigationItem) => {
    if (item.path) return isActive(item.path)
    return item.children?.some(child => child.path && isActive(child.path)) || false
  }

  const handleExpandClick = (itemText: string) => {
    setExpandedItems(prev => 
      prev.includes(itemText) 
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    )
  }

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    if (!searchQuery) return items
    
    return items.filter(item => {
      const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase())
      const hasMatchingChildren = item.children?.some(child => 
        child.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesSearch || hasMatchingChildren
    })
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.text)
    const active = isParentActive(item)

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            selected={active}
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.text)
              } else if (item.path) {
                handleNavigation(item.path)
              }
            }}
            sx={{
              pl: collapsed ? 1 : 2 + level * 2,
              minHeight: 48,
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
            <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 40 }}>
              <Badge badgeContent={item.badge} color="error">
                {item.icon}
              </Badge>
            </ListItemIcon>
            
            {!collapsed && (
              <>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: level > 0 ? '0.875rem' : '1rem',
                    fontWeight: active ? 600 : 400
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
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
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
          overflowX: 'hidden'
        },
      }}
    >
      <Toolbar>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              AI Content
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
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      
      <List sx={{ flexGrow: 1, px: 1 }}>
        {filterItems(navigationItems).map(item => renderNavigationItem(item))}
      </List>
      
      <Divider />
      
      <List sx={{ px: 1 }}>
        {filterItems(secondaryItems).map(item => renderNavigationItem(item))}
      </List>
    </Drawer>
  )
}

export default Sidebar