import { Box, IconButton, type IconButtonProps } from '@mui/material'
import type { ReactNode } from 'react'

import innerCircleLogo from '../assets/logo.svg'

type CustomIconButtonProps = {
  isLoading?: boolean
  ariaLabel: string
  children: ReactNode
} & IconButtonProps

export default function CustomIconButton({
  isLoading = false,
  ariaLabel,
  children,
  ...buttonProps
}: CustomIconButtonProps) {
  return (
    <IconButton
      aria-label={ariaLabel}
      disabled={isLoading}
      {...buttonProps}
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        width: 40,
        height: 40,
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
        ...buttonProps.sx,
      }}
    >
      {isLoading ? (
        <Box
          component="img"
          src={innerCircleLogo}
          alt=""
          sx={{
            width: 22,
            height: 22,
            animation: 'spin 1.2s linear infinite',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
        />
      ) : (
        children
      )}
    </IconButton>
  )
}