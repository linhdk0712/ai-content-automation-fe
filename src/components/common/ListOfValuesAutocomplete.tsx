import React from 'react'
import {
  Autocomplete,
  TextField,
  Chip,
  Avatar,
  Box,
  CircularProgress,
  Alert,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material'
import { useListOfValues, useDropdownWithListOfValues } from '../../hooks/useListOfValues'
import { ListOfValuesResponse } from '../../services/listOfValues.service'

export interface ListOfValuesAutocompleteProps {
  category: string
  value?: string | string[] | ListOfValuesResponse | ListOfValuesResponse[]
  onChange?: (value: string | string[] | ListOfValuesResponse | ListOfValuesResponse[] | null) => void
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
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  fullWidth?: boolean
  sx?: any
  freeSolo?: boolean
  disableClearable?: boolean
  limitTags?: number
  filterSelectedOptions?: boolean
  renderOption?: (props: any, option: ListOfValuesResponse) => React.ReactNode
  renderTags?: (value: ListOfValuesResponse[], getTagProps: any) => React.ReactNode
  getOptionLabel?: (option: ListOfValuesResponse | string) => string
  isOptionEqualToValue?: (option: ListOfValuesResponse, value: ListOfValuesResponse) => boolean
  groupBy?: (option: ListOfValuesResponse) => string
  returnFullObject?: boolean // Whether to return full object or just value string
}

/**
 * Reusable Autocomplete component that automatically loads options from List of Values API
 */
export const ListOfValuesAutocomplete: React.FC<ListOfValuesAutocompleteProps> = ({
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
  size = 'medium',
  variant = 'outlined',
  fullWidth = true,
  sx,
  freeSolo = false,
  disableClearable = false,
  limitTags = -1,
  filterSelectedOptions = false,
  renderOption,
  renderTags,
  getOptionLabel,
  isOptionEqualToValue,
  groupBy,
  returnFullObject = false,
}) => {
  const { data: values, isLoading, error: queryError } = useListOfValues(category, {
    language,
    includeInactive,
  })

  // Convert value to the format expected by Autocomplete
  const getAutocompleteValue = () => {
    if (!values || !value) return multiple ? [] : null

    if (returnFullObject) {
      // Value is already in the correct format
      return value
    }

    // Convert string values to objects
    if (multiple && Array.isArray(value)) {
      return values.filter(v => (value as string[]).includes(v.value))
    } else if (!multiple && typeof value === 'string') {
      return values.find(v => v.value === value) || null
    }

    return multiple ? [] : null
  }

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: ListOfValuesResponse | ListOfValuesResponse[] | null
  ) => {
    if (!onChange) return

    if (returnFullObject) {
      onChange(newValue)
    } else {
      // Convert back to string values
      if (multiple && Array.isArray(newValue)) {
        onChange(newValue.map(item => item.value))
      } else if (!multiple && newValue) {
        onChange((newValue as ListOfValuesResponse).value)
      } else {
        onChange(multiple ? [] : null)
      }
    }
  }

  const defaultGetOptionLabel = (option: ListOfValuesResponse | string) => {
    if (typeof option === 'string') return option
    return option.displayLabel || option.label || option.value
  }

  const defaultIsOptionEqualToValue = (option: ListOfValuesResponse, value: ListOfValuesResponse) => {
    return option.value === value.value
  }

  const defaultRenderOption = (props: any, option: ListOfValuesResponse) => (
    <MenuItem {...props} key={option.value}>
      {showIcons && option.iconUrl && (
        <ListItemIcon>
          <Avatar src={option.iconUrl} sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={option.displayLabel || option.label}
        secondary={option.description}
      />
    </MenuItem>
  )

  const defaultRenderTags = (value: ListOfValuesResponse[], getTagProps: any) =>
    value.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.value}
        label={option.displayLabel || option.label}
        avatar={showIcons && option.iconUrl ? (
          <Avatar src={option.iconUrl} sx={{ width: 16, height: 16 }} />
        ) : undefined}
        size="small"
      />
    ))

  if (queryError) {
    return (
      <Alert severity="error" sx={sx}>
        Failed to load options: {queryError.message}
      </Alert>
    )
  }

  return (
    <Autocomplete
      options={values || []}
      value={getAutocompleteValue()}
      onChange={handleChange}
      multiple={multiple}
      disabled={disabled || isLoading}
      loading={isLoading}
      freeSolo={freeSolo}
      disableClearable={disableClearable}
      limitTags={limitTags}
      filterSelectedOptions={filterSelectedOptions}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue || defaultIsOptionEqualToValue}
      groupBy={groupBy}
      renderOption={renderOption || defaultRenderOption}
      renderTags={renderTags || defaultRenderTags}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      sx={sx}
    />
  )
}

// Convenience components for specific categories
export const SocialPlatformAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="social-platforms" />
)

export const TemplateCategoryAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="template-categories" />
)

export const ContentTypeAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="content-types" />
)

export const ContentStatusAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="content-statuses" />
)

export const AIProviderAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="ai-providers" />
)

export const LanguageAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="languages" />
)

export const TimezoneAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="timezones" />
)

export const CountryAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="countries" />
)

export const IndustryAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="industries" />
)

export const ToneAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="tones" />
)

export const TargetAudienceAutocomplete: React.FC<Omit<ListOfValuesAutocompleteProps, 'category'>> = (props) => (
  <ListOfValuesAutocomplete {...props} category="target-audiences" />
)

export default ListOfValuesAutocomplete