import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { messagesDB } from "../lib/pouchdb";
import Logger from "../utils/logger";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    areOlderMessagesAvailable: true,
    areOlderMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });

        try {
            // 1. Try from PouchDB first
            try {
                const localDocs = await messagesDB.find({
                    selector: {
                        chatId: { $eq: userId },
                    },
                    limit: Number.MAX_SAFE_INTEGER
                });
                if (localDocs?.docs?.length > 0) {
                    set({ messages: localDocs.docs });
                    return;
                }
            } catch (error) {
                Logger.error("Error getting messages from PouchDB", error);
            }

            // 2. Fallback: API call - get latest messages

            const timeNow = new Date().toISOString();
            const res = await axiosInstance.get(`/messages/${userId}/${timeNow}`);
            const messages = res.data.messages || res.data;
            set({
                messages: messages,
            });

            // 3. Update localDB
            try {
                await Promise.all(
                    messages.map(async (msg) => {
                        try {
                            Logger.info("Saving message to PouchDB", msg);
                            await messagesDB.put({ ...msg, _id: msg.id, chatId: userId });
                        } catch (err) {
                            if (err.status !== 409) {
                                console.error("PouchDB put error", err);
                            }
                        }
                    })
                );
            } catch (error) {
                Logger.error("Error saving messages to PouchDB", error);
            }

        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    getOlderMessages: async (userId, lastMessageTime) => {
        console.log('getOlderMessages called with:', { userId, lastMessageTime });
        set({ areOlderMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}/${lastMessageTime}`);
            Logger.debug('API response:', res.data);

            // Handle both res.data.messages and res.data formats
            const olderMessages = res.data.messages || res.data;
            Logger.debug('Older messages:', olderMessages);

            if (!olderMessages || olderMessages.length === 0) {
                Logger.debug('No older messages available');
                set({ areOlderMessagesAvailable: false });
                return;
            }

            const currentMessages = get().messages;
            Logger.debug('Current messages count:', currentMessages.length);
            Logger.debug('Older messages count:', olderMessages.length);

            // Prepend older messages to the beginning of the current messages array
            const updatedMessages = [...olderMessages, ...currentMessages];
            Logger.debug('Updated messages count:', updatedMessages.length);

            set({
                messages: updatedMessages,
            });

            // Update localDB
            try {
                await Promise.all(
                    olderMessages.map(async (msg) => {
                        try {
                            Logger.info("Saving message to PouchDB", msg);
                            await messagesDB.put({ ...msg, _id: msg.id, chatId: userId });
                        } catch (err) {
                            if (err.status !== 409) {
                                console.error("PouchDB put error", err);
                            }
                        }
                    })
                );
            } catch (error) {
                Logger.error("Error saving messages to PouchDB", error);
            }

        } catch (error) {
            console.error('Error loading older messages:', error);
            toast.error(error?.response?.data?.message || "Failed to load older messages");
        } finally {
            set({ areOlderMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);

            const newMessage = res.data;

            set({ messages: [...messages, res.data] });

            // save to pouchDB
            try {
                await messagesDB.put({
                    ...newMessage,
                    _id: newMessage.id,
                    chatId: selectedUser._id,
                });
            } catch (err) {
                if (err.status !== 409) {
                    console.error("PouchDB put error", err);
                }
                Logger.error("Error saving sent message to PouchDB", err);
            }

        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: async () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (isMessageSentFromSelectedUser) {
                set({
                    messages: [...get().messages, newMessage],
                });
            }
            try {
                const audio = new Audio("/notification.mp3");
                audio.play().catch((err) => {
                    // Some browsers block autoplay unless user interacted
                    console.warn("Audio play failed:", err);
                });
            } catch (err) {
                console.error("Audio error:", err);
            }

            // save to pouchDB
            try {
                messagesDB.put({
                    ...newMessage,
                    _id: newMessage.id,
                    chatId: newMessage.senderId,
                });
            } catch (err) {
                if (err.status !== 409) {
                    console.error(`PouchDB put error ${err}`);
                }
                Logger.error(`Error saving received message to PouchDB ${err}`);
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser, areOlderMessagesAvailable: true }),
}));
