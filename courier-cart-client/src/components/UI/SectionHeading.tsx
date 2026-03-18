import { motion } from 'framer-motion';
import { Typography, Stack, alpha } from '@mui/material';
import { TbBolt } from 'react-icons/tb';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ 
  title, 
  subtitle, 
  icon = <TbBolt />, 
  color = '#0052CC' 
}) => {
  return (
    <Stack spacing={0.5} sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <motion.div
          initial={{ rotate: -20, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          whileHover={{ rotate: 180, scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: color,
            background: alpha(color, 0.1),
            padding: '8px',
            borderRadius: '8px'
          }}
        >
          {icon}
        </motion.div>
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.5rem', md: '1.8rem' },
            fontWeight: 800,
            color: '#172B4D',
            letterSpacing: -0.5
          }}
        >
          {title}
        </Typography>
      </Stack>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: '#42526E',
            fontSize: '0.95rem',
            fontWeight: 500,
            ml: 6.5
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
};

export default SectionHeading;
