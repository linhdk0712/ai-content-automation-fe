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

const drawerWidth = 240
const collapsedWidth = 56

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path?: string
  children?: NavigationItem[]
  badge?: number
  role?: string[]
  enabled?: boolean // Thêm thuộc tính để bật/tắt menu
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', enabled: true },
  {
    text: 'Content',
    icon: <CreateIcon />,
    enabled: true, // Đã triển khai
    children: [
      { text: 'Create Content', icon: <AutoAwesome />, path: '/content/create', enabled: true },
      { text: 'Content Library', icon: <Description />, path: '/content/library', enabled: true },
      { text: 'Templates', icon: <Description />, path: '/templates', enabled: true },
      { text: 'Version History', icon: <History />, path: '/content/versions', enabled: false },
      { text: 'Workflow', icon: <Group />, path: '/content/workflow', enabled: false },
      { text: 'Export', icon: <CloudUpload />, path: '/content/export', enabled: false }
    ]
  },
  {
    text: 'Social Media',
    icon: <Share />,
    enabled: false, // Chưa triển khai - ẩn toàn bộ menu này
    children: [
      { text: 'Accounts', icon: <AccountCircle />, path: '/social/accounts', enabled: false },
      { text: 'Publishing Queue', icon: <Schedule />, path: '/social/queue', badge: 5, enabled: false },
      { text: 'Calendar', icon: <CalendarToday />, path: '/social/calendar', enabled: false },
      { text: 'Analytics', icon: <TrendingUp />, path: '/social/analytics', enabled: false },
      { text: 'Platform Settings', icon: <Settings />, path: '/social/settings', enabled: false },
      { text: 'Content Optimization', icon: <BarChart />, path: '/social/optimization', enabled: false }
    ]
  },
  {
    text: 'Media & Assets',
    icon: <Image />,
    enabled: false, // Chưa triển khai - ẩn toàn bộ menu này
    children: [
      { text: 'Media Library', icon: <Folder />, path: '/media/library', enabled: false },
      { text: 'Image Generator', icon: <Palette />, path: '/media/generator', enabled: false },
      { text: 'Brand Kit', icon: <Palette />, path: '/media/brandkit', enabled: false },
      { text: 'Asset Editor', icon: <Image />, path: '/media/editor', enabled: false },
      { text: 'Video Processor', icon: <VideoFile />, path: '/media/video', enabled: false },
      { text: 'Asset Analytics', icon: <AnalyticsIcon />, path: '/media/analytics', enabled: false }
    ]
  },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', enabled: false }, // Chưa triển khai
  { text: 'Team', icon: <Group />, path: '/team', role: ['admin', 'manager'], enabled: false } // Chưa triển khai
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

  const [expandedItems, setExpandedItems] = useState<string[]>(['Content'])
  const [searchQuery, setSearchQuery] = useState('')

  const handleNavigation = (path: string) => {
    navigate(path)
    // Close mobile drawer when navigating
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

  const handleExpandClick = (itemText: string) => {
    setExpandedItems(prev =>
      prev.includes(itemText)
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    )
  }

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    // Lọc theo enabled trước
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
              AI Content Pro
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
            placeholder="Search..."
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
        {filterItems(navigationItems).map(item => renderNavigationItem(item))}
      </List>

      <Divider />

      <List sx={{ px: 0.5 }}>
        {filterItems(secondaryItems).map(item => renderNavigationItem(item))}
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
          keepMounted: true, // Better open performance on mobile.
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

      {/* Desktop drawer - Fixed position to not affect main content layout */}
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