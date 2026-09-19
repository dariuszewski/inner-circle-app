import { Box, Button, type ButtonProps } from '@mui/material'
import type { ReactNode } from 'react'

import innerCircleLogo from '../assets/logo.svg'

type CustomSubmitButtonProps = {
  isLoading: boolean
  children: ReactNode
} & Omit<ButtonProps, 'type' | 'disabled'>

export default function CustomSubmitButton({ isLoading, children, ...buttonProps }: CustomSubmitButtonProps) {
  return (
    <Button type="submit" variant="contained" color="primary" disabled={isLoading} {...buttonProps}>
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
    </Button>
  )
}
