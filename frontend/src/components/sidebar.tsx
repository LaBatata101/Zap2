import { useState } from "react";
import { ChatRoom, CropAvatarData, User } from "../api/types";
import {
    Drawer,
    Avatar,
    Badge,
    Button,
    TextField,
    Typography,
    Stack,
    List,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
    InputAdornment,
    styled,
} from "@mui/material";
import { Logout, Settings, Add, Search, Person } from "@mui/icons-material";
import { StyledTooltip } from "./styled";
import { RoomListItem } from "./room_list_item";
import { UserProfileDialog } from "./dialog/user_profile_dialog";
import { DialogMode } from "./dialog/common";

export const sidebarWidth = 320;

const StyledDrawer = styled(Drawer)({
    "& .MuiDrawer-paper": {
        width: sidebarWidth,
        boxSizing: "border-box",
        borderRight: "1px solid #374151",
        background: "#1e293b",
        backgroundImage: "none",
    },
});

// Enhanced user profile section with hover effects
const UserProfileSection = styled(Box)(({ theme }) => ({
    cursor: "pointer",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    margin: "-8px", // Negative margin to expand clickable area
    transition: "all 0.2s ease-in-out",

    "&:hover": {
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        transform: "translateY(-1px)",

        "& .username": {
            color: theme.palette.primary.light,
        },

        "& .status": {
            color: theme.palette.success.light,
        },

        "& .avatar": {
            transform: "scale(1.05)",
            boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
        },
    },

    "&:active": {
        transform: "translateY(0px)",
    },
}));

const EnhancedAvatar = styled(Avatar)(({ theme }) => ({
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    width: 50,
    height: 50,
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s ease-in-out",
    border: `2px solid ${theme.palette.background.paper}`,
}));

type SidebarProps = {
    user: User;
    rooms: any[];
    currentRoom: ChatRoom;
    onRoomSelect: (room: ChatRoom) => Promise<void>;
    onCreateRoom: (name: string) => Promise<void>;
    onLogout: () => Promise<void>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isMobile: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onUpdateProfile: (
        username: string,
        bio: string,
        avatar: File | null,
        cropAvatarData: CropAvatarData | null,
    ) => Promise<boolean>;

    onStartDirectMessage: (user: User) => void;
};

export const Sidebar = ({
    user,
    rooms,
    currentRoom,
    onRoomSelect,
    onCreateRoom,
    onLogout,
    searchTerm,
    setSearchTerm,
    isMobile,
    isOpen,
    onToggle,
    onUpdateProfile,
    onStartDirectMessage,
}: SidebarProps) => {
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        setLoading(true);
        try {
            await onCreateRoom(newRoomName.trim());
            setNewRoomName("");
            setShowRoomModal(false);
        } catch (error) {
            console.error("Failed to create room: ", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const drawerContent = (
        <>
            <Box
                sx={{
                    p: 2,
                    borderBottom: "1px solid #374151",
                    background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                }}
            >
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                variant="dot"
                                sx={{
                                    "& .MuiBadge-badge": {
                                        backgroundColor: "#10b981",
                                        color: "#10b981",
                                        border: "2px solid #1e293b",
                                        width: 12,
                                        height: 12,
                                    },
                                }}
                            >
                                <EnhancedAvatar className="avatar">
                                    {user.profile?.avatar_img ? (
                                        <img
                                            src={user.profile.avatar_img}
                                            alt="User Avatar"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: "50%",
                                            }}
                                        />
                                    ) : (
                                        <Person />
                                    )}
                                </EnhancedAvatar>
                            </Badge>

                            <UserProfileSection
                                onClick={() => setProfileDialogOpen(true)}
                                sx={{ flex: 1 }}
                            >
                                <Box>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color="text.primary"
                                        className="username"
                                        sx={{
                                            transition: "color 0.2s ease-in-out",
                                            fontSize: "0.95rem",
                                        }}
                                    >
                                        {user.username}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="success.main"
                                        className="status"
                                        sx={{
                                            fontSize: "0.8rem",
                                            transition: "color 0.2s ease-in-out",
                                        }}
                                    >
                                        Online
                                    </Typography>
                                </Box>
                            </UserProfileSection>
                        </Stack>

                        <Stack direction="row">
                            <StyledTooltip title="Configurations">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: "text.secondary",
                                        "&:hover": {
                                            color: "primary.main",
                                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                                        },
                                    }}
                                >
                                    <Settings />
                                </IconButton>
                            </StyledTooltip>
                            <StyledTooltip title="Logout">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: "text.secondary",
                                        "&:hover": {
                                            color: "error.main",
                                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                                        },
                                    }}
                                    onClick={onLogout}
                                >
                                    <Logout />
                                </IconButton>
                            </StyledTooltip>
                        </Stack>
                    </Stack>
                    <TextField
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: "rgba(51, 65, 85, 0.5)",
                                borderRadius: "10px",
                                "& input::placeholder": {
                                    color: "text.secondary",
                                    opacity: 0.7,
                                },
                            },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1 }}
                >
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    >
                        Chats
                    </Typography>
                    <Button
                        startIcon={<Add />}
                        size="small"
                        onClick={() => setShowRoomModal(true)}
                        sx={{
                            minWidth: "auto",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "6px",
                            color: "primary.main",
                            "&:hover": {
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                            },
                        }}
                    >
                        New
                    </Button>
                </Stack>
                <List disablePadding>
                    {filteredRooms.map((room) => (
                        <RoomListItem
                            key={room.id}
                            room={room}
                            currentUser={user}
                            isSelected={currentRoom?.id === room.id}
                            onSelect={onRoomSelect}
                        />
                    ))}
                </List>
            </Box>
        </>
    );

    return (
        <>
            <StyledDrawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? isOpen : true}
                onClose={onToggle}
                ModalProps={{
                    keepMounted: true,
                }}
                anchor="left"
            >
                {drawerContent}
            </StyledDrawer>

            <UserProfileDialog
                user={user}
                isOpen={isProfileDialogOpen}
                mode={DialogMode.CurrentUser}
                onClose={() => setProfileDialogOpen(false)}
                onStartDirectMessage={(user) => {
                    onStartDirectMessage(user);
                    setProfileDialogOpen(false);
                }}
                onUpdateProfile={onUpdateProfile}
            />

            <Dialog
                open={showRoomModal}
                onClose={() => setShowRoomModal(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Group Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRoomModal(false)}>Cancelar</Button>
                    <Button onClick={handleCreateRoom} variant="contained" disabled={loading}>
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
