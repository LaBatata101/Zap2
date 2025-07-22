export type User = {
    id: number;
    username: string;
    is_superuser: boolean;
    profile: UserProfile;
};

export type UserProfile = {
    bio: string;
    avatar_img?: string;
};

export type Media = {
    id: number;
    file: string;
};

export type Message = {
    id: number;
    room: number;
    user: User;
    content: string;
    timestamp: string;
    reply_to?: Message;
    media?: Media[];
};

export type MessagePayload = {
    room: number;
    content: string;
    reply_to_id?: number;
    media_ids: number[];
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

export type PaginatedResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

export type CropAvatarData = {
    x: number;
    y: number;
    scale: number;
    containerWidth: number;
    containerHeight: number;
    cropSize: number;
};
