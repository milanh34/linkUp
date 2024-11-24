import { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { getFriends, addFriend, removeFriend } from "../../apis/user.api";
import { MessageSquare, UserPlus, UserMinus, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfileModal = ({ setIsProfileModalOpen, selectedUser, chats, setSelectedChat, setSelectedUser, setConversationModal }) => {
  
  const [cookies] = useCookies(["accessToken"]);
  const [friends, setFriends] = useState([]);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  useEffect(() =>{
    fetchFriends();
  }, []);
  
  const fetchFriends = async () => {
    try {
      const response = await axios.get(getFriends, {
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setFriends(response.data.data);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  const toggleFriendship = async () => {
    if (!selectedUser) return;

    setFriendActionLoading(true);
    try {
      const isFriend = friends.some((f) => f._id === selectedUser._id);
      const endpoint = isFriend ? removeFriend : addFriend;

      await axios.post(
        endpoint,
        { userId: selectedUser._id },
        {
          headers: { Authorization: `Bearer ${cookies.accessToken}` },
        }
      );

      await fetchFriends();
      setFriendActionLoading(false);
      toast.success(
        isFriend
          ? `${selectedUser.fullName} has been removed from your friends.`
          : `${selectedUser.fullName} has been added to your friends.`
      );
    } catch (error) {
      console.error("Friend action failed:", error);
      toast.error(error?.response?.data?.message || "Failed to update friendship status.");
      setFriendActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">User Profile</h2>
          <button onClick={() => setIsProfileModalOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="text-center">
          <img
            src={selectedUser.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"}
            alt={selectedUser.username}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-bold">{selectedUser.fullName}</h3>
          <p className="text-gray-600">@{selectedUser.username}</p>
          <p className="mt-2 text-gray-500">{selectedUser.bio}</p>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          {friends.some((f) => f._id === selectedUser._id) ? (
            <>
              <button
                onClick={toggleFriendship}
                disabled={friendActionLoading}
                className={`
                flex items-center px-4 py-2 rounded-lg 
                bg-red-500 text-white
                ${friendActionLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              >
                {friendActionLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Removing...
                  </span>
                ) : (
                  <>
                    <UserMinus size={20} className="mr-2" /> Remove Friend
                  </>
                )}
              </button>
              {chats?.filter(
                (chat) =>
                  !chat.isGroup &&
                  chat.participantDetails.username === selectedUser?.username
              ).length == 0 && (
                <button
                  onClick={() => {
                    setSelectedChat(null);
                    setSelectedUser(selectedUser);
                    setConversationModal(true);
                    setIsProfileModalOpen(false);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <MessageSquare size={20} className="mr-2" /> Start
                  Conversation
                </button>
              )}
            </>
          ) : (
            <button
              onClick={toggleFriendship}
              disabled={friendActionLoading}
              className={`
              flex items-center px-4 py-2 rounded-lg 
              bg-blue-600 text-white
              ${friendActionLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
            >
              {friendActionLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" /> Add Friend
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
