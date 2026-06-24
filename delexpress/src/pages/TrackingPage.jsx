import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchTracking } from '../utils/trackingApi'

const DE_BLUE = '#7696AC'
const BACKGROUND = '#F7F4F1'
const trackingModes = [
  { value: 'awb', label: 'Track by AWB' },
  { value: 'order', label: 'Track by Order ID' },
]

const statusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('deliver')) return { bg: '#E7F8EE', color: '#166534' }
  if (normalized.includes('cancel')) return { bg: '#FDECEC', color: '#B42318' }
  if (normalized.includes('rto')) return { bg: '#FFF4E5', color: '#B54708' }
  if (normalized.includes('out for delivery')) return { bg: '#E9F2F7', color: '#2C5B78' }
  return { bg: '#EEF3F6', color: '#365368' }
}

function readQueryState() {
  const search = new URLSearchParams(window.location.search)
  const awb = search.get('awb') || ''
  const orderNumber = search.get('orderNumber') || ''
  const contact = search.get('contact') || ''

  return {
    mode: awb ? 'awb' : 'order',
    form: {
      awb,
      orderNumber,
      contact,
    },
    shouldAutoTrack: Boolean(awb || (orderNumber && contact)),
  }
}

function formatEventDate(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return 'Update received'
  return parsed.toLocaleString()
}

export default function TrackingPage() {
  const initialState = useMemo(() => readQueryState(), [])
  const [mode, setMode] = useState(initialState.mode)
  const [form, setForm] = useState(initialState.form)
  const [tracking, setTracking] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef(null)

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact.trim())
  const isPhone = /^[0-9+\-\s()]{7,}$/.test(form.contact.trim())
  const isContactValid = !form.contact.trim() || isEmail || isPhone
  const canSubmit =
    mode === 'awb'
      ? form.awb.trim().length > 3
      : form.orderNumber.trim().length > 2 && form.contact.trim().length > 3 && isContactValid

  const sortedHistory = useMemo(() => {
    if (!Array.isArray(tracking?.history)) return []
    return [...tracking.history].sort(
      (left, right) => new Date(right.event_time).getTime() - new Date(left.event_time).getTime(),
    )
  }, [tracking])

  const runTracking = async (params, replaceHistory = false) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setError('')

    try {
      const result = await fetchTracking(params, controller.signal)
      setTracking(result)

      const nextUrl = new URL(window.location.href)
      nextUrl.search = ''
      Object.entries(params).forEach(([key, value]) => {
        const normalized = String(value || '').trim()
        if (normalized) nextUrl.searchParams.set(key, normalized)
      })
      window.history[replaceHistory ? 'replaceState' : 'pushState']({}, '', nextUrl.toString())
    } catch (err) {
      if (err?.name === 'AbortError') return
      setTracking(null)
      setError(err?.message || 'Unable to fetch tracking details right now.')
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!initialState.shouldAutoTrack) return

    const params =
      initialState.mode === 'awb'
        ? { awb: initialState.form.awb.trim() }
        : {
            orderNumber: initialState.form.orderNumber.trim(),
            contact: initialState.form.contact.trim(),
          }

    runTracking(params, true)

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [initialState])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const params =
      mode === 'awb'
        ? { awb: form.awb.trim() }
        : {
            orderNumber: form.orderNumber.trim(),
            contact: form.contact.trim(),
          }

    await runTracking(params)
  }

  const handleReset = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    setTracking(null)
    setError('')
    setIsLoading(false)
    setMode('awb')
    setForm({ awb: '', orderNumber: '', contact: '' })
    window.history.pushState({}, '', window.location.pathname)
  }

  const tone = statusTone(tracking?.status)

  return (
    <Box sx={{ backgroundColor: BACKGROUND, py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: '28px',
              border: '1px solid rgba(118, 150, 172, 0.14)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(238,243,246,0.96) 100%)',
            }}
          >
            <Stack spacing={1.5}>
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#6F8899',
                }}
              >
                Public Tracking
              </Typography>
              <Typography variant="h2" className="brand-heading text-4xl sm:text-5xl">
                Track any shipment without logging in
              </Typography>
              <Typography sx={{ maxWidth: 760, color: '#5E5860', lineHeight: 1.8 }}>
                Enter your AWB number, or use your order ID plus the delivery contact used when the
                order was created. We&apos;ll pull the latest live tracking updates from ExpressoPro.
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                  {trackingModes.map((item) => {
                    const selected = mode === item.value
                    return (
                      <Button
                        key={item.value}
                        type="button"
                        variant={selected ? 'contained' : 'outlined'}
                        onClick={() => {
                          setMode(item.value)
                          setTracking(null)
                          setError('')
                        }}
                        sx={{
                          borderRadius: '999px',
                          px: 2.6,
                          py: 1.1,
                          justifyContent: 'flex-start',
                          backgroundColor: selected ? '#132436' : '#FFFFFF',
                          color: selected ? '#FFFFFF' : '#22303B',
                          borderColor: 'rgba(118, 150, 172, 0.2)',
                          '&:hover': {
                            backgroundColor: selected ? '#1D3044' : alpha('#7696AC', 0.08),
                            borderColor: 'rgba(118, 150, 172, 0.24)',
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </Stack>

                {mode === 'awb' ? (
                  <TextField
                    label="AWB Number"
                    placeholder="e.g. 1234567890"
                    value={form.awb}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, awb: event.target.value }))
                    }
                    fullWidth
                  />
                ) : (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Order ID"
                        placeholder="e.g. ORD-2025-0001"
                        value={form.orderNumber}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, orderNumber: event.target.value }))
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Email or Phone"
                        placeholder="Contact used for the order"
                        value={form.contact}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, contact: event.target.value }))
                        }
                        error={Boolean(form.contact.trim()) && !isContactValid}
                        helperText={
                          Boolean(form.contact.trim()) && !isContactValid
                            ? 'Enter a valid email address or phone number.'
                            : ' '
                        }
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                )}

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit || isLoading}
                    startIcon={<SearchRoundedIcon />}
                    sx={{
                      borderRadius: '999px',
                      px: 3.2,
                      py: 1.25,
                      backgroundColor: '#132436',
                      '&:hover': { backgroundColor: '#1D3044' },
                    }}
                  >
                    {isLoading ? 'Tracking...' : 'Track Shipment'}
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={handleReset}
                    sx={{ borderRadius: '999px', px: 2.2, color: '#5C6570' }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>

          {tracking ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    border: '1px solid rgba(118, 150, 172, 0.14)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Stack spacing={2.4}>
                    <div>
                      <Typography variant="body2" sx={{ color: '#68727B' }}>
                        Shipment Status
                      </Typography>
                      <Chip
                        label={tracking.status || 'Unknown'}
                        sx={{
                          mt: 1.2,
                          backgroundColor: tone.bg,
                          color: tone.color,
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <Divider />

                    {[
                      ['AWB Number', tracking.awb_number || '-'],
                      ['Order Number', tracking.order_number || '-'],
                      ['Courier', tracking.courier_name || '-'],
                      ['Payment Type', tracking.payment_type || '-'],
                      [
                        'Estimated Delivery',
                        tracking.edd ? new Date(tracking.edd).toLocaleDateString() : '-',
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <Typography variant="body2" sx={{ color: '#68727B' }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontWeight: 700, color: '#1B1F23' }}>
                          {value}
                        </Typography>
                      </div>
                    ))}

                    {tracking.shipment_info ? (
                      <>
                        <Divider />
                        <div>
                          <Typography variant="body2" sx={{ color: '#68727B' }}>
                            Shipment Info
                          </Typography>
                          <Typography sx={{ mt: 0.5, color: '#38424A', lineHeight: 1.7 }}>
                            {tracking.shipment_info}
                          </Typography>
                        </div>
                      </>
                    ) : null}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: '24px',
                    border: '1px solid rgba(118, 150, 172, 0.14)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1E22' }}>
                    Tracking Timeline
                  </Typography>

                  {sortedHistory.length ? (
                    <Stack spacing={0} sx={{ mt: 3 }}>
                      {sortedHistory.map((event, index) => (
                        <Box key={`${event.event_time || event.status_code}-${index}`}>
                          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 2.2 }}>
                            <Box
                              sx={{
                                mt: 0.7,
                                height: 12,
                                width: 12,
                                borderRadius: '999px',
                                backgroundColor: index === 0 ? '#132436' : '#BCD0DB',
                                flexShrink: 0,
                              }}
                            />
                            <Stack spacing={0.6} sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, color: '#1B1F23' }}>
                                {event.message || event.status_code || 'Tracking update'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5D6973' }}>
                                {event.location || 'Location update unavailable'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#80909D' }}>
                                {formatEventDate(event.event_time)}
                              </Typography>
                            </Stack>
                          </Stack>
                          {index < sortedHistory.length - 1 ? <Divider /> : null}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ mt: 3, color: '#5D6973' }}>
                      Tracking is available, but the courier has not posted any events yet.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          ) : null}
        </Stack>
      </Container>
    </Box>
  )
}
