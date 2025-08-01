import { useEffect, useRef, useReducer, useState, useCallback } from "react";
import { AuthPage } from "./authentication";
import { APIService, WebSocketService } from "../api";
import { Sidebar, sidebarWidth } from "../components/sidebar";
import { ChatArea } from "../components/chat_area";
import {
    ChatRoom,
    CropAvatarData,
    LoginCredentials,
    Message,
    MessagePayload,
    RegistrationCredentials,
    User,
    WebSocketEvent,
} from "../api/types";
import { Box, ThemeProvider, useMediaQuery, useTheme } from "@mui/material";
import { darkTheme } from "../theme";

enum ChatActionType {
    RegistrationStart,
    LoginStart,
    RegistrationSuccess,
    SetUser,
    Logout,
    SelectRoom,
    SetInitialMessages,
    PrependMessages,
    AddRoom,
    SetRooms,
    UpdateRoom,
    ResetUnreadCount,
    SetConnectionStatus,
    SetSearchTerm,
    SetHighlightedMessage,
    SetMessagesLoading,
    SendMessage,
    DeleteMessage,
    EditMessage,
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
    hasMoreMessages: boolean;
    nextMessagesUrl: string | null;
    messagesLoading: boolean;
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
          type: ChatActionType.SetUser | ChatActionType.RegistrationSuccess;
          payload: { user: User };
      }
    | { type: ChatActionType.SelectRoom; payload: ChatRoom }
    | {
          type: ChatActionType.PrependMessages | ChatActionType.SetInitialMessages;
          payload: { messages: Message[]; next: string | null; hasMore: boolean };
      }
    | { type: ChatActionType.AddRoom; payload: ChatRoom }
    | { type: ChatActionType.SetRooms; payload: ChatRoom[] }
    | { type: ChatActionType.SetConnectionStatus; payload: ConnectionStatus }
    | { type: ChatActionType.SetSearchTerm; payload: string }
    | { type: ChatActionType.SetMessagesLoading; payload: boolean }
    | { type: ChatActionType.SetHighlightedMessage; payload?: number }
    | { type: ChatActionType.UpdateRoom; payload: ChatRoom }
    | { type: ChatActionType.ResetUnreadCount; payload: number }
    | {
          type: ChatActionType.DeleteMessage;
          payload: {
              messageId: number;
              roomId: number;
              lastMessage?: { username: string; content: string; timestamp: string; room: number };
          };
      }
    | { type: ChatActionType.SendMessage; payload: Message }
    | { type: ChatActionType.EditMessage; payload: Message };

const initialState: ChatState = {
    user: undefined,
    rooms: [],
    currentRoom: undefined,
    messages: [],
    connectionStatus: ConnectionStatus.Connected,
    searchTerm: "",
    highlightedMessageId: undefined,
    hasMoreMessages: true,
    nextMessagesUrl: null,
    messagesLoading: false,
};

function chatReducer(state: ChatState, action: ChatAction) {
    switch (action.type) {
        case ChatActionType.RegistrationStart:
        case ChatActionType.LoginStart:
            return { ...state };
        case ChatActionType.RegistrationSuccess:
        case ChatActionType.SetUser:
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
                nextMessagesUrl: null,
                hasMoreMessages: false,
            };
        case ChatActionType.SetRooms:
            return {
                ...state,
                rooms: action.payload,
            };
        case ChatActionType.AddRoom:
            if (state.rooms.some((room) => room.id === action.payload.id)) {
                return state;
            }
            return {
                ...state,
                rooms: [...state.rooms, action.payload],
            };
        case ChatActionType.EditMessage: {
            const updatedMessage = action.payload;
            const { rooms, messages } = state;

            const messageIdx = messages.findIndex((message) => message.id === updatedMessage.id);
            messages[messageIdx] = updatedMessage;

            let updatedRooms = rooms;
            if (messageIdx === messages.length - 1) {
                updatedRooms = rooms.map((room) =>
                    room.id === updatedMessage.room
                        ? {
                              ...room,
                              last_message: {
                                  username: updatedMessage.user.username,
                                  message: updatedMessage.content,
                                  timestamp: updatedMessage.timestamp,
                              },
                          }
                        : room,
                );
            }

            return {
                ...state,
                rooms: updatedRooms,
                messages,
            };
        }
        case ChatActionType.SendMessage: {
            const message = action.payload;
            const { rooms, currentRoom, messages } = state;

            const updatedRooms = rooms.map((room) =>
                room.id === message.room
                    ? {
                          ...room,
                          last_message: {
                              username: message.user.username,
                              message: message.content,
                              timestamp: message.timestamp,
                          },
                          // Only increment unread count if the room is not active
                          // and the message is not from the current user
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
        case ChatActionType.SetInitialMessages:
            return {
                ...state,
                messages: action.payload.messages.slice().reverse(),
                nextMessagesUrl: action.payload.next,
                hasMoreMessages: action.payload.hasMore,
            };
        case ChatActionType.PrependMessages:
            return {
                ...state,
                messages: [...action.payload.messages.slice().reverse(), ...state.messages],
                nextMessagesUrl: action.payload.next,
                hasMoreMessages: action.payload.hasMore,
            };
        case ChatActionType.SetConnectionStatus:
            return { ...state, connectionStatus: action.payload };
        case ChatActionType.SetSearchTerm:
            return { ...state, searchTerm: action.payload };
        case ChatActionType.SetHighlightedMessage:
            return { ...state, highlightedMessageId: action.payload };
        case ChatActionType.SetMessagesLoading:
            return { ...state, messagesLoading: action.payload };
        case ChatActionType.UpdateRoom:
            return {
                ...state,
                rooms: state.rooms.map((room) =>
                    room.id === action.payload.id ? action.payload : room,
                ),
                currentRoom:
                    state.currentRoom?.id === action.payload.id
                        ? action.payload
                        : state.currentRoom,
            };
        case ChatActionType.DeleteMessage:
            const lastMessage = action.payload.lastMessage;
            const updatedRooms = state.rooms.map((room) =>
                room.id === action.payload.roomId
                    ? {
                          ...room,
                          last_message: lastMessage
                              ? {
                                    username: lastMessage.username,
                                    message: lastMessage.content,
                                    timestamp: lastMessage.timestamp,
                                }
                              : undefined,
                          unread_count: lastMessage ? room.unread_count - 1 : room.unread_count,
                      }
                    : room,
            );

            return {
                ...state,
                rooms: updatedRooms,
                messages: state.messages.filter(
                    (message) => message.id !== action.payload.messageId,
                ),
            };
        default:
            //@ts-ignore
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
        hasMoreMessages,
        nextMessagesUrl,
        messagesLoading,
    } = state;

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [messageEdit, setMessageEdit] = useState<Message | null>(null);

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

    // Handle websocket events
    useEffect(() => {
        const service = wsService.current;

        const handleMessage = (event: WebSocketEvent) => {
            switch (event.type) {
                case "send_message":
                    dispatch({ type: ChatActionType.SendMessage, payload: event.message });
                    break;
                case "edit_message":
                    dispatch({ type: ChatActionType.EditMessage, payload: event.message });
                    break;
                case "delete_message":
                    dispatch({
                        type: ChatActionType.DeleteMessage,
                        payload: {
                            messageId: event.message_id,
                            roomId: event.room,
                            lastMessage: event.last_message,
                        },
                    });
                    break;
                default:
                    //@ts-ignore
                    console.error("WebSocket event not handled: ", event.type);
            }
        };

        const handleConnect = () =>
            dispatch({
                type: ChatActionType.SetConnectionStatus,
                payload: ConnectionStatus.Connected,
            });
        const handleDisconnect = () => {
            dispatch({
                type: ChatActionType.SetConnectionStatus,
                payload: ConnectionStatus.Disconnected,
            });
        };
        const handleError = () =>
            dispatch({ type: ChatActionType.SetConnectionStatus, payload: ConnectionStatus.Error });

        service.on("message", handleMessage);
        service.on("connect", handleConnect);
        service.on("disconnect", handleDisconnect);
        service.on("error", handleError);
    }, []);

    // Initial load of messages when a chat is selected
    useEffect(() => {
        if (currentRoom) {
            const fetchMessages = async () => {
                try {
                    const messagesData = await apiService.current.getMessages(currentRoom.id);
                    dispatch({
                        type: ChatActionType.SetInitialMessages,
                        payload: {
                            messages: messagesData.results,
                            next: messagesData.next,
                            hasMore: messagesData.next !== null,
                        },
                    });
                } catch (error) {
                    console.error("Error fetching messages: ", error);
                }
            };
            fetchMessages();
        }
    }, [currentRoom]);

    const fetchMoreMessages = useCallback(async () => {
        if (!nextMessagesUrl || !hasMoreMessages || messagesLoading) return;

        dispatch({ type: ChatActionType.SetMessagesLoading, payload: true });
        try {
            const messagesData = await apiService.current.getMessages(
                currentRoom!.id,
                nextMessagesUrl,
            );
            dispatch({
                type: ChatActionType.PrependMessages,
                payload: {
                    messages: messagesData.results,
                    next: messagesData.next,
                    hasMore: messagesData.next !== null,
                },
            });
        } catch (e) {
            console.error("Error fetching messages: ", e);
        } finally {
            dispatch({ type: ChatActionType.SetMessagesLoading, payload: false });
        }
    }, [nextMessagesUrl]);

    const handleLogin = async (credentials: LoginCredentials) => {
        dispatch({ type: ChatActionType.LoginStart });

        try {
            const result = await apiService.current.login(credentials);
            dispatch({
                type: ChatActionType.SetUser,
                payload: { user: result.user },
            });

            wsService.current.connect();

            const loadData = async () => {
                try {
                    const roomsData = await apiService.current.getRooms();
                    dispatch({
                        type: ChatActionType.SetRooms,
                        payload: roomsData.results,
                    });
                } catch (reason) {
                    console.error("Failed to load chat conversations: ", reason);
                    dispatch({ type: ChatActionType.Error });
                }
            };

            loadData();

            return true;
        } catch (error) {
            console.error(error);
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
            console.error(error);
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

    const handleUpdateRoom = async (
        roomId: number,
        name: string,
        description: string,
        avatar: File | null,
        cropAvatarData: CropAvatarData | null,
    ) => {
        try {
            const response = await apiService.current.updateRoom(roomId, {
                name,
                description,
                avatar_img: avatar,
                crop_avatar_data: cropAvatarData,
            });

            if (response.status === 200) {
                dispatch({ type: ChatActionType.UpdateRoom, payload: response.data });
                return true;
            }
        } catch (error) {
            console.error("Failed to update room:", error);
        }
        return false;
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
                messagePayload.reply_to_id = replyingTo.id;
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

    const handleDeleteMessage = async (message: Message) => {
        try {
            await apiService.current.deleteMessage(message.id);
            wsService.current.deleteMessage(message.id, message.room);
        } catch (error) {
            console.error("Failed to delete message: ", error);
        }
    };

    const handleEditMessage = async (newContent: string) => {
        try {
            const response = await apiService.current.editMessage(messageEdit!.id, newContent);
            wsService.current.editMessage(response.data);

            setMessageEdit(null);
        } catch (error) {
            console.error("Failed to edit message: ", error);
        }
    };

    const handleStartDirectMessage = useCallback(
        async (targetUser: User) => {
            if (!user || user.id === targetUser.id) return;
            try {
                const room = await apiService.current.startDirectMessage(targetUser.username);
                dispatch({ type: ChatActionType.AddRoom, payload: room });
                handleRoomSelect(room);
            } catch (error) {
                console.error("Failed to start direct message:", error);
            }
        },
        [user, handleRoomSelect],
    );

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    const handleCancelMessageEdit = useCallback(() => {
        setMessageEdit(null);
    }, []);

    const handleUpdateUserProfile = async (
        username: string,
        bio: string,
        avatar: File | null,
        cropAvatarData: CropAvatarData | null,
    ) => {
        try {
            const response = await apiService.current.updateUserInfo(username, {
                username,
                profile: { bio, avatar_img: avatar, crop_avatar_data: cropAvatarData },
            });

            if (response.status === 200) {
                dispatch({
                    type: ChatActionType.SetUser,
                    payload: { user: response.data },
                });
            }
            return response.status === 200;
        } catch (error) {
            console.error("Failed to update user info: ", error);
        }
        return false;
    };

    const loadGroupMembers = async (members: string[]) => {
        return await Promise.all(
            members.map((member) => {
                return apiService.current.getUser(member);
            }),
        );
    };

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
                    onUpdateProfile={handleUpdateUserProfile}
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
                        onEditMessageComplete={handleEditMessage}
                        connectionStatus={connectionStatus}
                        replyingTo={replyingTo}
                        onSetReply={setReplyingTo}
                        messageEdit={messageEdit}
                        onMessageEdit={setMessageEdit}
                        onCancelReply={handleCancelReply}
                        onCancelMessageEdit={handleCancelMessageEdit}
                        onMenuClick={handleSidebarToggle}
                        onReplyClick={handleReplyClick}
                        highlightedMessageId={highlightedMessageId}
                        onFetchMoreMessages={fetchMoreMessages}
                        hasMoreMessages={hasMoreMessages}
                        messagesLoading={messagesLoading}
                        onUpdateRoom={handleUpdateRoom}
                        onLoadMembers={loadGroupMembers}
                        onStartDirectMessage={handleStartDirectMessage}
                        onDeleteMessage={handleDeleteMessage}
                    />
                </Box>
            </Box>
        </ThemeProvider>
    );
};
