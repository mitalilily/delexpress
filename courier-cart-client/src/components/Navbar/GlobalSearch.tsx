import {
  alpha,
  Box,
  CircularProgress,
  ClickAwayListener,
  Grow,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React, { useRef, useState, type KeyboardEvent } from 'react'
import { CiSearch } from 'react-icons/ci'
import { useNavigate } from 'react-router-dom'
import type { GlobalSearchResult } from '../../api/globalSearch.api'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'

const DE_BLUE = '#8A1F43'

const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [popperReady, setPopperReady] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const shouldSearch = open && searchQuery.trim().length >= 2
  const { data: searchResults, isLoading, isFetching } = useGlobalSearch(searchQuery, shouldSearch)

  // Delay popper rendering to ensure DOM is ready
  React.useEffect(() => {
    if (open && anchorRef.current) {
      // Small delay to ensure DOM is ready before transition
      const timer = setTimeout(() => {
        setPopperReady(true)
      }, 10)
      return () => {
        clearTimeout(timer)
        setPopperReady(false)
      }
    } else {
      setPopperReady(false)
    }
  }, [open])

  const handleClickAway = () => {
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    // Keep dropdown open when typing
    if (value.trim().length >= 2 || open) {
      setOpen(true)
    }
  }

  const handleResultClick = (result: GlobalSearchResult) => {
    // If result has AWB in metadata, navigate to tracking page
    const awb = result.metadata?.awb
    if (typeof awb === 'string' && awb && result.type === 'order') {
      navigate(`/tracking?awb=${encodeURIComponent(awb)}`)
    } else {
      navigate(result.link)
    }
    setSearchQuery('')
    setOpen(false)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedQuery = searchQuery.trim()
      if (!trimmedQuery) return

      // If it looks like an AWB number, navigate to tracking
      if (trimmedQuery.length >= 8 && /^[A-Z0-9]+$/.test(trimmedQuery.toUpperCase())) {
        navigate(`/tracking?awb=${encodeURIComponent(trimmedQuery.toUpperCase())}`)
      } else if (searchResults?.results && searchResults.results.length > 0) {
        // Navigate to first result
        handleResultClick(searchResults.results[0])
      } else {
        // Fallback to orders list search
        navigate(`/orders/list?search=${encodeURIComponent(trimmedQuery)}`)
      }
      setSearchQuery('')
      setOpen(false)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order: 'Order',
      invoice: 'Invoice',
      ndr: 'NDR',
      rto: 'RTO',
      weight_discrepancy: 'Weight Discrepancy',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order: DE_BLUE,
      invoice: '#56C0A5',
      ndr: '#C4893A',
      rto: '#DE350B',
      weight_discrepancy: '#42526E',
    }
    return colors[type] || '#42526E'
  }

  return (
    <Box sx={{ position: 'relative', width: { xs: '100%', sm: '360px', md: '520px' } }}>
      <div ref={anchorRef}>
        <TextField
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            setOpen(true)
          }}
          placeholder="Search by Order ID, Order Number, AWB, Invoice..."
          size="small"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(DE_BLUE, 0.04),
              borderRadius: 1,
              border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover': {
                bgcolor: alpha(DE_BLUE, 0.06),
                borderColor: alpha(DE_BLUE, 0.3),
              },
              '&.Mui-focused': {
                bgcolor: '#ffffff',
                borderColor: DE_BLUE,
                boxShadow: `0 0 0 3px ${alpha(DE_BLUE, 0.1)}`,
              },
            },
            '& .MuiOutlinedInput-input': {
              py: 1.25,
              fontSize: '14px',
              color: '#172B4D',
              '&::placeholder': {
                color: alpha('#172B4D', 0.5),
                opacity: 1,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isLoading || isFetching ? (
                  <CircularProgress size={20} sx={{ color: DE_BLUE }} />
                ) : (
                  <IconButton
                    onClick={() => {
                      const trimmedQuery = searchQuery.trim()
                      if (
                        trimmedQuery.length >= 8 &&
                        /^[A-Z0-9]+$/.test(trimmedQuery.toUpperCase())
                      ) {
                        navigate(`/tracking?awb=${encodeURIComponent(trimmedQuery.toUpperCase())}`)
                      } else if (searchResults?.results && searchResults.results.length > 0) {
                        handleResultClick(searchResults.results[0])
                      } else {
                        navigate(`/orders/list?search=${encodeURIComponent(trimmedQuery)}`)
                      }
                      setSearchQuery('')
                      setOpen(false)
                    }}
                    edge="end"
                    sx={{
                      color: DE_BLUE,
                      '&:hover': {
                        bgcolor: alpha(DE_BLUE, 0.1),
                        color: DE_BLUE,
                      },
                    }}
                  >
                    <CiSearch size={20} />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
      </div>

      <Popper
        open={popperReady && shouldSearch}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        sx={{
          zIndex: 2200,
          width: anchorRef.current?.offsetWidth,
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
            <Box>
              <ClickAwayListener onClickAway={handleClickAway}>
                <Paper
                  elevation={0}
                  sx={{
                    mt: 1,
                    borderRadius: 1,
                    bgcolor: '#ffffff',
                    border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
                    boxShadow: `0 12px 32px ${alpha('#172B4D', 0.1)}`,
                    overflow: 'hidden',
                    maxHeight: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ p: 1.5, bgcolor: alpha(DE_BLUE, 0.02) }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: alpha('#172B4D', 0.5),
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {isFetching ? 'Refreshing Network...' : 'Global Results'}
                    </Typography>
                  </Box>

                  <List sx={{ p: 0.5, overflowY: 'auto' }}>
                    {searchResults?.results?.length === 0 ? (
                      <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          No matches found for "{searchQuery}"
                        </Typography>
                      </ListItem>
                    ) : (
                      searchResults?.results?.map((result, idx) => (
                        <ListItemButton
                          key={`${result.type}-${idx}`}
                          onClick={() => handleResultClick(result)}
                          sx={{
                            borderRadius: 1,
                            py: 1.25,
                            px: 1.5,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: alpha(DE_BLUE, 0.05),
                              '& .MuiListItemText-primary': { color: DE_BLUE },
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    px: 0.8,
                                    py: 0.2,
                                    borderRadius: 0.5,
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    bgcolor: alpha(getTypeColor(result.type), 0.1),
                                    color: getTypeColor(result.type),
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {getTypeLabel(result.type)}
                                </Box>
                                <Typography variant="body2" fontWeight={700}>
                                  {result.title}
                                </Typography>
                              </Stack>
                            }
                            secondary={result.subtitle}
                            primaryTypographyProps={{
                              component: 'div',
                            }}
                            secondaryTypographyProps={{
                              fontSize: '12px',
                              fontWeight: 500,
                              noWrap: true,
                              sx: { mt: 0.5 },
                            }}
                          />
                        </ListItemButton>
                      ))
                    )}
                  </List>
                </Paper>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

export default GlobalSearch
