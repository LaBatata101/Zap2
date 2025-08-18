const locale = new Intl.DateTimeFormat().resolvedOptions().locale;

export const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([locale], { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString([locale], {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    }
};

export const formatDate2 = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([locale], { hour: "2-digit", minute: "2-digit" });
    } else {
        return date.toLocaleDateString([locale], {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    }
};
