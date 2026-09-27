import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import logo from '../assets/logo.svg'
import { useProtectedImage } from '../hooks/useProtectedImage'
import { useAuth } from '../providers/useAuth'


type CollectionListItemCardProps = {
  title: string
  body?: string | null
  imageSrc?: string | null
}

function CollectionListItemCard({
  title,
  body,
  imageSrc,
}: CollectionListItemCardProps) {
  const auth = useAuth()
  const imageUrl = useProtectedImage(imageSrc)

  async function handleClick() {
    try {
      const response = await fetch('/api/', {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      console.log(data)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card
      onClick={handleClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180,
        mb: 1,
        cursor: 'pointer',
        border: '1px solid #7DD3FC40',
        borderRadius: 2,
        isolation: 'isolate',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',

        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: '#7DD3FC40',
          boxShadow: 4,

          '& .collection-list-item-card-image': {
            filter: 'brightness(1.15)',
            transform: 'scale(1.06)',
          },

          '& .collection-list-item-card-overlay': {
            opacity: 0.8,
          },
        },
      }}
    >
      <Box
        component="img"
        src={imageUrl ?? logo}
        alt={title}
        className="collection-list-item-card-image"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 1,
          transform: 'scale(1.04)',
          transition: 'transform 250ms ease, filter 250ms ease',
          zIndex: 0,
        }}
      />

      <Box
        className="collection-list-item-card-overlay"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 1,
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.86))',
          transition: 'opacity 250ms ease',
          zIndex: 1,
        }}
      />

      <CardContent
        sx={{
          position: 'relative',
          zIndex: 2,
          p: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 1.5,
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            lineHeight: 1.7,
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          {body}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CollectionListItemCard
