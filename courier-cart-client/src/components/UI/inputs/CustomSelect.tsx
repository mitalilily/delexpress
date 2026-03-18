import {
  Box,
  ClickAwayListener,
  Grow,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
} from '@mui/material'
import React, { useMemo, useRef, useState } from 'react'
import { MdArrowDropDown } from 'react-icons/md'
import CustomInput from './CustomInput'

interface DropdownItem {
  key: string | boolean
  label: string
  description?: string
  icon?: React.ElementType
}

interface DropdownMenuProps {
  label: string
  items: DropdownItem[]
  onSelect: (key: string | boolean) => void
  value?: string | boolean
  width?: number | string
  required?: boolean
  placeholder?: string
  inputValue?: string
  helperText?: string
  onInputChange?: (val: string) => void
  error?: boolean
  topMargin?: boolean
  searchable?: boolean // 🔍 new prop
}

export default function CustomSelect({
  label,
  items,
  onSelect,
  value,
  placeholder,
  required,
  topMargin = true,
  helperText,
  error,
  searchable = true,
}: DropdownMenuProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedItem = items.find((item) => item?.key === value)

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleClose = (event?: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      event?.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return // Don't close if clicking inside input
    }
    setOpen(false)
  }

  const handleSelect = (key: string | boolean, label: string) => {
    onSelect(key)
    setSearch(label) // show label in input
    setOpen(false)
  }

  // 🔍 Filter items
  const filteredItems = useMemo(() => {
    if (!searchable || !search) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [items, search, searchable])

  return (
    <Box>
      <div ref={anchorRef}>
        <CustomInput
          fullWidth
          required={required}
          topMargin={topMargin}
          error={error}
          label={label}
          value={search || selectedItem?.label || placeholder || ''}
          onClick={handleToggle}
          onChange={(e) => {
            if (searchable) {
              setSearch(e.target.value)
              if (!open) setOpen(true) // auto-open when typing
            }
          }}
          postfix={<MdArrowDropDown />}
        />
      </div>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
            <Box>
              {open && (
                <ClickAwayListener onClickAway={handleClose}>
                  <Paper
                    elevation={8}
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E0E6ED',
                      boxShadow: '0 4px 20px rgba(51, 51, 105, 0.12)',
                      width: anchorRef.current
                        ? anchorRef.current.getBoundingClientRect().width
                        : '100%',
                      maxHeight: 320,
                      overflowY: 'auto',
                      mt: 0.5,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#F5F7FA',
                        borderRadius: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#CBD5E0',
                        borderRadius: '8px',
                        '&:hover': {
                          background: '#A0AEC0',
                        },
                      },
                    }}
                  >
                    <List dense disablePadding sx={{ py: 0.5 }}>
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <ListItemButton
                            key={String(item.key)}
                            selected={value === item.key}
                            onClick={() => handleSelect(item.key, item.label)}
                            sx={{
                              mx: 0.5,
                              my: 0.25,
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(51, 51, 105, 0.06)',
                                transform: 'translateX(2px)',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(51, 51, 105, 0.08)',
                                borderLeft: '3px solid #333369',
                                '&:hover': {
                                  bgcolor: 'rgba(51, 51, 105, 0.12)',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: '#333369',
                                },
                                '& .MuiListItemText-primary': {
                                  color: '#333369',
                                  fontWeight: 600,
                                },
                              },
                            }}
                          >
                            {item.icon && (
                              <ListItemIcon
                                sx={{
                                  color: '#4A5568',
                                  minWidth: 36,
                                }}
                              >
                                {React.createElement(item.icon, { size: 20 })}
                              </ListItemIcon>
                            )}
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: '#1A1A1A',
                                  }}
                                >
                                  {item.label}
                                </Typography>
                              }
                              secondary={
                                item.description ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#4A5568',
                                      fontSize: '0.75rem',
                                      display: 'block',
                                      mt: 0.25,
                                    }}
                                  >
                                    {item.description}
                                  </Typography>
                                ) : null
                              }
                            />
                          </ListItemButton>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#A0AEC0',
                              fontWeight: 500,
                            }}
                          >
                            No results found
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Grow>
        )}
      </Popper>

      {helperText ? (
        <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic' }}
          >
            {helperText}
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}
