import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { socketService } from "../../services/socket";
import { User, MessageSquare, PlusCircle, Group } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { userProfile } from "../../apis/user.api";
import { getChats, markAsRead } from "../../apis/chat.api";
import ChatPage from "../chat/Chat";
import ProfileModal from "../../components/socialComponents/ProfileModal";
import GroupModal from "../../components/socialComponents/GroupModal";
import ConversationModal from "../../components/socialComponents/ConversationModal";
import ChatDisplay from "../../components/socialComponents/ChatDisplay";
import SearchSection from "../../components/socialComponents/SearchSection";

const SocialPage = ({ userName, userProfilePicture }) => {
  const [cookies] = useCookies(["accessToken", "email", "userId"]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [conversationModal, setConversationModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const navigate = useNavigate();

  const sortChats = useCallback((chatsToSort) => {
    return [...chatsToSort].sort((a, b) => {
      const timeA = a.lastMessage?.sentAt || a.lastMessageAt || 0;
      const timeB = b.lastMessage?.sentAt || b.lastMessageAt || 0;
      return new Date(timeB) - new Date(timeA);
    });
  }, []);

  const updateChatList = useCallback(
    (chatIds, lastMessage) => {
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat._id === chatIds) {
            return {
              ...chat,
              lastMessage,
              unreadCount:
                chatIds === selectedChat?._id ? 0 : (chat.unreadCount || 0) + 1,
              // unreadCount: chatIds === selectedChat?._id ? 0 : chat?.unreadCount || 0,
            };
          } else {
            return chat;
          }
        });
        return sortChats(updatedChats);
      });
    },
    [selectedChat, sortChats]
  );

  const handleMarkAsRead = async (currentChatId) => {
    try {
      await axios.post(
        markAsRead,
        { chatId: currentChatId },
        {
          headers: { Authorization: `Bearer ${cookies.accessToken}` },
        }
      );
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };


  useEffect(() => {
    socketService.connect(cookies.accessToken);
    const socket = socketService.getSocket();
    if (socket) {
      socketService.joinRoom(cookies.userId);

      socket.on(
        "chatUpdated",
        ({ chatId, lastMessage, messages, unreadCount, isNewChat, chat }) => {
          console.log(
            "Chat update hua hai:",
            chatId,
            lastMessage,
            messages,
            unreadCount,
            isNewChat,
            chat
          );
          if (isNewChat) {
            fetchChats();
            return;
          }
          updateChatList(chatId, lastMessage);
          if (chatId === selectedChat?._id) {
            setMessages(messages || []);
            handleMarkAsRead(chatId);
          }
        }
      );

      socket.on("groupUpdated", (data) => {
        console.log("Group banaya new", data.chat, data.added);
        if (data.added.find((userId) => userId === cookies.userId)) {
          fetchChats();
        } else if (selectedChat?._id === data.chat._id) {
          setSelectedChat(data.chat);
          toast.info("New participant(s) added");
        }
      });

      socket.on("groupRemoved", (data) => {
        console.log("Group se nikal diya", data.chat, data.removed);
        if (data.removed === cookies.userId) {
          if (selectedChat?._id === data.chat._id) {
            setSelectedChat(null);
          } 
          fetchChats();
        } else if (selectedChat?._id === data.chat._id) {
          setSelectedChat(data.chat);
          toast.info("A participant has been removed");
        }
      });

      socket.on("groupEdited", (data) => {
        console.log("Group edit kardiya", data.chat, data.chatId);
        setChats((prevChats) => {
          const updatedChats = prevChats.map((chat) => {
            if (chat._id === data.chatId) {
              return {
                ...chat,
                chatDetails: {
                  groupName: data.chat.groupName,
                  groupProfilePic: data.chat.groupProfilePic,
                }
              };
            } else {
              return chat;
            }
          });
          return updatedChats;
        });
        if (selectedChat?._id === data.chat._id) {
          setSelectedChat(data.chat);
        }
        toast.info(`Group "${data.chat.groupName}" edited`);
      });

      socket.on("groupDeleted", (data) => {
        console.log("Group delete kardiya", data.chatId);
        setChats((prevChats) => {
          const updatedChats = prevChats.filter((chat) => chat._id !== data.chatId);
          return updatedChats;
        });
        if (selectedChat?._id === data.chatId) {
          setSelectedChat(null);
        }
        toast.info(`Group "${data.groupName}" deleted`);
      });

      socket.on("messageRead", ({ chatId, userId }) => {
        if (selectedChat?._id === chatId && userId !== cookies.userId) {
          setMessages((prevMessages) =>
            prevMessages.map((message) => ({
              ...message,
              isRead: true,
              readBy: [
                ...message.readBy,
                { userId, readAt: new Date().toISOString() },
              ],
            }))
          );
        }
      });

      return () => {
        socket.off("chatCreated");
        socket.off("chatUpdated");
        socket.off("messageRead");
        socketService.disconnect();
      };
    }
  }, [cookies.userId, selectedChat, updateChatList, sortChats]);

  const fetchChats = useCallback(async () => {
    try {
      const response = await axios.get(getChats, {
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setChats(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, [cookies.accessToken, sortChats]);

  useEffect(() => {
    if (cookies.accessToken && cookies.accessToken !== "undefined") {
      fetchChats();
    } else {
      navigate("/auth");
    }
  }, [cookies.accessToken, fetchChats, navigate]);


  const viewProfile = async (userId) => {
    try {
      const response = await axios.get(userProfile, {
        params: { userId },
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setSelectedUser(response.data.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-100 pt-16">
      <ToastContainer />
      <div className="w-1/4 bg-white shadow-lg border-r overflow-y-auto">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <User size={24} />
            <h2 className="text-xl font-bold">Social Network</h2>
          </div>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="hover:bg-purple-700 p-2 rounded-full transition"
          >
            <PlusCircle size={24} />
          </button>
        </div>

        <SearchSection
          showSearchResults={showSearchResults}
          setShowSearchResults={setShowSearchResults}
          viewProfile={viewProfile}
        />

        <div className="p-2">
          <h3 className="px-4 py-2 font-semibold text-gray-700 flex items-center">
            <Group size={20} className="mr-2 text-indigo-600" />
            Conversations
          </h3>
          {!isChatLoading &&
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`my-2 hover:bg-indigo-50 cursor-pointer flex items-center rounded-lg transition ${
                  selectedChat?._id === chat._id ? "bg-indigo-100" : ""
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <ChatDisplay chat={chat} />
              </div>
            ))}
        </div>
      </div>

      <div className="w-3/4">
        {selectedChat ? (
          <ChatPage
            cookies={cookies}
            messages={messages}
            setMessages={setMessages}
            userName={userName}
            userProfilePicture={userProfilePicture}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            setChats={setChats}
            handleMarkAsRead={handleMarkAsRead}
            fetchChats={fetchChats}
          />
        ) : conversationModal ? (
          <ConversationModal
            selectedUser={selectedUser}
            s
            setSelectedUser={setSelectedUser}
            fetchChats={fetchChats}
            setConversationModal={setConversationModal}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <MessageSquare size={48} className="mr-2 text-indigo-500" />
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {isGroupModalOpen && (
        <GroupModal
          fetchChats={fetchChats}
          setIsGroupModalOpen={setIsGroupModalOpen}
        />
      )}

      {isProfileModalOpen && selectedUser && (
        <ProfileModal
          setIsProfileModalOpen={setIsProfileModalOpen}
          setConversationModal={setConversationModal}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setSelectedChat={setSelectedChat}
          chats={chats}
        />
      )}
    </div>
  );
};

export default SocialPage;
