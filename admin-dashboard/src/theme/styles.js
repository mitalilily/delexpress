import { mode } from '@chakra-ui/theme-tools'
import colors from './foundations/colors'

export const globalStyles = {
  colors: {
    ...colors,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('#F6FAFC', '#111C28')(props),
        color: mode('gray.900', 'whiteAlpha.900')(props),
        fontFamily: "'Poppins', sans-serif",
        backgroundImage: mode(
          'radial-gradient(circle at 8% 8%, rgba(118,150,172,0.14) 0%, transparent 36%), radial-gradient(circle at 96% 0%, rgba(198,216,226,0.12) 0%, transparent 28%), linear-gradient(180deg, #F6FAFC 0%, #EEF4F8 100%)',
          'radial-gradient(circle at 8% 8%, rgba(151,183,203,0.16) 0%, transparent 36%), radial-gradient(circle at 96% 0%, rgba(198,216,226,0.12) 0%, transparent 28%), linear-gradient(180deg, #18242E 0%, #111C28 100%)',
        ),
      },
      html: {
        fontFamily: "'Poppins', sans-serif",
      },
      '#root': {
        minHeight: '100vh',
      },
      '::selection': {
        background: mode('brand.100', 'brand.600')(props),
      },
    }),
  },
}
