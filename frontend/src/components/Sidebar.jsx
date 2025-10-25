import React, { useEffect, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import { Users, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFriendStore } from '../store/useFriendStore';
import FriendRequests from './FriendRequests';

export const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const { authUser, onlineUsers } = useAuthStore();
    const { friendRequests } = useFriendStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);
    const filteredUsers = showOnlineOnly ? users.filter(user => onlineUsers.includes(user._id)) : users;

    if (isUsersLoading) {
        return <SidebarSkeleton />
    }
    return (
        <aside className='h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200'>
            <div className='border-b border-base-300 w-full py-5 px-3'>
                {/* Friend Requests Section */}
                <div className='mb-4'>
                    <button
                        onClick={() => setShowFriendRequests(!showFriendRequests)}
                        className='flex items-center gap-2 w-full hover:bg-base-200 p-2 rounded-lg transition-colors'
                    >
                        <UserPlus className='w-6 h-6' />
                        <span className='font-medium hidden lg:block'>Friend Requests</span>
                        {friendRequests.length > 0 && (
                            <span className='badge badge-primary badge-sm hidden lg:block'>
                                {friendRequests.length}
                            </span>
                        )}
                        <div className='ml-auto hidden lg:block'>
                            {showFriendRequests ? (
                                <ChevronDown className='w-4 h-4' />
                            ) : (
                                <ChevronRight className='w-4 h-4' />
                            )}
                        </div>
                    </button>

                    {/* Friend Requests Dropdown - only show on larger screens */}
                    {showFriendRequests && (
                        <div className='hidden lg:block mt-2 border border-base-300 rounded-lg bg-base-100'>
                            <FriendRequests />
                        </div>
                    )}
                </div>

                {/* Contacts Section */}
                <div className='flex items-center gap-2 px-2'>
                    <Users className='w-6 h-6' />
                    <span className='font-medium hidden lg:block'>Contacts</span>
                </div>
                {/* Online filter toggle */}
                <div className='mt-3 hidden lg:flex items-center px-2 gap-2'>
                    <label className='cursor-pointer flex items-center gap-2'>
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className='checkbox checkbox-sm'
                        />
                        <span className='text-sm'>Show online only</span>
                    </label>
                    <span className='text-xs text-zinc-500'>
                        ({(onlineUsers.length - 1) >= 0 ? onlineUsers.length - 1 : 0} online)
                    </span>
                </div>

            </div>
            <div className='overflow-y-auto w-full py-3'>
                {filteredUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? 'bg-base-300 ring-1 ring-base-300' : ''}`}>
                        <div className='relative mx-auto lg:mx-0'>
                            <img
                                src={user.profilePic || "/avatar.jpg"}
                                alt={user.name}
                                className='size-12 rounded-full object-cover' />
                            {onlineUsers.includes(user._id) && (
                                <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-zinc-900' />
                            )}
                        </div>

                        {/*user info - only visible on larger screens */}
                        <div className='hidden lg:block text-left min-w-0'>
                            <div className='font-medium truncate'>{user.fullName}</div>
                            <div className='text-sm text-zinc-400'>
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">
                        No online users
                    </div>
                )}

            </div>

        </aside>
    );
}

export default Sidebar