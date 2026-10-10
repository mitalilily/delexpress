import { Box, Button, Portal, useColorModeValue, useOutsideClick } from '@chakra-ui/react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const CustomDatePicker = forwardRef(({ selectedDate, onChange, minDate, maxDate }, ref) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const buttonRef = useRef(null)
  const calendarRef = useRef(null)

  useOutsideClick({
    ref: calendarRef,
    handler: () => setShowCalendar(false),
  })

  useEffect(() => {
    if (!showCalendar || !buttonRef.current) return undefined

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      const pickerWidth = Math.min(360, window.innerWidth - 24)
      const pickerHeight = 360
      const gap = 6
      const left = Math.min(
        Math.max(12, rect.left),
        Math.max(12, window.innerWidth - pickerWidth - 12),
      )
      const top =
        rect.bottom + gap + pickerHeight <= window.innerHeight
          ? rect.bottom + gap
          : Math.max(12, rect.top - pickerHeight - gap)
      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showCalendar])

  const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box ref={ref}>
      <Button
        ref={buttonRef}
        onClick={() => setShowCalendar(!showCalendar)}
        variant="outline"
        w="full"
        justifyContent="flex-start"
        borderColor={borderColor}
        bg={bgColor}
      >
        {selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
      </Button>

      {showCalendar && (
        <Portal>
          <Box
            ref={calendarRef}
            position="fixed"
            zIndex="popover"
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
            rounded="md"
            p={2}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `min(360px, calc(100vw - 24px))`,
              maxHeight: `calc(100vh - 24px)`,
              overflow: 'auto',
            }}
          >
            <DayPicker
              className="admin-date-picker"
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onChange(date)
                setShowCalendar(false)
              }}
              disabled={{
                ...(minDate && { before: new Date(minDate) }),
                ...(maxDate && { after: new Date(maxDate) }),
              }}
            />
          </Box>
        </Portal>
      )}
    </Box>
  )
})

CustomDatePicker.displayName = 'CustomDatePicker'
export default CustomDatePicker
