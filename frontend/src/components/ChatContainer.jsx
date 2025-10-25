import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import MessageSkeleton from './skeletons/MessageSkeleton'
import { useAuthStore } from '../store/useAuthStore'
import { formatMessageTime } from '../lib/utils'
import { RefreshCw } from "lucide-react"; // lightweight icon lib you already use

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        getOlderMessages,
        isMessagesLoading,
        areOlderMessagesAvailable,
        areOlderMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages } = useChatStore()
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Function to check if user is at the bottom
    const isAtBottom = () => {
        if (!messagesContainerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        return scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    };

    // Function to scroll to bottom
    const scrollToBottom = () => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Handle scroll events to detect if user is scrolling
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;

        const isBottom = isAtBottom();
        setIsUserScrolling(!isBottom);
    };

    const handleLoadOlderMessages = async () => {
        if (messages.length === 0) return;

        // Store current scroll position to maintain it after loading older messages
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;

        const timeToLoad = messages[0]?.createdAt;
        console.log('Loading older messages before:', timeToLoad);
        console.log('Current messages count:', messages.length);

        await getOlderMessages(selectedUser._id, timeToLoad);

        // Maintain scroll position after loading older messages
        setTimeout(() => {
            if (container) {
                const scrollHeightAfter = container.scrollHeight;
                const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                container.scrollTop = container.scrollTop + scrollDifference;
                console.log('Messages count after loading:', messages.length);
            }
        }, 100);
    }
    useEffect(() => {

    }, [areOlderMessagesLoading])

    useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [getMessages, selectedUser._id, subscribeToMessages, unsubscribeFromMessages]);

    // Initial scroll to bottom when messages first load
    useEffect(() => {
        if (!isMessagesLoading && messages.length > 0) {
            // Use setTimeout to ensure DOM is updated
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [isMessagesLoading, messages.length]);

    // Auto-scroll to bottom when new messages arrive (only if user isn't scrolling up)
    useEffect(() => {
        if (messages.length > 0 && !isUserScrolling) {
            scrollToBottom();
        }
    }, [messages, isUserScrolling]);

    if (isMessagesLoading) {
        return (
            <div className='flex-1 flex flex-col overflow-auto'>
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        )
    }

    console.log(messages);

    return (
        <div className='flex-1 flex flex-col overflow-auto'>
            <ChatHeader />
            <div
                ref={messagesContainerRef}
                className='flex-1 overflow-y-auto p-4 space-y-4'
                onScroll={handleScroll}
            >
                {areOlderMessagesAvailable && (
                    <div className='flex my-4 justify-center items-center'>
                        <button
                            onClick={handleLoadOlderMessages}
                            disabled={areOlderMessagesLoading}
                            className="
                                btn btn-sm btn-outline btn-neutral transition-colors duration-200 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={`opacity-70 ${areOlderMessagesLoading ? 'animate-spin' : ''}`}
                            />
                            {areOlderMessagesLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    >
                        <div className='chat-image avatar'>
                            <div className='size-10 rounded-full border'>
                                <img
                                    src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.jpg" : selectedUser.profilePic || "/avatar.jpg"}
                                    alt="profile pic"
                                />
                            </div>
                        </div>
                        <div className='chat-header mb-1'>
                            <time className='text-xs opacity-50 ml-1'>
                                {formatMessageTime(message.createdAt)}
                            </time>
                        </div>
                        <div className='chat-bubble flex flex-col'>
                            {message.image && (
                                <img
                                    src={message.image}
                                    alt="attachment"
                                    className='sm:max-w-[200px] rounded-md mb-2'
                                />
                            )}
                            {message.text && (
                                <p>{message.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                {/* Invisible element to scroll to */}
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
    )
}

export default ChatContainer