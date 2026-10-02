import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

type JsonComponentProps = {
    data: unknown
}

export default function JsonComponent({ data }: JsonComponentProps) {
    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#fff',
                color: '#000',
                overflow: 'auto',
                textAlign: 'left',
            }}
        >
            <Box
                component="pre"
                sx={{
                    m: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'inherit',
                }}
            >
                {JSON.stringify(data, null, 2)}
            </Box>
        </Paper>
    )
}