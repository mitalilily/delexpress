import EastRoundedIcon from '@mui/icons-material/EastRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Button, Chip, Container, TextField, Typography } from '@mui/material'
import { clientAppUrl } from '../../utils/landingContent'
import { fadeUp, MotionDiv, SectionHeader } from './LandingPrimitives'

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 'Rs --'
  return `Rs ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
}

function resolveCourierPrice(courier) {
  return Number(courier?.rate ?? courier?.courier_cost_estimate ?? 0)
}

export default function CalculatorSection({
  errorMessage,
  hasCheckedRates,
  hasValidPincodes,
  isLoading,
  onCalculate,
  onFieldChange,
  pincodeLookup,
  rateSummary,
  rateOptions,
  shippingForm,
  weightBreakdown,
}) {
  const hasMinimumInputs =
    shippingForm.packageWeight &&
    shippingForm.pickupPincode &&
    shippingForm.deliveryPincode &&
    shippingForm.orderAmount &&
    hasValidPincodes

  const topOptions = rateOptions.slice(0, 4)

  return (
    <section id="calculator" className="py-14 sm:py-18">
      <Container maxWidth="xl">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <MotionDiv {...fadeUp} className="calculator-shell rounded-[36px] p-5 sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Shipping Calculator"
              title="Check rates "
              description="Enter package details and fetch courier options directly from the guest calculator endpoint."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <TextField
                fullWidth
                label="Package Weight (kg)"
                type="number"
                value={shippingForm.packageWeight}
                onChange={onFieldChange('packageWeight')}
                placeholder="0.5"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: '0.1' }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                }}
              />
              <TextField
                fullWidth
                label="Order Amount"
                type="number"
                value={shippingForm.orderAmount}
                onChange={onFieldChange('orderAmount')}
                placeholder="999"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 1, step: '1' }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                }}
              />
              <TextField
                fullWidth
                label="Pickup Pincode"
                value={shippingForm.pickupPincode}
                onChange={onFieldChange('pickupPincode')}
                placeholder="110001"
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                error={Boolean(pincodeLookup.pickup.error)}
                helperText={
                  pincodeLookup.pickup.isLoading
                    ? 'Checking location...'
                    : pincodeLookup.pickup.error ||
                      (pincodeLookup.pickup.location
                        ? `${pincodeLookup.pickup.location.city}, ${pincodeLookup.pickup.location.state}`
                        : ' ')
                }
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                  '& .MuiFormHelperText-root': {
                    minHeight: '1.45rem',
                    marginLeft: '0.15rem',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Delivery Pincode"
                value={shippingForm.deliveryPincode}
                onChange={onFieldChange('deliveryPincode')}
                placeholder="400001"
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                error={Boolean(pincodeLookup.delivery.error)}
                helperText={
                  pincodeLookup.delivery.isLoading
                    ? 'Checking location...'
                    : pincodeLookup.delivery.error ||
                      (pincodeLookup.delivery.location
                        ? `${pincodeLookup.delivery.location.city}, ${pincodeLookup.delivery.location.state}`
                        : ' ')
                }
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                  '& .MuiFormHelperText-root': {
                    minHeight: '1.45rem',
                    marginLeft: '0.15rem',
                  },
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                fullWidth
                label="Length (cm)"
                type="number"
                value={shippingForm.length}
                onChange={onFieldChange('length')}
                placeholder="10"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: '1' }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                }}
              />
              <TextField
                fullWidth
                label="Breadth (cm)"
                type="number"
                value={shippingForm.breadth}
                onChange={onFieldChange('breadth')}
                placeholder="10"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: '1' }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                }}
              />
              <TextField
                fullWidth
                label="Height (cm)"
                type="number"
                value={shippingForm.height}
                onChange={onFieldChange('height')}
                placeholder="10"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: '1' }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '18px', backgroundColor: '#fffaf6' },
                }}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {['prepaid', 'cod'].map((value) => (
                <Chip
                  key={value}
                  label={value === 'cod' ? 'COD' : 'Prepaid'}
                  clickable
                  color={shippingForm.paymentType === value ? 'primary' : 'default'}
                  onClick={() => onFieldChange('paymentType')({ target: { value } })}
                  sx={{
                    borderRadius: '999px',
                    px: 0.75,
                    backgroundColor:
                      shippingForm.paymentType === value ? '#171318' : 'rgba(255,255,255,0.78)',
                    color: shippingForm.paymentType === value ? '#ffffff' : '#675c65',
                    fontWeight: 700,
                    border: '1px solid rgba(188,171,165,0.6)',
                  }}
                />
              ))}
            </div>

            <div className="weight-breakdown-panel mt-6">
              <div className="weight-breakdown-head">
                <Typography className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a534d]">
                  Weight breakdown
                </Typography>
                <Typography className="text-sm" sx={{ color: '#6b6167' }}>
                  Volumetric divisor: 5000
                </Typography>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="weight-breakdown-card">
                  <Typography className="text-xs uppercase tracking-[0.18em]" sx={{ color: '#8e7e86' }}>
                    Actual weight
                  </Typography>
                  <Typography variant="h5" className="mt-3 text-[#171318]">
                    {weightBreakdown.actualWeightKg ? `${weightBreakdown.actualWeightKg} kg` : '--'}
                  </Typography>
                </div>
                <div className="weight-breakdown-card">
                  <Typography className="text-xs uppercase tracking-[0.18em]" sx={{ color: '#8e7e86' }}>
                    Volumetric weight
                  </Typography>
                  <Typography variant="h5" className="mt-3 text-[#171318]">
                    {weightBreakdown.volumetricWeightKg
                      ? `${weightBreakdown.volumetricWeightKg} kg`
                      : '--'}
                  </Typography>
                </div>
                <div className="weight-breakdown-card weight-breakdown-card-strong">
                  <Typography className="text-xs uppercase tracking-[0.18em]" sx={{ color: '#8e7e86' }}>
                    Applicable weight
                  </Typography>
                  <Typography variant="h5" className="mt-3 text-[#171318]">
                    {weightBreakdown.applicableWeightKg
                      ? `${weightBreakdown.applicableWeightKg} kg`
                      : '0.5 kg'}
                  </Typography>
                  <Typography className="mt-2 text-sm" sx={{ color: '#7a6269' }}>
                    {weightBreakdown.applicableSource}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="contained"
                startIcon={<SearchRoundedIcon />}
                onClick={onCalculate}
                disabled={isLoading || !hasMinimumInputs}
                sx={{
                  borderRadius: '999px',
                  px: 5.5,
                  py: 1.35,
                  minWidth: { xs: '100%', sm: 280 },
                  backgroundColor: '#171318',
                  boxShadow: '0 14px 30px rgba(23,19,24,0.16)',
                  '&:hover': { backgroundColor: '#2e252d' },
                }}
              >
                {isLoading ? 'Checking rates...' : 'Check courier rates'}
              </Button>

              <Typography className="text-sm leading-7" sx={{ color: '#625b63' }}>
                Results are fetched from the public guest endpoint after both pincodes are verified from your serviceability locations.
              </Typography>
            </div>
          </MotionDiv>

          <MotionDiv {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
            <div className="calculator-results-shell rounded-[36px] p-5 text-white sm:p-7 lg:p-8">
              <Typography className="text-sm uppercase tracking-[0.25em] text-[#f6d7c8]">
                Rate results
              </Typography>
              <Typography variant="h3" className="mt-4 text-3xl text-white sm:text-4xl">
                Compare courier options without leaving the landing page
              </Typography>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="calculator-stat-card">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/55">
                    Best visible rate
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl text-white">
                    {formatCurrency(rateSummary.bestRate)}
                  </Typography>
                </div>
                <div className="calculator-stat-card">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/55">
                    Courier options
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl text-white">
                    {rateSummary.totalOptions || '--'}
                  </Typography>
                </div>
                <div className="calculator-stat-card">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/55">
                    Typical zone
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl text-white">
                    {rateSummary.zoneName || '--'}
                  </Typography>
                </div>
              </div>

              <div className="mt-8 rounded-[30px] border border-white/10 bg-white/7 p-5">
                {errorMessage ? (
                  <Typography className="text-sm leading-7 text-[#ffd4d4]">
                    {errorMessage}
                  </Typography>
                ) : null}

                {!errorMessage && !isLoading && !hasCheckedRates ? (
                  <Typography className="text-sm leading-7 text-white/72">
                    Fill in the shipment details and run the calculator to see courier options,
                    approximate rates, and delivery estimates.
                  </Typography>
                ) : null}

                {!errorMessage && !isLoading && hasCheckedRates && topOptions.length === 0 ? (
                  <div className="calculator-empty-state">
                    <Typography className="text-sm leading-7 text-white/72">
                      No courier rates are available for these shipment details right now. Try a
                      different pincode combination, package size, or payment type.
                    </Typography>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        'Check both pincodes for serviceability',
                        'Reduce package dimensions if entered too high',
                        'Switch between prepaid and COD to compare availability',
                      ].map((tip) => (
                        <div key={tip} className="calculator-empty-tip">
                          <Typography className="text-xs uppercase tracking-[0.18em] text-[#f6d7c8]">
                            Try this
                          </Typography>
                          <Typography className="mt-3 text-sm leading-6 text-white/72">
                            {tip}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {topOptions.length > 0 ? (
                  <>
                    <div className="rates-table mt-2">
                      <div className="rates-table-head">
                        <span>Courier</span>
                        <span>Zone</span>
                        <span>ETA</span>
                        <span>Rate</span>
                      </div>

                      {topOptions.map((courier, index) => (
                        <div key={`${courier.name}-${index}`} className="rates-table-row">
                          <div className="rates-table-courier">
                            <Typography className="text-sm font-semibold text-white sm:text-base">
                              {courier.displayName || courier.name || 'Courier option'}
                            </Typography>
                            {index === 0 ? <span className="courier-badge">Best rate</span> : null}
                          </div>
                          <Typography className="text-sm text-white/72">
                            {courier.approxZone?.name || '--'}
                          </Typography>
                          <Typography className="text-sm text-white/72">
                            {courier.edd || '--'}
                          </Typography>
                          <Typography className="text-sm font-semibold text-white sm:text-base">
                            {formatCurrency(resolveCourierPrice(courier))}
                          </Typography>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Typography className="text-sm leading-7 text-white/68">
                        Showing the first {topOptions.length} visible guest rates. Sign in to
                        compare more courier options and continue booking.
                      </Typography>
                      <Button
                        component="a"
                        href={clientAppUrl}
                        variant="contained"
                        endIcon={<EastRoundedIcon />}
                        sx={{
                          borderRadius: '999px',
                          px: 3,
                          py: 1.2,
                          backgroundColor: '#ffffff',
                          color: '#171318',
                          '&:hover': { backgroundColor: '#f5ece7' },
                        }}
                      >
                        Get Started
                      </Button>
                    </div>

                    <Typography className="mt-4 text-sm leading-7 text-white/58">
                      These rates are calculated using an applicable weight of{' '}
                      {weightBreakdown.applicableWeightKg || 0.5} kg based on the higher of actual
                      and volumetric weight.
                    </Typography>
                  </>
                ) : null}
              </div>
            </div>
          </MotionDiv>
        </div>
      </Container>
    </section>
  )
}
