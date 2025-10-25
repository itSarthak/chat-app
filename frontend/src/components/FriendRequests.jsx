import React, { useEffect, useState } from 'react';
import { useFriendStore } from '../store/useFriendStore';
import { UserPlus, Check, X, Users, UserMinus, Search, Send, Inbox } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

const FriendRequests = () => {
  const {
    friendRequests,
    sentRequests,
    // friends,
    isFriendRequestsLoading,
    isSendingRequest,
    getFriendRequests,
    getSentRequests,
    // getFriends,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    removeFriend,
    subscribeToFriendEvents,
    unsubscribeFromFriendEvents
  } = useFriendStore();

  const { users } = useChatStore();
  const { authUsers } = useAuthStore();
  const [activeTab, setActiveTab] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');

  console.log("Auth User:", authUsers);
  const friends = []

  useEffect(() => {
    getFriendRequests();
    getSentRequests();
    // getFriends();
    subscribeToFriendEvents();

    return () => {
      unsubscribeFromFriendEvents();
    };
  }, []);

  // Filter users for sending friend requests (exclude friends and pending requests)
  const availableUsers = users.filter(user => {
    const isFriend = friends.some(friend => friend?._id === user._id);
    const hasSentRequest = sentRequests.some(req => req.requestReceiver._id === user._id);
    const hasReceivedRequest = friendRequests.some(req => req.requestSender._id === user._id);
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase());

    return !isFriend && !hasSentRequest && !hasReceivedRequest && matchesSearch;
  });

  const filteredFriends = friends.filter(friend =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIncomingRequests = () => (
    <div className="space-y-3">
      {friendRequests.length === 0 ? (
        <div className="text-center text-zinc-500 py-4">
          <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No friend requests</p>
        </div>
      ) : (
        friendRequests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <img
              src={request.requestSender.profilePic || "/avatar.jpg"}
              alt={request.requestSender.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className='flex-col'>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{request.requestSender.fullName}</p>
                <p className="text-sm text-zinc-500">Wants to be your friend</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => acceptFriendRequest(request.id)}
                  className="btn btn-sm btn-success"
                  title="Accept"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => declineFriendRequest(request.id)}
                  className="btn btn-sm btn-error"
                  title="Decline"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSentRequests = () => (
    <div className="space-y-3">
      {sentRequests.length === 0 ? (
        <div className="text-center text-zinc-500 py-4">
          <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No sent requests</p>
        </div>
      ) : (
        sentRequests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <img
              src={request.requestSender.profilePic || "/avatar.jpg"}
              alt={request.requestSender.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{request.requestSender.fullName}</p>
              <p className="text-sm text-zinc-500">Request pending</p>
            </div>
            <button
              onClick={() => cancelFriendRequest(request.id)}
              className="btn btn-sm btn-outline"
              title="Cancel request"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-3">
      {filteredFriends.length === 0 ? (
        <div className="text-center text-zinc-500 py-4">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{searchQuery ? 'No friends found' : 'No friends yet'}</p>
        </div>
      ) : (
        filteredFriends.map((friend) => (
          <div key={friend._id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <img
              src={friend.profilePic || "/avatar.jpg"}
              alt={friend.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{friend.fullName}</p>
              <p className="text-sm text-zinc-500">Friend</p>
            </div>
            <button
              onClick={() => removeFriend(friend._id)}
              className="btn btn-sm btn-outline btn-error"
              title="Remove friend"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderAddFriends = () => (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-bordered w-full pl-10"
        />
      </div>

      {availableUsers.length === 0 ? (
        <div className="text-center text-zinc-500 py-4">
          <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{searchQuery ? 'No users found' : 'No users available'}</p>
        </div>
      ) : (
        availableUsers.map((user) => (
          <div key={user._id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <img
              src={user.profilePic || "/avatar.jpg"}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.fullName}</p>
              <p className="text-sm text-zinc-500">Send friend request</p>
            </div>
            <button
              onClick={() => sendFriendRequest(user._id)}
              disabled={isSendingRequest}
              className="btn btn-sm btn-primary"
              title="Send friend request"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );

  if (isFriendRequestsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading loading-spinner loading-md"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-4 grid grid-cols-3 gap-0">
        <button
          className={`tab flex-1 flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('requests')}
          title="Friend Requests"
        >
          <Inbox className="w-4 h-4" />
          {friendRequests.length > 0 && (
            <span className="badge badge-primary badge-sm">
              {friendRequests.length}
            </span>
          )}
        </button>

        <button
          className={`tab flex-1 flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('friends')}
          title="Friends"
        >
          <Users className="w-4 h-4" />
          {friends.length > 0 && (
            <span className="badge badge-success badge-sm">
              {friends.length}
            </span>
          )}
        </button>
        <button
          className={`tab flex-1 flex items-center justify-center gap-2 ${activeTab === 'add' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('add')}
          title="Add Friends"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'requests' && renderIncomingRequests()}
        {activeTab === 'sent' && renderSentRequests()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'add' && renderAddFriends()}
      </div>
    </div>
  );
};

export default FriendRequests;