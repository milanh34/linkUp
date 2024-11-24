import React from "react";

const ChatDisplay = ({ chat }) => {
  return (
    <div className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-100 w-full">
      <div className="mr-3">
        {chat.isGroup ? (
          <img
            src={
              chat.chatDetails?.groupProfilePic ||
              "https://cdn.pixabay.com/photo/2016/11/14/17/39/group-1824145_1280.png"
            }
            alt="Group"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <img
            src={
              chat?.participantDetails?.avatar ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"
            }
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
      </div>

      <div className="flex-grow">
        <p className="font-semibold text-gray-800">
          {chat.isGroup
            ? chat.chatDetails?.groupName
            : chat?.participantDetails?.fullName}
        </p>
        <p className="text-sm text-gray-500">
          {chat.lastMessage
            ? chat.lastMessage.message.length > 30
              ? chat.lastMessage.message.substring(0, 30) + "..."
              : chat.lastMessage.message
            : "No messages yet"}
        </p>
      </div>

      {chat.unreadCount > 0 && (
        <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
          {chat.unreadCount}
        </span>
      )}

      {/* Group/User Indicator */}
      <div className="ml-3 text-sm text-gray-400">
        {chat.isGroup ? "Group" : "User"}
      </div>
    </div>
  );
};

export default ChatDisplay;
