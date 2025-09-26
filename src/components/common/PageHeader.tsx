import React from 'react'
import { Box, Typography, Breadcrumbs, Link, useTheme, useMediaQuery } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  centered?: boolean
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  centered = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      sx={{
        width: '100%',
        mb: { xs: 4, md: 5 },
        textAlign: centered ? 'center' : 'left',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{
            mb: 3,
            justifyContent: centered ? 'center' : 'flex-start',
            '& .MuiBreadcrumbs-ol': {
              justifyContent: centered ? 'center' : 'flex-start',
            },
          }}
        >
          {breadcrumbs.map((item, index) => (
            <Link
              key={index}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
              href={item.href}
              onClick={item.onClick}
              sx={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                cursor: item.href || item.onClick ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: item.href || item.onClick ? 'underline' : 'none',
                },
              }}
            >
              {item.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: centered ? 'center' : 'flex-start' },
          justifyContent: 'space-between',
          gap: 3,
          textAlign: { xs: 'center', sm: centered ? 'center' : 'left' },
        }}
      >
        {/* Title and Subtitle */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: subtitle ? 1 : 0,
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.5,
                maxWidth: centered ? 600 : 'none',
                mx: centered ? 'auto' : 0,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              alignItems: 'center',
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default PageHeader