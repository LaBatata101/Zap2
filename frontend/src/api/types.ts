export type User = {
    id: number;
    username: string;
    is_admin: boolean;
};

export type Message = {
    id: number;
    room: number;
    user: User;
    content: string;
    timestamp: string;
    reply_to?: Message;
};

export type ChatRoom = {
    id: number;
    name: string;
    last_message?: string;
    last_message_timestamp?: string;
    unread_count: number;
};

export type LoginCredentials = {
    username: string;
    password: string;
};

export type RegistrationCredentials = {
    username: string;
    email: string;
    password: string;
};
