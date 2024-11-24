import React, { useState } from "react";
import { X, Send } from "lucide-react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { sendMessage } from "../../apis/chat.api";

const ConversationModal = ({ selectedUser, setSelectedUser, fetchChats, setConversationModal }) => {

  const [firstMessageInput, setFirstMessageInput] = useState("");
  const [cookies] = useCookies(["accessToken"]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleStartConversation();
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUser || !firstMessageInput.trim()) return;
    try {
      const formData = new FormData();
      formData.append("receiverId", selectedUser._id);
      formData.append("message", firstMessageInput);

      await axios.post(sendMessage, formData, {
        headers: {
          Authorization: `Bearer ${cookies.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFirstMessageInput("");
      setSelectedUser(null);
      setConversationModal(false);
      fetchChats();
    } catch (error) {
      console.error("Failed to send first message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center items-center p-6 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2></h2>
          <button onClick={() => setConversationModal(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <img
            src={selectedUser?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"}
            alt={selectedUser?.username}
            className="w-16 h-16 rounded-full mr-4"
          />
          <div>
            <h2 className="text-xl font-bold">{selectedUser?.fullName}</h2>
            <p className="text-gray-500">@{selectedUser?.username}</p>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <input
            type="text"
            placeholder="Send Your First Message"
            value={firstMessageInput}
            onChange={(e) => setFirstMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow mr-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
          />
          <button
            onClick={handleStartConversation}
            disabled={!firstMessageInput.trim()}
            className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationModal;
