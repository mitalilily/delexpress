import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import { Chip, Container, TextField, Typography } from '@mui/material'
import { fadeUp, MotionCard, MotionDiv, SectionHeader } from './LandingPrimitives'

function LookupCard({ label, lookup, icon }) {
  const isReady = Boolean(lookup.location)

  return (
    <MotionCard className="surface-panel rounded-[30px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b3150]">
            {label}
          </Typography>
          <Typography variant="h6" className="mt-3 text-xl text-[#181318]">
            {isReady ? `${lookup.location.city}, ${lookup.location.state}` : 'Awaiting valid pincode'}
          </Typography>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#171318] text-white shadow-[0_12px_28px_rgba(20,17,22,0.16)]">
          {icon}
        </div>
      </div>

      <Typography className="mt-4 text-sm leading-7 sm:text-base" sx={{ color: '#635b63' }}>
        {lookup.isLoading
          ? 'Checking serviceability location...'
          : lookup.error ||
            (isReady
              ? `Pincode ${lookup.location.pincode} is available in our serviceability locations.`
              : 'Enter a valid 6-digit pincode to verify this route.')}
      </Typography>

      <Chip
        label={isReady ? 'Serviceable location found' : 'Needs verification'}
        className="mt-5"
        sx={{
          borderRadius: '999px',
          backgroundColor: isReady ? '#e8f6f1' : '#f6e9ed',
          color: isReady ? '#24795f' : '#7b3b52',
          fontWeight: 700,
        }}
      />
    </MotionCard>
  )
}

export default function PincodeServiceabilitySection({
  onFieldChange,
  pincodeLookup,
  shippingForm,
}) {
  const bothServiceable =
    Boolean(pincodeLookup.pickup.location) && Boolean(pincodeLookup.delivery.location)

  return (
    <section id="pincode-serviceability" className="py-14 sm:py-18">
      <Container maxWidth="xl">
        <MotionDiv {...fadeUp}>
          <SectionHeader
            eyebrow="Pincode Serviceability"
            title="Check both route pincodes before you calculate the rate"
            description="Validate pickup and delivery coverage separately so your team can confirm the lane is available before comparing courier prices."
            align="center"
          />
        </MotionDiv>

        <div className="mt-10 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <MotionDiv {...fadeUp} className="section-band rounded-[34px] p-5 sm:p-7 lg:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  '& .MuiFormHelperText-root': { minHeight: '1.45rem', marginLeft: '0.15rem' },
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
                  '& .MuiFormHelperText-root': { minHeight: '1.45rem', marginLeft: '0.15rem' },
                }}
              />
            </div>

            <div className="mt-6 rounded-[28px] border border-[#ead8d0] bg-white/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ab5a43]">
                    Route status
                  </Typography>
                  <Typography variant="h5" className="mt-3 text-[#181318]">
                    {bothServiceable
                      ? 'Both route pincodes are ready for rate comparison'
                      : 'Verify both pincodes to confirm route coverage'}
                  </Typography>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#f7efe5] text-[#ab5a43]">
                  {bothServiceable ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 30 }} />
                  ) : (
                    <LocalShippingRoundedIcon sx={{ fontSize: 30 }} />
                  )}
                </div>
              </div>

              <Typography className="mt-4 text-sm leading-7 sm:text-base" sx={{ color: '#635b63' }}>
                {bothServiceable
                  ? 'You can now move straight to the calculator and compare the visible courier rates for this lane.'
                  : 'This separate check makes the route validation easier to read before the calculator runs.'}
              </Typography>
            </div>
          </MotionDiv>

          <div className="grid gap-5 md:grid-cols-2">
            <LookupCard
              label="Pickup Coverage"
              lookup={pincodeLookup.pickup}
              icon={<PlaceRoundedIcon sx={{ fontSize: 28 }} />}
            />
            <LookupCard
              label="Delivery Coverage"
              lookup={pincodeLookup.delivery}
              icon={<LocalShippingRoundedIcon sx={{ fontSize: 28 }} />}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
