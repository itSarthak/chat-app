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
            // 1. Try from PouchDB
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

            // 2. Fallback: API call
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });

            // 3. Update localDB
            try {
                await Promise.all(
                    res.data.map(async (msg) => {
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
            const isMessageSentFromSelectedUser = newMessage.sender._id === selectedUser._id;
            if (isMessageSentFromSelectedUser) {
                set({
                    messages: [...get().messages, newMessage],
                });
            }
            // save to pouchDB
            try {
                messagesDB.put({
                    ...newMessage,
                    _id: newMessage.id,
                    chatId: newMessage.sender._id,
                });
            } catch (err) {
                if (err.status !== 409) {
                    console.error("PouchDB put error", err);
                }
                Logger.error("Error saving received message to PouchDB", err);
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
