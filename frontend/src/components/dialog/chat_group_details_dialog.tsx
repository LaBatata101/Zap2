import {
    Box,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
    Alert,
    Divider,
    Chip,
    Tooltip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Collapse,
    Switch,
} from "@mui/material";
import { CropAvatarData, ChatRoom, User } from "../../api/types";
import {
    CameraAlt,
    Close,
    Edit,
    Save,
    Cancel,
    People,
    ExpandMore,
    ExpandLess,
    Star,
} from "@mui/icons-material";
import { useState, useEffect, useRef, useCallback } from "react";
import { ImageCropEditor } from "../image_crop_editor";
import {
    ActionButton,
    AvatarContainer,
    CameraButton,
    DialogMode,
    StyledAvatar,
    StyledDialog,
} from "./common";

type RoomDetailsDialogProps = {
    room: ChatRoom;
    mode: DialogMode;
    isOpen: boolean;
    onClose: () => void;
    onUpdateRoom: (
        roomId: number,
        name: string,
        description: string,
        avatar: File | null,
        cropAvatarData: CropAvatarData | null,
    ) => Promise<boolean>;
    onLoadMembers: (members: string[]) => Promise<User[]>;
    onProfileView: (user: User) => void;
};

export const RoomDetailsDialog = ({
    room,
    isOpen,
    onClose,
    onUpdateRoom,
    mode,
    onLoadMembers,
    onProfileView,
}: RoomDetailsDialogProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [isPrivate, setPrivate] = useState(false);
    const [description, setDescription] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cropData, setCropData] = useState<CropAvatarData | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showCropEditor, setShowCropEditor] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showMembers, setShowMembers] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(room.name);
            setPrivate(room.is_private);
            setDescription(room.description || "");
            setAvatarPreview(room.avatar_img || null);
            setIsEditing(false);
            setAvatarFile(null);
            setError(null);
            setSuccess(false);
            setShowMembers(true);
            loadMembers();
        }
    }, [room, isOpen]);

    useEffect(() => {
        if (success) {
            setTimeout(() => {
                setSuccess(false);
            }, 1000);
        }
    }, [success]);

    const loadMembers = async () => {
        if (room.members.length === 0) return;

        setLoadingMembers(true);
        try {
            const loadedMembers = await onLoadMembers(room.members);
            setMembers(loadedMembers);
        } catch (error) {
            console.error("Failed to load members:", error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Room name is required.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await onUpdateRoom(room.id, name, description, avatarFile, cropData);
            setSuccess(result);
            if (result) setIsEditing(false);
        } catch (e: any) {
            setError(e.message || "Failed to update room.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setName(room.name);
        setDescription(room.description || "");
        setAvatarPreview(room.avatar_img || null);
    };

    const handleAvatarChange = (file: File) => {
        setSelectedImageFile(file);
        setShowCropEditor(true);
    };

    const handleCropComplete = useCallback(
        (originalFile: File, cropDetails: CropAvatarData, previewBlob: Blob) => {
            setAvatarFile(originalFile);
            setCropData(cropDetails);
            setAvatarPreview(URL.createObjectURL(previewBlob));
            setShowCropEditor(false);
        },
        [],
    );

    const getAvatarContent = (user: User) => {
        if (user.profile?.avatar_img) {
            return (
                <img
                    src={user.profile.avatar_img}
                    alt={`${user.username} avatar`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            );
        }
        return user.username.charAt(0).toUpperCase();
    };

    const isOwner = (user: User) => user.username === room.owner;

    return (
        <StyledDialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                        {isEditing ? "Edit Group Info" : "Group Info"}
                    </Typography>
                </Box>
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stack spacing={3} alignItems="center">
                    <AvatarContainer>
                        <StyledAvatar sx={{ width: 120, height: 120 }}>
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Room Avatar"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                room.name.charAt(0).toUpperCase()
                            )}
                        </StyledAvatar>
                        {isEditing && (
                            <CameraButton onClick={() => fileInputRef.current?.click()}>
                                <CameraAlt />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) =>
                                        e.target.files && handleAvatarChange(e.target.files[0])
                                    }
                                />
                            </CameraButton>
                        )}
                    </AvatarContainer>

                    {isEditing ? (
                        <Stack spacing={2.5} sx={{ width: "100%" }}>
                            <Box sx={{ position: "relative" }}>
                                <TextField
                                    label="Room Name"
                                    value={name}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 100) {
                                            setName(e.target.value);
                                        }
                                    }}
                                    fullWidth
                                    error={name.length > 100}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        bottom: 8,
                                        right: 12,
                                        color:
                                            name.length > 80
                                                ? name.length >= 100
                                                    ? "error.main"
                                                    : "warning.main"
                                                : "text.secondary",
                                        fontSize: "0.75rem",
                                        backgroundColor: "background.paper",
                                        px: 1,
                                        borderRadius: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    {name.length}/100
                                </Typography>
                            </Box>
                            <Box sx={{ position: "relative" }}>
                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 140) {
                                            setDescription(e.target.value);
                                        }
                                    }}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    error={description.length > 140}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        bottom: 8,
                                        right: 12,
                                        color:
                                            description.length > 130
                                                ? description.length >= 140
                                                    ? "error.main"
                                                    : "warning.main"
                                                : "text.secondary",
                                        fontSize: "0.75rem",
                                        backgroundColor: "background.paper",
                                        px: 1,
                                        borderRadius: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    {description.length}/140
                                </Typography>
                            </Box>
                            {/* Privacy Toggle */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    mt: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        backgroundColor: "action.hover",
                                    },
                                }}
                            >
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <Typography variant="body1" fontWeight={500}>
                                        Group type
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontSize: "0.8rem" }}
                                    >
                                        {isPrivate
                                            ? "Only invited members can join"
                                            : "Anyone can discover and join"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography
                                        variant="body2"
                                        color={isPrivate ? "text.secondary" : "primary.main"}
                                        fontWeight={isPrivate ? 400 : 600}
                                        sx={{ fontSize: "0.8rem" }}
                                    >
                                        Public
                                    </Typography>
                                    <Switch
                                        checked={isPrivate}
                                        onChange={(e) => setPrivate(e.target.checked)}
                                        sx={{
                                            width: 56,
                                            height: 32,
                                            padding: 0,
                                            "& .MuiSwitch-switchBase": {
                                                padding: 0,
                                                margin: "4px",
                                                transitionDuration: "300ms",
                                                "&.Mui-checked": {
                                                    transform: "translateX(24px)",
                                                    color: "#fff",
                                                    "& + .MuiSwitch-track": {
                                                        backgroundColor: "secondary.main",
                                                        opacity: 1,
                                                        border: 0,
                                                    },
                                                    "&.Mui-disabled + .MuiSwitch-track": {
                                                        opacity: 0.5,
                                                    },
                                                },
                                                "&.Mui-focusVisible .MuiSwitch-thumb": {
                                                    color: "secondary.main",
                                                    border: "6px solid #fff",
                                                },
                                                "&.Mui-disabled .MuiSwitch-thumb": {
                                                    color: "grey.100",
                                                },
                                                "&.Mui-disabled + .MuiSwitch-track": {
                                                    opacity: 0.3,
                                                },
                                            },
                                            "& .MuiSwitch-thumb": {
                                                boxSizing: "border-box",
                                                width: 24,
                                                height: 24,
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                            },
                                            "& .MuiSwitch-track": {
                                                borderRadius: 16,
                                                backgroundColor: "divider",
                                                opacity: 1,
                                                transition: "background-color 300ms",
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        color={isPrivate ? "secondary.main" : "text.secondary"}
                                        fontWeight={isPrivate ? 600 : 400}
                                        sx={{ fontSize: "0.8rem" }}
                                    >
                                        Private
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    ) : (
                        <Box sx={{ textAlign: "center", width: "100%" }}>
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                {room.name}
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    textAlign: "justify",
                                }}
                            >
                                {room.description || "No description."}
                            </Typography>

                            {/* Room Type Indicator */}
                            <Chip
                                label={room.is_private ? "Private Group" : "Public Group"}
                                size="small"
                                color={room.is_private ? "secondary" : "primary"}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ width: "100%", borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ width: "100%", borderRadius: 2 }}>
                            Room updated successfully!
                        </Alert>
                    )}

                    {/* Members Section */}
                    {!isEditing && (
                        <Box sx={{ width: "100%" }}>
                            <Divider sx={{ mb: 2 }} />

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 2,
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "action.hover",
                                        borderRadius: 1,
                                    },
                                    p: 1,
                                    mx: -1,
                                }}
                                onClick={() => setShowMembers(!showMembers)}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <People color="primary" />
                                    <Typography variant="h6" fontWeight={600}>
                                        Members
                                    </Typography>
                                    <Chip
                                        label={members.length}
                                        size="small"
                                        sx={{
                                            backgroundColor: "primary.main",
                                            color: "primary.contrastText",
                                            minWidth: 24,
                                            height: 20,
                                            fontSize: "0.75rem",
                                        }}
                                    />
                                </Box>
                                <IconButton size="small">
                                    {showMembers ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Box>

                            <Collapse in={showMembers}>
                                {loadingMembers ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : (
                                    <List sx={{ py: 0 }}>
                                        {members.map((member, _) => (
                                            <Box
                                                key={member.id}
                                                onClick={() => onProfileView(member)}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <ListItem
                                                    sx={{
                                                        px: 0,
                                                        py: 1,
                                                        borderRadius: 1,
                                                        "&:hover": {
                                                            backgroundColor: "action.hover",
                                                        },
                                                    }}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                border: isOwner(member)
                                                                    ? "2px solid"
                                                                    : "none",
                                                                borderColor: "warning.main",
                                                            }}
                                                        >
                                                            {getAvatarContent(member)}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={500}
                                                                >
                                                                    {member.username}
                                                                </Typography>
                                                                {isOwner(member) && (
                                                                    <Tooltip title="Group Owner">
                                                                        <Star
                                                                            sx={{
                                                                                fontSize: 16,
                                                                                color: "warning.main",
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                                {/* TODO: display chip for ADMINS */}
                                                                {member.username === room.owner && (
                                                                    <Chip
                                                                        label="Owner"
                                                                        size="small"
                                                                        color="error"
                                                                        sx={{
                                                                            height: 18,
                                                                            fontSize: "0.7rem",
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </Collapse>

                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions
                sx={{
                    p: 3,
                    pt: 2,
                    justifyContent: mode === DialogMode.Edit ? "space-between" : "center",
                }}
            >
                {mode === DialogMode.Edit &&
                    (isEditing ? (
                        <>
                            <ActionButton
                                startIcon={<Cancel />}
                                onClick={handleCancel}
                                disabled={loading}
                                sx={{ color: "text.secondary" }}
                            >
                                Cancel
                            </ActionButton>
                            <ActionButton
                                startIcon={<Save />}
                                onClick={handleSave}
                                variant="contained"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={16} /> : "Save"}
                            </ActionButton>
                        </>
                    ) : (
                        <ActionButton startIcon={<Edit />} onClick={() => setIsEditing(true)}>
                            Edit Details
                        </ActionButton>
                    ))}
            </DialogActions>

            {selectedImageFile && showCropEditor && (
                <ImageCropEditor
                    open={showCropEditor}
                    onClose={() => setShowCropEditor(false)}
                    image={selectedImageFile}
                    onCropComplete={handleCropComplete}
                />
            )}
        </StyledDialog>
    );
};
