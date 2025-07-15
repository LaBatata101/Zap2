import { memo } from "react";
import { ChatRoom } from "../api/types";
import {
    Avatar,
    Badge,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Typography,
    Box,
} from "@mui/material";
import { formatTime } from "../helpers/format";

type RoomListItemProps = {
    room: ChatRoom;
    isSelected: boolean;
    onSelect: (room: ChatRoom) => void;
};

export const RoomListItem = memo(({ room, isSelected, onSelect }: RoomListItemProps) => {
    return (
        <ListItem key={room.id} disablePadding sx={{ px: 1 }}>
            <ListItemButton
                onClick={() => onSelect(room)}
                selected={isSelected}
                sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                        backgroundColor: "action.hover",
                        border: "1px solid",
                        borderColor: "primary.main",
                    },
                }}
            >
                <ListItemAvatar>
                    <Avatar
                        sx={{
                            background: "linear-gradient(45deg, #1890ff, #722ed1)",
                        }}
                    >
                        {room.name.charAt(0).toUpperCase()}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight="medium">
                                {room.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {room.last_message_timestamp &&
                                    formatTime(room.last_message_timestamp)}
                            </Typography>
                        </Box>
                    }
                    secondary={
                        <Box
                            display="flex"
                            alignItems="center"
                            sx={{ width: "100%", pr: room.unread_count > 0 ? 1 : 0 }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                    mr: room.unread_count > 0 ? 1 : 0,
                                }}
                            >
                                {room.last_message}
                            </Typography>
                            {room.unread_count > 0 && (
                                <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                                    <Badge
                                        badgeContent={room.unread_count}
                                        color="primary"
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                position: "static",
                                                transform: "none",
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    }
                    slotProps={{
                        primary: {
                            component: "div",
                        },
                        secondary: {
                            noWrap: true,
                            textOverflow: "ellipsis",
                            color: "text.secondary",
                            component: "div",
                        },
                    }}
                />
            </ListItemButton>
        </ListItem>
    );
});
