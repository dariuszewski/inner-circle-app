

import { IconButton } from '@mui/material';

interface CustomIconButtonProps {
    onClick: () => void;
    ariaLabel: string;
    children: React.ReactNode;
}

export default function CustomIconButton({ onClick, ariaLabel, children }: CustomIconButtonProps) {
    return (
        <IconButton
            onClick={onClick}
            aria-label={ariaLabel}
            sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                '&:hover': {
                    backgroundColor: 'primary.dark',
                },
            }}
        >
            {children}
        </IconButton>
    )
}