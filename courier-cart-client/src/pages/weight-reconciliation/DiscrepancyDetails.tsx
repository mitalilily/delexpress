import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { FiArrowLeft, FiDownload } from 'react-icons/fi'
import { RiScales3Line } from 'react-icons/ri'
import { useNavigate, useParams } from 'react-router-dom'
import { useDiscrepancyDetails } from '../../hooks/useWeightReconciliation'

export default function DiscrepancyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useDiscrepancyDetails(id!)

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Discrepancy not found</Alert>
      </Container>
    )
  }

  const { discrepancy, dispute, history } = data
  // Convert grams to kg for display
  const weightDiff = Number(discrepancy.weight_difference) / 1000
  const additionalCharge = Number(discrepancy.additional_charge)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'accepted':
        return 'success'
      case 'disputed':
        return 'info'
      case 'resolved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack gap={3}>
        {/* Header */}
        <Box>
          <Button
            startIcon={<FiArrowLeft />}
            onClick={() => navigate('/reconciliation/weight')}
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              mb: 2,
              '&:hover': { color: '#333369' },
            }}
          >
            Back to Discrepancies
          </Button>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#333369',
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <RiScales3Line size={28} />
                Weight Discrepancy Details
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                Order #{discrepancy.order_number}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Status Card */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Status
                </Typography>
                <Chip
                  label={
                    discrepancy.status === 'resolved'
                      ? discrepancy.has_dispute &&
                        discrepancy.resolution_notes?.includes('rejected')
                        ? 'RESOLVED (DISPUTE REJECTED)'
                        : discrepancy.has_dispute &&
                          discrepancy.resolution_notes?.includes('approved')
                        ? 'RESOLVED (DISPUTE APPROVED)'
                        : 'RESOLVED'
                      : discrepancy.status.toUpperCase()
                  }
                  color={
                    getStatusColor(discrepancy.status) as
                      | 'default'
                      | 'primary'
                      | 'secondary'
                      | 'error'
                      | 'info'
                      | 'success'
                      | 'warning'
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Order Number
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#333369' }}>
                  {discrepancy.order_number}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  AWB Number
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#333369' }}>
                  {discrepancy.awb_number || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Courier
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#333369' }}>
                  {discrepancy.courier_partner || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Weight Comparison */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369', mb: 3 }}>
              Weight Comparison
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Declared Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369' }}>
                  {(Number(discrepancy.declared_weight) / 1000).toFixed(3)} kg
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Actual Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369' }}>
                  {discrepancy.actual_weight
                    ? `${(Number(discrepancy.actual_weight) / 1000).toFixed(3)} kg`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Volumetric Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369' }}>
                  {discrepancy.volumetric_weight
                    ? `${(Number(discrepancy.volumetric_weight) / 1000).toFixed(3)} kg`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Charged Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3498DB' }}>
                  {(Number(discrepancy.charged_weight) / 1000).toFixed(3)} kg
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Weight Difference
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: weightDiff > 0 ? '#E74C3C' : '#27AE60',
                  }}
                >
                  {weightDiff > 0 ? '+' : ''}
                  {weightDiff.toFixed(3)} kg
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Additional Charge
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: additionalCharge > 0 ? '#E74C3C' : '#27AE60',
                  }}
                >
                  ₹{additionalCharge.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Dimensions Comparison (if available) */}
        {(discrepancy.declared_dimensions || discrepancy.actual_dimensions) && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369', mb: 3 }}>
                Dimensions (cm)
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={4}>
                {discrepancy.declared_dimensions && (
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                      Declared
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {discrepancy.declared_dimensions.length} ×{' '}
                      {discrepancy.declared_dimensions.breadth} ×{' '}
                      {discrepancy.declared_dimensions.height}
                    </Typography>
                  </Box>
                )}
                {discrepancy.actual_dimensions && (
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                      Actual (Measured)
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#3498DB' }}>
                      {discrepancy.actual_dimensions.length} ×{' '}
                      {discrepancy.actual_dimensions.breadth} ×{' '}
                      {discrepancy.actual_dimensions.height}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Billing Impact */}
        {(discrepancy.original_shipping_charge || discrepancy.revised_shipping_charge) && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369', mb: 3 }}>
                Billing Impact
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Original Charge
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ₹{Number(discrepancy.original_shipping_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Revised Charge
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#3498DB' }}>
                    ₹{Number(discrepancy.revised_shipping_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Difference
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: additionalCharge > 0 ? '#E74C3C' : '#27AE60',
                    }}
                  >
                    {additionalCharge > 0 ? '+' : ''}₹{additionalCharge.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Resolution Alert (if disputed and resolved) */}
        {discrepancy.status === 'resolved' && discrepancy.has_dispute && dispute && (
          <Alert
            severity={dispute.status === 'approved' ? 'success' : 'warning'}
            sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {dispute.status === 'approved'
                ? '✅ Your dispute was approved'
                : '⚠️ Your dispute was rejected'}
            </Typography>
            {dispute.admin_response && (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
                  Admin Response:
                </Typography>
                <Typography variant="body2">{dispute.admin_response}</Typography>
              </>
            )}
            {discrepancy.resolution_notes && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#6B7280' }}>
                {discrepancy.resolution_notes}
              </Typography>
            )}
          </Alert>
        )}

        {/* Courier Remarks */}
        {discrepancy.courier_remarks && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369', mb: 2 }}>
                Courier Remarks
              </Typography>
              <Typography sx={{ color: '#6B7280' }}>{discrepancy.courier_remarks}</Typography>
              {discrepancy.courier_weight_slip_url && (
                <Button
                  startIcon={<FiDownload />}
                  href={discrepancy.courier_weight_slip_url}
                  target="_blank"
                  sx={{ mt: 2, textTransform: 'none' }}
                >
                  Download Weight Slip
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Existing Dispute */}
        {dispute && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #3498DB' }}>
            <CardContent>
              <Stack gap={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369' }}>
                    Dispute Details
                  </Typography>
                  <Chip label={dispute.status.toUpperCase()} color="info" />
                </Stack>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                    Reason
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{dispute.dispute_reason}</Typography>
                </Box>
                {dispute.customer_comment && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Your Comment
                    </Typography>
                    <Typography>{dispute.customer_comment}</Typography>
                  </Box>
                )}
                {dispute.customer_claimed_weight && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Proposed Weight
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {(Number(dispute.customer_claimed_weight) / 1000).toFixed(3)} kg
                    </Typography>
                  </Box>
                )}
                {dispute.admin_response && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Admin Response
                    </Typography>
                    <Alert severity="info">{dispute.admin_response}</Alert>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Activity History */}
        {history && history.length > 0 && (
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#333369', mb: 3 }}>
                Activity History
              </Typography>
              <Stack gap={2}>
                {history.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      bgcolor: '#F9FAFB',
                      borderLeft: '3px solid #333369',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography sx={{ fontWeight: 600, color: '#333369' }}>
                        {item.action_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    {item.notes && (
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
