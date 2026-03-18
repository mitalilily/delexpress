import { mode } from '@chakra-ui/theme-tools'
import colors from './foundations/colors'

export const globalStyles = {
  colors: {
    ...colors,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('#F7EFE6', '#181318')(props),
        color: mode('gray.900', 'whiteAlpha.900')(props),
        fontFamily: "'Poppins', sans-serif",
        backgroundImage: mode(
          'radial-gradient(circle at 8% 8%, rgba(155,49,80,0.14) 0%, transparent 36%), radial-gradient(circle at 96% 0%, rgba(86,192,165,0.12) 0%, transparent 28%), linear-gradient(180deg, #fffaf4 0%, #f7efe6 100%)',
          'radial-gradient(circle at 8% 8%, rgba(231,146,174,0.16) 0%, transparent 36%), radial-gradient(circle at 96% 0%, rgba(86,192,165,0.12) 0%, transparent 28%), linear-gradient(180deg, #22191f 0%, #181318 100%)',
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
