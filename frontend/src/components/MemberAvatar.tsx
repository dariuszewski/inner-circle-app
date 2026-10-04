import Avatar from '@mui/material/Avatar'

import { useProtectedMedia } from '../hooks/useProtectedMedia'
import type { UserResponsePublic } from '../types/userResponse'

type MemberAvatarProps = {
	member: UserResponsePublic
	size: number
	sx?: object
}

export default function MemberAvatar({ member, size, sx }: MemberAvatarProps) {
	const imageUrl = useProtectedMedia(member.profile_image_url)

	return (
		<Avatar
			src={imageUrl ?? undefined}
			alt={member.username}
			sx={{ width: size, height: size, fontSize: size / 2, ...sx }}
		>
			{member.username.slice(0, 1).toUpperCase()}
		</Avatar>
	)
}
