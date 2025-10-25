import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  friendRequests: [],
  sentRequests: [],
  friends: [],
  isFriendRequestsLoading: false,
  isSendingRequest: false,

  // Get incoming friend requests
  getFriendRequests: async () => {
    set({ isFriendRequestsLoading: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      console.log(res.data);
      set({ friendRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch friend requests");
    } finally {
      set({ isFriendRequestsLoading: false });
    }
  },

  // Get sent friend requests
  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("Failed to fetch sent requests:", error);
    }
  },

  // Get friends list
  // getFriends: async () => {
  //   try {
  //     const res = await axiosInstance.get("/friends");
  //     set({ friends: res.data });
  //   } catch (error) {
  //     console.error("Failed to fetch friends:", error);
  //   }
  // },

  // Send friend request
  sendFriendRequest: async (userId) => {
    set({ isSendingRequest: true });
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      const { sentRequests } = get();
      set({ sentRequests: [...sentRequests, res.data] });
      toast.success("Friend request sent!");

      // Emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("friendRequestSent", { recipientId: userId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send friend request");
    } finally {
      set({ isSendingRequest: false });
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      const res = await axiosInstance.put(`/friends/requests/accepted/${requestId}`);
      const { friendRequests, friends } = get();

      // Remove from friend requests and add to friends
      set({
        friendRequests: friendRequests.filter(req => req._id !== requestId),
        friends: [...friends, res.data]
      });

      toast.success("Friend request accepted!");

      // Emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("friendRequestAccepted", { requestId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept friend request");
    }
  },

  // Decline friend request
  declineFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/decline/${requestId}`);
      const { friendRequests } = get();

      set({
        friendRequests: friendRequests.filter(req => req._id !== requestId)
      });

      toast.success("Friend request declined");

      // Emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("friendRequestDeclined", { requestId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline friend request");
    }
  },

  // Cancel sent friend request
  cancelFriendRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/cancel/${requestId}`);
      const { sentRequests } = get();

      set({
        sentRequests: sentRequests.filter(req => req._id !== requestId)
      });

      toast.success("Friend request cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel friend request");
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      const { friends } = get();

      set({
        friends: friends.filter(friend => friend._id !== friendId)
      });

      toast.success("Friend removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
    }
  },

  // Subscribe to friend request events
  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newFriendRequest", (request) => {
      const { friendRequests } = get();
      set({ friendRequests: [...friendRequests, request] });
      toast.success(`New friend request from ${request.sender.fullName}`);
    });

    socket.on("friendRequestAccepted", (data) => {
      const { sentRequests, friends } = get();
      set({
        sentRequests: sentRequests.filter(req => req._id !== data.requestId),
        friends: [...friends, data.friend]
      });
      toast.success(`${data.friend.fullName} accepted your friend request!`);
    });

    socket.on("friendRequestDeclined", (data) => {
      const { sentRequests } = get();
      set({
        sentRequests: sentRequests.filter(req => req._id !== data.requestId)
      });
    });
  },

  // Unsubscribe from friend request events
  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newFriendRequest");
    socket.off("friendRequestAccepted");
    socket.off("friendRequestDeclined");
  },
}));