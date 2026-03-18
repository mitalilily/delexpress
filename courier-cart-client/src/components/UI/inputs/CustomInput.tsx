import { Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import styles from './CustomInput.module.css'

interface CustomInputProps extends Omit<TextFieldProps, 'variant' | 'prefix' | 'postfix'> {
  label?: string
  placeholder?: string
  prefix?: React.ReactNode
  postfix?: React.ReactNode
  required?: boolean
  width?: string | number
  helpText?: string
  topMargin?: boolean
  maxLength?: number
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      label = '',
      placeholder = '',
      prefix,
      postfix,
      required = false,
      helperText,
      className,
      width = '100%',
      helpText,
      topMargin = true,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const internalRef = useRef<HTMLInputElement>(null)

    const isPasswordType = type === 'password'

    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => {
      if (!internalRef.current?.value) setIsFocused(false)
    }

    useEffect(() => {
      if (value) setIsFocused(true)
    }, [value])

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div
        className={`${styles.inputContainer} ${className ?? ''}`}
        style={{ marginTop: topMargin ? '16px' : '0px' }}
      >
        {label && (
          <Typography
            sx={{ fontSize: '13px', color: '#333369', fontWeight: 500 }}
            mb={0.5}
            className={`${styles.customLabel} ${isFocused ? styles.labelFocused : ''}`}
            onClick={() => internalRef.current?.focus()}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </Typography>
        )}

        <TextField
          type={isPasswordType && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          helperText={helperText}
          fullWidth
          sx={{ width }}
          placeholder={placeholder}
          inputRef={(el) => {
            // assign to both forwardRef and internalRef
            if (typeof ref === 'function') ref(el)
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
            internalRef.current = el
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${styles.textFieldRoot}`}
          slotProps={{
            input: {
              startAdornment: prefix ? (
                <InputAdornment position="start">{prefix}</InputAdornment>
              ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  {isPasswordType ? (
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? (
                        <MdVisibilityOff size={17} color="theme.secondary" />
                      ) : (
                        <MdVisibility size={17} color="theme.secondary" />
                      )}
                    </IconButton>
                  ) : (
                    postfix
                  )}
                </InputAdornment>
              ),
            },
            htmlInput: {
              maxLength: maxLength ?? 100,
              style: { height: 0 },
            },
          }}
          {...props}
        />
        {helpText ? (
          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                color: '#6B7280',
                fontStyle: 'italic',
                textAlign: 'right',
              }}
            >
              {helpText}
            </Typography>
          </Box>
        ) : null}
      </div>
    )
  },
)

CustomInput.displayName = 'CustomInput'

export default CustomInput
