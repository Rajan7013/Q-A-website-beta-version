/**
 * Shared In-Memory Chat Storage
 * Allows both History API and Query Logic to access conversation context.
 */

const chatHistories = new Map();

export const chatMemory = {
    get: (userId) => chatHistories.get(userId) || [],

    set: (userId, chats) => chatHistories.set(userId, chats),

    getSession: (userId, sessionId) => {
        const chats = chatHistories.get(userId) || [];
        return chats.find(c => c.sessionId === sessionId);
    },

    saveSession: (userId, sessionData) => {
        let chats = chatHistories.get(userId) || [];
        const index = chats.findIndex(c => c.sessionId === sessionData.sessionId);

        if (index >= 0) {
            chats[index] = { ...chats[index], ...sessionData };
        } else {
            chats.unshift(sessionData);
        }

        // Limit to 50 chats per user
        if (chats.length > 50) chats = chats.slice(0, 50);

        chatHistories.set(userId, chats);
        return chats[index >= 0 ? index : 0];
    },

    deleteSession: (userId, sessionId) => {
        let chats = chatHistories.get(userId) || [];
        const initialLen = chats.length;
        chats = chats.filter(c => c.sessionId !== sessionId);
        chatHistories.set(userId, chats);
        return chats.length !== initialLen;
    },

    getRecentMessages: (userId, sessionId, limit = 6) => {
        const chats = chatHistories.get(userId) || [];
        const session = chats.find(c => c.sessionId === sessionId);
        if (!session || !session.messages) return [];

        // Return last N messages (excluding system messages if you strictly want conversation)
        return session.messages.slice(-limit);
    }
};
