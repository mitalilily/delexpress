const Card = {
  baseStyle: {
    p: '22px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
    minWidth: '0px',
    wordWrap: 'break-word',
    backgroundClip: 'border-box',
  },
  variants: {
    panel: (props) => ({
      bg: props.colorMode === 'dark' ? '#101C34' : 'white',
      width: '100%',
      border: props.colorMode === 'dark' ? '1px solid rgba(148, 163, 184, 0.18)' : '1px solid rgba(148, 163, 184, 0.28)',
      boxShadow:
        props.colorMode === 'dark'
          ? '0 12px 30px rgba(2, 8, 23, 0.5)'
          : '0 16px 34px rgba(15, 46, 102, 0.08)',
      borderRadius: '20px',
      overflow: 'hidden',
    }),
  },
  defaultProps: {
    variant: 'panel',
  },
}

export const CardComponent = {
  components: {
    Card,
  },
}
