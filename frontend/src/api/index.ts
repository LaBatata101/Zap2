import {
    ChatRoom,
    CropAvatarData,
    LoginCredentials,
    Media,
    Message,
    MessagePayload,
    PaginatedResponse,
    RegistrationCredentials,
    User,
} from "./types";

export const baseURL = "http://localhost:8000";

const API_CONFIG = {
    apiUrl: `${baseURL}/api`,
    wsUrl: "ws://localhost:8000/ws",
};

export class APIService {
    baseApiUrl: string;

    constructor() {
        this.baseApiUrl = API_CONFIG.apiUrl;
    }

    async request(endpoint: string, options: RequestInit = {}, isFormData: boolean = false) {
        const requestURL = endpoint.startsWith("http") ? endpoint : `${this.baseApiUrl}${endpoint}`;

        const headers = {
            "X-CSRFToken": await this.getCSRF(),
            ...options.headers,
        };

        if (!isFormData) {
            // @ts-ignore
            headers["Content-Type"] = "application/json";
        }

        const config: RequestInit = {
            headers: headers,
            credentials: "include",
            ...options,
        };

        try {
            const response = await fetch(requestURL, config);

            if (response.status === 500) {
                throw new Error("INTERNAL SERVER ERROR!");
            }
            const contentLength = response.headers.get("Content-Length");
            return contentLength === "0"
                ? { status: response.status }
                : { data: await response.json(), status: response.status };
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }

    async getCSRF() {
        const response = await fetch(`${this.baseApiUrl}/csrf/`, { credentials: "include" });
        if (!response.ok) {
            throw new Error("Failed to get CSRF token");
        }
        const data = await response.json();
        return data.csrf_token;
    }

    async login(credentials: LoginCredentials) {
        const response = await fetch(`${API_CONFIG.apiUrl}/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": await this.getCSRF(),
            },
            credentials: "include",
            body: JSON.stringify(credentials),
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        }
        throw new Error(`Login failed: ${await response.text()}`);
    }

    async register(credentials: RegistrationCredentials) {
        const response = await this.request("/user/", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
        if (response.status !== 201) {
            throw new Error(`Registration failed: ${response.data}`);
        }
        return response.data;
    }

    async logout() {
        await fetch(`${API_CONFIG.apiUrl}/logout/`, {
            method: "POST",
            credentials: "include",

            headers: {
                "X-CSRFToken": await this.getCSRF(),
            },
        });
    }

    // Chat methods
    async getRooms(): Promise<PaginatedResponse<ChatRoom>> {
        const response = await this.request("/rooms/");
        return response.data;
    }

    async getRoomMembers(roomId: number): Promise<User[]> {
        const response = await this.request(`/rooms/${roomId}/members/`);
        return response.data;
    }

    async updateChatMemberAdminStatus(roomId: number, username: string, value: boolean) {
        const response = await this.request(`/rooms/${roomId}/update-admin/`, {
            method: "POST",
            body: JSON.stringify({ username, is_admin: value }),
        });
        return response.data;
    }

    async createRoom(name: string): Promise<ChatRoom> {
        const response = await this.request("/rooms/", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        return response.data;
    }

    async getMessages(
        roomId: number,
        next: string | null = null,
    ): Promise<PaginatedResponse<Message>> {
        var response = undefined;
        if (next) {
            const url = new URL(next);
            url.searchParams.set("room", `${roomId}`);
            response = await this.request(url.toString());
        } else {
            response = await this.request(`/messages/?room=${roomId}`);
        }
        return response.data;
    }

    async sendMessage(message: MessagePayload) {
        return this.request("/messages/", {
            method: "POST",
            body: JSON.stringify(message),
        });
    }

    async deleteMessage(messageId: number) {
        this.request(`/messages/${messageId}/`, {
            method: "DELETE",
        });
    }

    async editMessage(messageId: number, newContent: string) {
        return this.request(`/messages/${messageId}/`, {
            method: "PATCH",
            body: JSON.stringify({ content: newContent }),
        });
    }

    async sendMedia(file: File): Promise<Media> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.request(
            "/media/",
            {
                method: "POST",
                body: formData,
            },
            true,
        );
        if (response.status != 201) {
            throw new Error("Failed to upload media");
        }
        return response.data;
    }

    async startDirectMessage(username: string): Promise<ChatRoom> {
        const response = await this.request(`/user/${username}/start-dm/`, {
            method: "POST",
        });
        return response.data;
    }

    async updateRoom(
        roomId: number,
        updatedRoom: {
            name: string;
            description: string;
            avatar_img: File | null;
            crop_avatar_data: CropAvatarData | null;
        },
    ) {
        const formData = new FormData();
        formData.append("name", updatedRoom.name);
        formData.append("description", updatedRoom.description);

        if (updatedRoom.avatar_img) {
            formData.append("avatar_img", updatedRoom.avatar_img, updatedRoom.avatar_img.name);
            if (updatedRoom.crop_avatar_data) {
                const cropData = updatedRoom.crop_avatar_data;
                formData.append("crop_x", cropData.x.toString());
                formData.append("crop_y", cropData.y.toString());
                formData.append("crop_size", cropData.cropSize.toString());
                formData.append("crop_scale", cropData.scale.toString());
                formData.append("crop_container_width", cropData.containerWidth.toString());
                formData.append("crop_container_height", cropData.containerHeight.toString());
            }
        }

        return this.request(
            `/rooms/${roomId}/`,
            {
                method: "PATCH",
                body: formData,
            },
            true,
        );
    }

    // User methods
    async checkIfUserExists(username: string): Promise<boolean> {
        const response = await this.request(`/user/exists/${username}/`);
        return response.status === 302;
    }

    async getUser(username: string): Promise<User> {
        const response = await this.request(`/user/${username}`);
        return response.data;
    }

    async updateUserInfo(
        username: string,
        updatedUser: {
            username?: string;
            profile?: {
                bio?: string;
                avatar_img: File | null;
                crop_avatar_data: CropAvatarData | null;
            };
        },
    ) {
        const formData = new FormData();
        if (updatedUser.username) {
            formData.append("username", updatedUser.username);
        }
        if (updatedUser.profile?.bio) {
            formData.append("profile.bio", updatedUser.profile.bio);
        }

        if (updatedUser.profile?.avatar_img) {
            formData.append(
                "profile.avatar_img",
                updatedUser.profile.avatar_img,
                updatedUser.profile.avatar_img.name,
            );
            if (updatedUser.profile.crop_avatar_data) {
                const crop_avatar_data = updatedUser.profile.crop_avatar_data;
                formData.append("crop_x", crop_avatar_data.x.toString());
                formData.append("crop_y", crop_avatar_data.y.toString());
                formData.append("crop_size", crop_avatar_data.cropSize.toString());
                formData.append("crop_scale", crop_avatar_data.scale.toString());
                formData.append("crop_container_width", crop_avatar_data.containerWidth.toString());
                formData.append(
                    "crop_container_height",
                    crop_avatar_data.containerHeight.toString(),
                );
            }
        }

        return await this.request(
            `/user/${username}/`,
            {
                method: "PATCH",
                body: formData,
            },
            true,
        );
    }
}
type ConnectCallback = () => void;
type DisconnectCallback = () => void;
type MessageCallback = (data: any) => void;
type ErrorCallback = (error: any) => void;

type EventCallback = ConnectCallback | DisconnectCallback | MessageCallback | ErrorCallback;

enum EventType {
    connect,
    message,
    disconnect,
    error,
}

type EventTypeStrings = keyof typeof EventType;

type Event =
    | { type: EventType.connect | EventType.disconnect; data?: undefined }
    | { type: EventType.message; data: Message }
    | { type: EventType.error; data: any };

export class WebSocketService {
    socket?: WebSocket;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    shouldReconnect: boolean;
    listeners: Map<EventType, EventCallback | undefined>;

    constructor() {
        this.socket = undefined;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
        this.shouldReconnect = true;
    }

    connect() {
        if (this.socket) {
            this.shouldReconnect = false;
            this.socket.close();
        }

        this.shouldReconnect = true;
        const wsUrl = `${API_CONFIG.wsUrl}/chat/`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
            this.emit({ type: EventType.connect });
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.emit({ type: EventType.message, data });
        };

        this.socket.onclose = () => {
            console.log("WebSocket disconnected");
            this.emit({ type: EventType.disconnect });
            if (this.shouldReconnect) {
                this.handleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.emit({ type: EventType.error, data: error });
        };
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    sendMessage(message: Message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "send_message", message }));
        }
    }

    editMessage(message: Message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "edit_message", message }));
        }
    }

    deleteMessage(messageId: number, roomId: number) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(
                JSON.stringify({ type: "delete_message", message_id: messageId, room: roomId }),
            );
        }
    }

    on(event: EventTypeStrings, callback: EventCallback) {
        const key = EventType[event];
        if (!this.listeners.has(key)) {
            this.listeners.set(key, callback);
        }
    }

    off(event: EventTypeStrings) {
        const key = EventType[event];
        if (this.listeners.has(key)) {
            this.listeners.set(key, undefined);
        }
    }

    emit(event: Event) {
        if (this.listeners.has(event.type)) {
            const callback = this.listeners.get(event.type)!;
            callback(event.data);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
        this.listeners.clear();
    }
}
