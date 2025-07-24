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
                    borderRadius: "10px",
                    mx: 0.5,
                    transition: "all 0.2s ease-in-out",
                    "&.Mui-selected": {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderLeft: "3px solid #3b82f6",
                        transform: "translateX(2px)",
                        "& .MuiListItemText-primary": {
                            color: "primary.main",
                        },
                    },
                    "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.08)",
                        transform: "translateX(1px)",
                    },
                    "&.Mui-selected:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                    },
                }}
            >
                <ListItemAvatar>
                    <Avatar
                        sx={{
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            boxShadow: isSelected
                                ? "0 4px 12px rgba(59, 130, 246, 0.4)"
                                : "0 2px 8px rgba(0, 0, 0, 0.2)",
                            width: 48,
                            height: 48,
                            transition: "box-shadow 0.2s ease-in-out",
                        }}
                    >
                        {room.name.charAt(0).toUpperCase()}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                                variant="body1"
                                fontWeight={isSelected ? 600 : 500}
                                sx={{
                                    color: isSelected ? "primary.main" : "text.primary",
                                    transition: "color 0.2s ease-in-out",
                                }}
                            >
                                {room.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: "0.75rem" }}
                            >
                                {room.last_message && formatTime(room.last_message.timestamp)}
                            </Typography>
                        </Box>
                    }
                    secondary={
                        <Box
                            display="flex"
                            alignItems="center"
                            sx={{ width: "100%", pr: room.unread_count > 0 ? 1 : 0 }}
                        >
                            {room.last_message && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        minWidth: 0,
                                        mr: room.unread_count > 0 ? 1 : 0,
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{ color: "primary.light", fontWeight: 500 }}
                                    >
                                        {room.last_message.username}:
                                    </Box>
                                    <Box component="span" sx={{ color: "text.secondary" }}>
                                        {" "}
                                        {room.last_message.message}
                                    </Box>
                                </Typography>
                            )}
                            {room.unread_count > 0 && (
                                <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                                    <Badge
                                        badgeContent={room.unread_count}
                                        color="primary"
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                position: "static",
                                                transform: "none",
                                                background:
                                                    "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
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
                            component: "div",
                        },
                    }}
                />
            </ListItemButton>
        </ListItem>
    );
});
