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
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
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
  }, [value, selectedValue, setSelectedValue])

  // Notify parent of changes
  React.useEffect(() => {
    if (onChange && selectedValue !== value) {
      onChange(selectedValue)
    }
  }, [selectedValue, onChange, value])

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const newValue = event.target.value
    setSelectedValue(newValue)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const defaultRenderValue = (selected: string | string[]) => {
    if (!values) return ''

    if (multiple && Array.isArray(selected)) {
      if (selected.length === 0) return placeholder || ''
      
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((val) => {
            const item = values.find(v => v.value === val)
            return (
              <Chip
                key={val}
                label={item?.displayLabel || item?.label || val}
                size="small"
                avatar={showIcons && item?.iconUrl ? (
                  <Avatar src={item.iconUrl} sx={{ width: 16, height: 16 }} />
                ) : undefined}
              />
            )
          })}
        </Box>
      )
    } else {
      const item = values.find(v => v.value === selected)
      return item?.displayLabel || item?.label || selected || placeholder || ''
    }
  }

  const defaultRenderOption = (option: ListOfValuesResponse) => (
    <>
      {showIcons && option.iconUrl && (
        <ListItemIcon>
          <Avatar src={option.iconUrl} sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={option.displayLabel || option.label}
        secondary={option.description}
      />
    </>
  )

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
      sx={sx}
    >
      {label && <InputLabel>{label}</InputLabel>}
      
      {showSearch && (
        <TextField
          placeholder="Search options..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
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
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        {placeholder && !multiple && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}

        {isLoading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Loading options...
            </Box>
          </MenuItem>
        ) : (
          values?.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={!option.active}
            >
              {renderOption ? renderOption(option) : defaultRenderOption(option)}
            </MenuItem>
          ))
        )}
      </Select>

      {helperText && (
        <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </Box>
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