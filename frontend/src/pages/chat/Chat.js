import { useState, useEffect, useRef } from "react";
import Avatar from "../../components/chatComponents/Avatar";
import ChatInfoModal from "../../components/chatComponents/ChatInfo";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { debounce } from "lodash";
import { sendMessage, getChatById } from "../../apis/chat.api";
import { socketService } from "../../services/socket";
import MessageDetailsModal from "../../components/chatComponents/MessageDetailsModal";
import Message from "../../components/chatComponents/Message";
import ChatInput from "../../components/chatComponents/ChatInput";

const ChatPage = ({
  cookies,
  messages,
  setMessages,
  userName,
  userProfilePicture,
  selectedChat,
  setSelectedChat,
  setChats,
  handleMarkAsRead,
  fetchChats,
}) => {
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [selectedMessageForDetails, setSelectedMessageForDetails] =
    useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = debounce(() => {
    const otherParticipantIds = Array.isArray(participants)
      ? participants
          .filter((participant) => participant.userId !== cookies.userId)
          .map((participant) => participant.userId)
      : [participants.userId];

    otherParticipantIds.forEach((participantId) => {
      socketService.emitTyping(selectedChat?._id, participantId);
    });

    setTimeout(() => {
      otherParticipantIds.forEach((participantId) => {
        socketService.emitStopTyping(selectedChat?._id, participantId);
      });
    }, 500);
  }, 100);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        event.target.value = null;
        return;
      }
      setMediaFile(file);
    }
  };

  const handleRemoveFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDownload = async (mediaUrl) => {
    try {
      // fl_attachment:my_custom_filename
      const url = `${
        mediaUrl?.split("upload/")[0]
      }upload/fl_attachment:downloadedFile/${
        mediaUrl?.split("upload/")[1].split("/")[1]
      }`;
      window.open(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const fetchChatDetails = async () => {
    if (!selectedChat?._id) return;

    try {
      setIsLoading(true);
      setMessage("");
      const response = await axios.get(`${getChatById}/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      const chatData = response.data.data;
      console.log(chatData);
      setChatInfo({
        isGroup: chatData.isGroup,
        name: chatData.chatName,
        avatar: chatData.chatProfilePic,
        groupAdmin: chatData.groupAdmin,
      });
      setParticipants(chatData.participants);
      setMessages(chatData.messages || []);
      handleMarkAsRead(selectedChat._id);
    } catch (error) {
      console.error("Failed to fetch chat details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      fetchChatDetails();

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id ? { ...chat, unreadCount: 0 } : chat
        )
      );
    }
  }, [selectedChat, cookies.userId]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("userTyping", (data) => {
        if (
          data.chatId === selectedChat?._id &&
          data.userId === cookies.userId
        ) {
          setIsTyping(true);
        }
      });

      socket.on("userStoppedTyping", (data) => {
        if (
          data.chatId === selectedChat?._id &&
          data.userId === cookies.userId
        ) {
          setIsTyping(false);
        }
      });

      return () => {
        socket.off("userTyping");
        socket.off("userStoppedTyping");
      };
    }
  }, [cookies.userId, selectedChat]);

  const handleSendMessage = async (messageText, file) => {
    if ((!messageText?.trim() && !file) || !selectedChat?._id) return;

    if (file) {
      toast.info("Uploading media content...");
    }
    const formData = new FormData();
    formData.append("chatId", selectedChat._id);
    if (messageText) formData.append("message", messageText);
    if (file) formData.append("media", file);

    try {
      await axios.post(sendMessage, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${cookies.accessToken}`,
        },
      });
      setMessage("");
      setMediaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};
    messages.forEach((message) => {
      const messageDate = new Date(message.sentAt).toLocaleDateString();
      if (!groupedMessages[messageDate]) {
        groupedMessages[messageDate] = [];
      }
      groupedMessages[messageDate].push(message);
    });
    return groupedMessages;
  };

  const renderDateHeader = (date) => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    let displayDate = date;
    if (date === today) displayDate = "Today";
    if (date === yesterday) displayDate = "Yesterday";

    return (
      <div className="text-center my-4 text-gray-500">
        <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">
          {displayDate}
        </span>
      </div>
    );
  };

  const handleMessageClick = (message) => {
    const sender =
      message.senderId === cookies.userId
        ? { fullName: userName, avatar: userProfilePicture }
        : Array.isArray(participants)
        ? participants.find((p) => p.userId === message.senderId)
        : participants;
    const readByDetails = message.readBy.map((reader) => {
      const participant =
        reader.userId === cookies.userId
          ? { fullName: userName, avatar: userProfilePicture }
          : Array.isArray(participants)
          ? participants.find((p) => p.userId === reader.userId)
          : participants;
      return {
        userId: reader.userId,
        name: participant?.fullName || "Unknown User",
        avatar: participant?.avatar,
        readAt: reader.readAt || message.sentAt,
      };
    });
    setSelectedMessageForDetails({
      ...message,
      senderName: sender?.fullName || "Unknown",
      senderAvatar: sender?.avatar,
      readBy: readByDetails,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <ToastContainer />
      <div className="w-full bg-white border-b px-4 py-1 shadow-sm">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Avatar
              src={chatInfo?.avatar}
              alt={chatInfo?.name || "Chat"}
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {chatInfo?.name || "Chat"}
              </h1>
              {chatInfo?.isGroup && (
                <p className="text-sm text-gray-500">
                  {participants.length} Participants
                </p>
              )}
            </div>
          </div>
          {isTyping && <div>Typing...</div>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gradient-to-br from-gray-50 to-blue-50">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-full"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </motion.div>
        ) : messages.length > 0 ? (
          <AnimatePresence>
            {Object.entries(groupMessagesByDate(messages)).map(
              ([date, dayMessages]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {renderDateHeader(date)}
                  {dayMessages.map((msg) => (
                    <Message
                      key={msg._id}
                      msg={msg}
                      isCurrentUser={msg.senderId === cookies.userId}
                      onMessageClick={() => handleMessageClick(msg)}
                      onDownload={handleDownload}
                      avatar={
                        <Avatar
                          src={
                            msg.senderId === cookies.userId
                              ? userProfilePicture
                              : Array.isArray(participants)
                              ? participants.find(
                                  (p) => p.userId === msg.senderId
                                )?.avatar
                              : participants.avatar
                          }
                          alt="User"
                          className="h-8 w-8"
                        />
                      }
                    />
                  ))}
                </motion.div>
              )
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500"
          >
            No messages yet
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full border-t bg-white">
        {mediaFile && (
          <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">
              {mediaFile.name}
            </span>
            <button
              onClick={handleRemoveFile}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <ChatInput onSendMessage={handleSendMessage} handleTyping={handleTyping}/>
      </div>
      {isModalOpen && (
        <ChatInfoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          chatInfo={{
            chatId: selectedChat._id,
            isGroup: chatInfo?.isGroup,
            chatName: chatInfo?.name,
            chatProfilePic: chatInfo?.avatar,
            groupAdmin: chatInfo?.groupAdmin,
          }}
          fetchChats={fetchChats}
          fetchChatDetails={fetchChatDetails}
          setSelectedChat={setSelectedChat}
          participants={participants}
          currentUserId={cookies.userId}
          accessToken={cookies.accessToken}
          onGroupUpdate={(updatedChat) => {
            setChatInfo({
              ...chatInfo,
              name: updatedChat.groupName,
              avatar: updatedChat.groupProfilePic,
            });
          }}
        />
      )}

      <MessageDetailsModal
        isOpen={!!selectedMessageForDetails}
        onClose={() => setSelectedMessageForDetails(null)}
        message={selectedMessageForDetails}
        currentUserId={cookies.userId}
      />
    </div>
  );
};

export default ChatPage;
