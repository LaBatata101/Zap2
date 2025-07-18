import { useEffect, useRef, useReducer, useState, useCallback } from "react";
import { AuthPage } from "./authentication";
import { APIService, WebSocketService } from "../api";
import { Sidebar, sidebarWidth } from "../components/sidebar";
import { ChatArea } from "../components/chat_area";
import {
    ChatRoom,
    LoginCredentials,
    Message,
    MessagePayload,
    RegistrationCredentials,
    User,
} from "../api/types";
import { Box, ThemeProvider, useMediaQuery, useTheme } from "@mui/material";
import { darkTheme } from "../theme";

enum ChatActionType {
    RegistrationStart,
    LoginStart,
    RegistrationSuccess,
    LoginSuccess,
    Logout,
    SelectRoom,
    SetMessages,
    SetRooms,
    UpdatedRoomMetadata,
    ResetUnreadCount,
    SetConnectionStatus,
    SetSearchTerm,
    SetHighlightedMessage,
    ReceiveMessage,
    Error,
}

export enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
    Error,
}

type ChatState = {
    user?: User;
    rooms: ChatRoom[];
    currentRoom?: ChatRoom;
    messages: Message[];
    connectionStatus: ConnectionStatus;
    searchTerm: string;
    highlightedMessageId?: number;
};

type ChatAction =
    | {
          type:
              | ChatActionType.LoginStart
              | ChatActionType.RegistrationStart
              | ChatActionType.Logout
              | ChatActionType.Error;
      }
    | {
          type: ChatActionType.LoginSuccess | ChatActionType.RegistrationSuccess;
          payload: { user: User };
      }
    | { type: ChatActionType.SelectRoom; payload: ChatRoom }
    | { type: ChatActionType.SetMessages; payload: Message[] }
    | { type: ChatActionType.SetRooms; payload: ChatRoom[] }
    | { type: ChatActionType.SetConnectionStatus; payload: ConnectionStatus }
    | { type: ChatActionType.SetSearchTerm; payload: string }
    | { type: ChatActionType.SetHighlightedMessage; payload?: number }
    | { type: ChatActionType.SetRooms; payload: ChatRoom[] }
    | { type: ChatActionType.UpdatedRoomMetadata; payload: Message }
    | { type: ChatActionType.ResetUnreadCount; payload: number }
    | { type: ChatActionType.ReceiveMessage; payload: Message };
const initialState: ChatState = {
    user: undefined,
    rooms: [],
    currentRoom: undefined,
    messages: [],
    connectionStatus: ConnectionStatus.Connected,
    searchTerm: "",
    highlightedMessageId: undefined,
};

function chatReducer(state: ChatState, action: ChatAction) {
    switch (action.type) {
        case ChatActionType.RegistrationStart:
        case ChatActionType.LoginStart:
            return { ...state };
        case ChatActionType.RegistrationSuccess:
        case ChatActionType.LoginSuccess:
            return {
                ...state,
                user: action.payload.user,
            };
        case ChatActionType.Error:
        case ChatActionType.Logout:
            return { ...initialState };
        case ChatActionType.SelectRoom:
            return {
                ...state,
                currentRoom: action.payload,
                messages: [],
            };
        case ChatActionType.SetRooms:
            return {
                ...state,
                rooms: action.payload,
            };
        case ChatActionType.ReceiveMessage: {
            const message = action.payload;
            const { rooms, currentRoom, messages } = state;

            const updatedRooms = rooms.map((room) =>
                room.id === message.room
                    ? {
                          ...room,
                          last_message: message.content,
                          last_message_timestamp: message.timestamp,
                          unread_count:
                              currentRoom?.id === message.room
                                  ? room.unread_count
                                  : room.unread_count + 1,
                      }
                    : room,
            );

            const updatedMessages =
                currentRoom?.id === message.room ? [...messages, message] : messages;

            return {
                ...state,
                rooms: updatedRooms,
                messages: updatedMessages,
            };
        }
        case ChatActionType.ResetUnreadCount:
            return {
                ...state,
                rooms: state.rooms.map((room) =>
                    room.id === action.payload ? { ...room, unread_count: 0 } : room,
                ),
                currentRoom: state.currentRoom
                    ? { ...state.currentRoom, unread_count: 0 }
                    : undefined,
            };
        case ChatActionType.SetMessages:
            return { ...state, messages: action.payload };
        case ChatActionType.SetConnectionStatus:
            return { ...state, connectionStatus: action.payload };
        case ChatActionType.SetSearchTerm:
            return { ...state, searchTerm: action.payload };
        case ChatActionType.SetHighlightedMessage:
            return { ...state, highlightedMessageId: action.payload };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export const ChatApp = () => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const {
        user,
        rooms,
        currentRoom,
        messages,
        connectionStatus,
        searchTerm,
        highlightedMessageId,
    } = state;

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const apiService = useRef(new APIService());
    const wsService = useRef(new WebSocketService());

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleSidebarToggle = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleReplyClick = useCallback((messageId: number) => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
            dispatch({ type: ChatActionType.SetHighlightedMessage, payload: messageId });
            setTimeout(() => {
                dispatch({ type: ChatActionType.SetHighlightedMessage, payload: undefined });
            }, 650);
        }
    }, []);

    // Connect to websocket and load initial data after login
    useEffect(() => {
        if (user) {
            wsService.current.connect();

            const loadData = async () => {
                try {
                    const roomsData = await apiService.current.getRooms();
                    dispatch({
                        type: ChatActionType.SetRooms,
                        payload: roomsData,
                    });
                } catch (reason) {
                    console.error("Failed to load chat conversations: ", reason);
                    dispatch({ type: ChatActionType.Error });
                }
            };

            loadData();
        }
    }, [user]);

    // Handle websocket events
    useEffect(() => {
        const service = wsService.current;

        const handleMessage = (data: Message) => {
            dispatch({ type: ChatActionType.ReceiveMessage, payload: data });
        };

        const handleConnect = () =>
            dispatch({
                type: ChatActionType.SetConnectionStatus,
                payload: ConnectionStatus.Connected,
            });
        const handleDisconnect = () =>
            dispatch({
                type: ChatActionType.SetConnectionStatus,
                payload: ConnectionStatus.Disconnected,
            });
        const handleError = () =>
            dispatch({ type: ChatActionType.SetConnectionStatus, payload: ConnectionStatus.Error });

        service.on("message", handleMessage);
        service.on("connect", handleConnect);
        service.on("disconnect", handleDisconnect);
        service.on("error", handleError);
    }, []);

    useEffect(() => {
        if (currentRoom) {
            const fetchMessages = async () => {
                try {
                    const messagesData = await apiService.current.getMessages(currentRoom.id);
                    dispatch({
                        type: ChatActionType.SetMessages,
                        payload: messagesData,
                    });
                } catch (error) {
                    console.error("Error fetching messages: ", error);
                }
            };
            fetchMessages();
        }
    }, [currentRoom]);

    const handleLogin = async (credentials: LoginCredentials) => {
        dispatch({ type: ChatActionType.LoginStart });

        try {
            const result = await apiService.current.login(credentials);
            dispatch({
                type: ChatActionType.LoginSuccess,
                payload: { user: result.user },
            });
            return true;
        } catch (error) {
            console.log(error);
            dispatch({ type: ChatActionType.Error });
            return false;
        }
    };

    const handleRegistration = async (credentials: RegistrationCredentials) => {
        dispatch({ type: ChatActionType.RegistrationStart });

        try {
            const result = await apiService.current.register(credentials);
            dispatch({
                type: ChatActionType.RegistrationSuccess,
                payload: { user: result.user },
            });
            return true;
        } catch (error) {
            console.log(error);
            dispatch({ type: ChatActionType.Error });
            return false;
        }
    };

    const handleLogout = async () => {
        try {
            await apiService.current.logout();
        } catch (error) {
            console.error("Logout error: ", error);
        } finally {
            wsService.current.disconnect();
            dispatch({ type: ChatActionType.Logout });
        }
    };

    const handleRoomSelect = useCallback(
        async (room: ChatRoom) => {
            if (currentRoom?.id === room.id) return;
            setReplyingTo(null);
            dispatch({ type: ChatActionType.SelectRoom, payload: room });
        },
        [currentRoom],
    );

    const handleCreateRoom = async (roomName: string) => {
        try {
            const newRoom = await apiService.current.createRoom(roomName);
            const updatedRooms = [...rooms, newRoom];
            dispatch({ type: ChatActionType.SetRooms, payload: updatedRooms });
            handleRoomSelect(newRoom);
        } catch (error) {
            console.error("Failed to create room: ", error);
            throw error;
        }
    };

    const handleSendMessage = async (content: string, files: File[]) => {
        if (!currentRoom) return;

        try {
            const messagePayload: MessagePayload = {
                content: content,
                room: currentRoom.id,
                media_ids: [],
            };

            if (replyingTo) {
                messagePayload.reply_to = replyingTo.id;
            }
            if (files.length > 0) {
                const uploadedMedia = await Promise.all(
                    Array.from(files).map((file) => apiService.current.sendMedia(file)),
                );
                const mediaIds = uploadedMedia.map((media) => media.id);
                messagePayload.media_ids = mediaIds;
            }

            const response = await apiService.current.sendMessage(messagePayload);
            wsService.current.sendMessage(response.data);

            if (currentRoom.unread_count > 0) {
                currentRoom.unread_count = 0;
                dispatch({ type: ChatActionType.ResetUnreadCount, payload: currentRoom.id });
            }
            setReplyingTo(null);
        } catch (error) {
            console.error("Failed to send message: ", error);
            throw error;
        }
    };

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    if (!user) {
        return (
            <AuthPage
                apiService={apiService}
                onLogin={handleLogin}
                onRegistration={handleRegistration}
            />
        );
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
                <Sidebar
                    user={user}
                    rooms={rooms}
                    currentRoom={currentRoom!}
                    onRoomSelect={handleRoomSelect}
                    onCreateRoom={handleCreateRoom}
                    onLogout={handleLogout}
                    searchTerm={searchTerm}
                    setSearchTerm={(term: string) =>
                        dispatch({ type: ChatActionType.SetSearchTerm, payload: term })
                    }
                    isMobile={isMobile}
                    isOpen={isSidebarOpen}
                    onToggle={handleSidebarToggle}
                />
                <Box
                    component="main"
                    sx={{
                        height: "100%",
                        width: {
                            xs: "100%",
                            md: `calc(100% - ${sidebarWidth}px)`,
                        },
                        marginLeft: {
                            xs: 0,
                            md: `${sidebarWidth}px`,
                        },
                    }}
                >
                    <ChatArea
                        currentRoom={currentRoom}
                        messages={messages}
                        user={user}
                        onSendMessage={handleSendMessage}
                        connectionStatus={connectionStatus}
                        replyingTo={replyingTo}
                        onSetReply={setReplyingTo}
                        onCancelReply={handleCancelReply}
                        onMenuClick={handleSidebarToggle}
                        onReplyClick={handleReplyClick}
                        highlightedMessageId={highlightedMessageId}
                    />
                </Box>
            </Box>
        </ThemeProvider>
    );
};
