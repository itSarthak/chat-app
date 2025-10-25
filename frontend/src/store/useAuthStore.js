import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from "socket.io-client";

// const BASE_URL = "https://www.chatbackend.space/"
const BASE_URL = import.meta.env.VITE_SOCKET_URL

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');
            set({ authUser: res.data });
            get().connectSocket()
            // Initialize friend store data
            setTimeout(async () => {
                try {
                    const { useFriendStore } = await import('./useFriendStore');
                    const friendStore = useFriendStore.getState();
                    friendStore.getFriendRequests();
                    // friendStore.getSentRequests();
                    // friendStore.getFriends();
                } catch (error) {
                    console.error('Error initializing friend store:', error);
                }
            }, 1000);
        }
        catch (error) {

            console.error('Error checking authentication:', error);
            set({ authUser: null });
        }
        finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: res.data });
            toast.success('Account created successfully!');
            get().connectSocket()
            // Initialize friend store data after signup
            setTimeout(async () => {
                const { useFriendStore } = await import('./useFriendStore');
                const friendStore = useFriendStore.getState();
                friendStore.getFriendRequests();
                // friendStore.getSentRequests();
                // friendStore.getFriends();
            }, 1000);
        } catch (error) {
            console.error('Error during signup:', error);
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }

    },
    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({ authUser: null });
            toast.success('Logged out successfully!');
            get().disconnectSocket()
        } catch (error) {
            console.error('Error during logout:', error);
            toast.error('Failed to log out. Please try again.');
        }
    },
    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post('/auth/login', data);
            console.log(res.data);
            set({ authUser: res.data });
            toast.success('Logged in successfully!');
            get().connectSocket()
            // Initialize friend store data after login
            setTimeout(async () => {
                const { useFriendStore } = await import('./useFriendStore');
                const friendStore = useFriendStore.getState();
                friendStore.getFriendRequests();
                // friendStore.getSentRequests();
                // friendStore.getFriends();
            }, 1000);
        } catch (error) {
            console.error('Error during login:', error);
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },
    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put('/profile/update/avatar', data);
            set({ authUser: res.data });
            toast.success('Profile updated successfully!');
        }
        catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message);

        }
        finally {
            set({ isUpdatingProfile: false });
        }
    },
    connectSocket: () => {
        const { authUser } = get()
        if (!authUser || get().socket?.connected)
            return;
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        })
        socket.connect()

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds })
        })

        // Initialize friend store socket events
        setTimeout(async () => {
            const { useFriendStore } = await import('./useFriendStore');
            const friendStore = useFriendStore.getState();
            if (friendStore.subscribeToFriendEvents) {
                friendStore.subscribeToFriendEvents();
            }
        }, 500);
    },
    disconnectSocket: async () => {
        // Unsubscribe from friend events before disconnecting
        try {
            const { useFriendStore } = await import('./useFriendStore');
            const friendStore = useFriendStore.getState();
            if (friendStore.unsubscribeFromFriendEvents) {
                friendStore.unsubscribeFromFriendEvents();
            }
        } catch (error) {
            console.error('Error unsubscribing from friend events:', error);
        }

        if (get().socket?.connected)
            get().socket.disconnect()
    },

}));