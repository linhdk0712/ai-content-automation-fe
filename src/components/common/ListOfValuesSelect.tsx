import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Avatar,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  SelectChangeEvent,
  Typography,
  Divider,
} from '@mui/material'
import { 
  Search as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { useListOfValues, useDropdownWithListOfValues } from '../../hooks/useListOfValues'
import { ListOfValuesResponse } from '../../services/listOfValues.service'

export interface ListOfValuesSelectProps {
  category: string
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  label?: string
  placeholder?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  language?: string
  includeInactive?: boolean
  showIcons?: boolean
  showSearch?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  fullWidth?: boolean
  sx?: any
  renderValue?: (selected: string | string[]) => React.ReactNode
  renderOption?: (option: ListOfValuesResponse) => React.ReactNode
}

/**
 * Reusable Select component that automatically loads options from List of Values API
 */
export const ListOfValuesSelect: React.FC<ListOfValuesSelectProps> = ({
  category,
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  required = false,
  disabled = false,
  error = false,
  helperText,
  language = 'vi',
  includeInactive = false,
  showIcons = true,
  showSearch = false,
  size = 'medium',
  variant = 'outlined',
  fullWidth = true,
  sx,
  renderValue,
  renderOption,
}) => {
  const {
    values,
    selectedValue,
    selectedItems,
    searchQuery,
    isLoading,
    error: queryError,
    setSelectedValue,
    setSearchQuery,
  } = useDropdownWithListOfValues(category, {
    language,
    includeInactive,
    defaultValue: Array.isArray(value) ? value[0] : value,
    multiple,
  })

  // Sync external value changes
  React.useEffect(() => {
    if (value !== undefined && value !== selectedValue) {
      setSelectedValue(value)
    }
  }, [value, setSelectedValue])

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const newValue = event.target.value
    setSelectedValue(newValue)
    
    // Only notify parent when user actually changes the value
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const defaultRenderValue = (selected: string | string[]) => {
    if (!values) return ''

    if (multiple && Array.isArray(selected)) {
      if (selected.length === 0) {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {placeholder || 'Select options...'}
          </Typography>
        )
      }
      
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((val) => {
            const item = values.find(v => v.value === val)
            return (
              <Chip
                key={val}
                label={item?.displayLabel || item?.label || val}
                size="small"
                color="primary"
                variant="filled"
                avatar={showIcons && item?.iconUrl ? (
                  <Avatar src={item.iconUrl} sx={{ width: 16, height: 16 }} />
                ) : undefined}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 500,
                  '& .MuiChip-avatar': {
                    marginLeft: 0.5
                  }
                }}
              />
            )
          })}
        </Box>
      )
    } else {
      if (!selected) {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {placeholder || 'Select an option...'}
          </Typography>
        )
      }
      
      const item = values.find(v => v.value === selected)
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showIcons && item?.iconUrl && (
            <Avatar src={item.iconUrl} sx={{ width: 20, height: 20 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {item?.displayLabel || item?.label || selected}
          </Typography>
        </Box>
      )
    }
  }

  const defaultRenderOption = (option: ListOfValuesResponse) => {
    const isSelected = multiple 
      ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
      : selectedValue === option.value

    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        py: 0.5,
        gap: 1.5
      }}>
        {showIcons && option.iconUrl && (
          <Avatar 
            src={option.iconUrl} 
            sx={{ 
              width: 28, 
              height: 28,
              border: '2px solid',
              borderColor: isSelected ? 'primary.main' : 'transparent'
            }} 
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: isSelected ? 600 : 500,
              color: isSelected ? 'primary.main' : 'text.primary',
              mb: option.description ? 0.25 : 0
            }}
          >
            {option.displayLabel || option.label}
          </Typography>
          {option.description && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {option.description}
            </Typography>
          )}
        </Box>
        {isSelected && (
          <CheckIcon 
            sx={{ 
              color: 'primary.main',
              fontSize: 20
            }} 
          />
        )}
      </Box>
    )
  }

  if (queryError) {
    return (
      <Alert severity="error" sx={sx}>
        Failed to load options: {queryError.message}
      </Alert>
    )
  }

  return (
    <FormControl
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      required={required}
      error={error}
      disabled={disabled || isLoading}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'action.hover',
          },
          '&.Mui-focused': {
            backgroundColor: 'background.paper',
            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
          },
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          fontSize: '0.8rem',
          transform: 'translate(14px, 16px) scale(1)',
          '&.MuiInputLabel-shrink': {
            fontSize: '0.75rem',
            transform: 'translate(14px, -9px) scale(0.75)',
          },
          '&.Mui-focused': {
            color: 'primary.main',
          },
        },
        ...sx
      }}
    >
      {label && (
        <InputLabel 
          sx={{ 
            fontWeight: 500,
            fontSize: '0.8rem',
            '&.MuiInputLabel-shrink': {
              fontSize: '0.75rem',
            }
          }}
        >
          {label}
        </InputLabel>
      )}
      
      {showSearch && (
        <TextField
          placeholder="Search options..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ 
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: 'grey.50',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Select
        value={selectedValue}
        onChange={handleChange}
        multiple={multiple}
        displayEmpty
        renderValue={renderValue || defaultRenderValue}
        IconComponent={ArrowDownIcon}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
              mt: 0.5,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 0.5,
                my: 0.25,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  },
                },
              },
            },
            style: {
              maxHeight: 320,
            },
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        }}
        sx={{
          '& .MuiSelect-icon': {
            color: 'text.secondary',
            transition: 'transform 0.2s ease-in-out',
          },
          '&.Mui-focused .MuiSelect-icon': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {isLoading ? (
          <MenuItem disabled>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              py: 1,
              width: '100%',
              justifyContent: 'center'
            }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading options...
              </Typography>
            </Box>
          </MenuItem>
        ) : values && values.length > 0 ? (
          values.map((option, index) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={!option.active}
              sx={{
                opacity: option.active ? 1 : 0.5,
                minHeight: option.description ? 56 : 40,
              }}
            >
              {renderOption ? renderOption(option) : defaultRenderOption(option)}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 2,
              width: '100%'
            }}>
              <Typography variant="body2" color="text.secondary">
                No options available
              </Typography>
            </Box>
          </MenuItem>
        )}
      </Select>

      {helperText && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.75, 
            ml: 1.75,
            color: error ? 'error.main' : 'text.secondary',
            fontWeight: 400
          }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
  )
}

// Convenience components for specific categories
export const SocialPlatformSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="social-platforms" />
)

export const TemplateCategorySelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="template-categories" />
)

export const ContentTypeSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="content-types" />
)

export const ContentStatusSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="content-statuses" />
)

export const AIProviderSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="ai-providers" />
)

export const LanguageSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="languages" />
)

export const TimezoneSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="timezones" />
)

export const CountrySelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="countries" />
)

export const IndustrySelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="industries" />
)

export const ToneSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="tones" />
)

export const TargetAudienceSelect: React.FC<Omit<ListOfValuesSelectProps, 'category'>> = (props) => (
  <ListOfValuesSelect {...props} category="target-audiences" />
)

export default ListOfValuesSelect