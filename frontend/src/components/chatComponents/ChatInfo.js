import { useState } from "react";
import { X, UserPlus, UserMinus, Settings, Trash2, Camera } from "lucide-react";
import axios from "axios";
import Avatar from "./Avatar";
import { searchUser } from "../../apis/user.api";
import {
  editGroupSettings,
  addGroupParticipant,
  removeGroupParticipant,
  deleteGroup,
} from "../../apis/chat.api";
import { useCookies } from "react-cookie";

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const EditGroupForm = ({ groupInfo, onSubmit, onClose }) => {
  const [name, setName] = useState(groupInfo.chatName);
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(groupInfo.chatProfilePic);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (name !== groupInfo.chatName) formData.append("name", name);
    if (profilePic) formData.append("groupProfilePic", profilePic);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Group Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar
                src={previewUrl}
                alt="Group profile"
                className="h-24 w-24 rounded-lg"
              />
              <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full text-white cursor-pointer">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddParticipantsForm = ({ onSubmit, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies] = useCookies(["accessToken"]);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(searchUser, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    if (!selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(selectedUsers.map((user) => user._id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Participants</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search users..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isLoading && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.fullName}
                    className="h-8 w-8"
                  />
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Users:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                  >
                    <span className="text-sm">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleUserRemove(user._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add Participants
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatInfoModal = ({
  isOpen,
  onClose,
  chatInfo,
  participants,
  currentUserId,
  accessToken,
  onGroupUpdate,
  fetchChats,
  fetchChatDetails,
  setSelectedChat
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState({
    show: false,
    type: null,
    data: null,
  });

  if (!isOpen) return null;

  console.log(chatInfo);

  const isAdmin = chatInfo?.groupAdmin === currentUserId;

  const handleEditGroup = async (formData) => {
    try {
      const response = await axios.post(
        `${editGroupSettings}/${chatInfo.chatId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      onGroupUpdate(response.data.data);
      setShowEditForm(false);
      fetchChats();
    } catch (error) {
      console.error("Failed to edit group:", error);
    }
  };

  const handleAddParticipant = async (participantIds) => {
    try {
      await axios.post(
        `${addGroupParticipant}/${chatInfo.chatId}`,
        { participants: participantIds },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setShowAddParticipants(false);
      fetchChatDetails();
    } catch (error) {
      console.error("Failed to add participants:", error);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      console.log(accessToken);
      await axios.post(
        `${removeGroupParticipant}/${chatInfo.chatId}`,
        { participantId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setShowConfirmation({ show: false, type: null, data: null });
      fetchChatDetails();
    } catch (error) {
      console.error("Failed to remove participant:", error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await axios.post(
        `${deleteGroup}/${chatInfo.chatId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setShowConfirmation({ show: false, type: null, data: null });
      fetchChats();
      setSelectedChat(null);
      onClose();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-center">
              {chatInfo?.isGroup ? "Group Information" : "Chat Information"}
            </h2>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar
                  src={chatInfo?.chatProfilePic}
                  alt={chatInfo?.chatName}
                  className="h-24 w-24 rounded-lg"
                />
              </div>

              {/* Name and Info */}
              <div className="text-center">
                <h3 className="text-xl font-semibold">{chatInfo?.chatName}</h3>
                {!chatInfo?.isGroup && participants && (
                  <div className="text-sm text-gray-500">
                    <p>@{participants.username}</p>
                    <p className="mt-2">{participants.bio}</p>
                  </div>
                )}
              </div>

              {/* Group-specific Controls */}
              {chatInfo?.isGroup && (
                <div className="w-full space-y-4">
                  {isAdmin && (
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setShowAddParticipants(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Participant</span>
                      </button>
                    </div>
                  )}

                  {/* Participants List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Participants</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {Array.isArray(participants) &&
                        participants.map((participant) => (
                          <div
                            key={participant.userId}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar
                                src={participant.avatar}
                                alt={participant.fullName}
                                className="h-8 w-8"
                              />
                              <div>
                                <p className="font-medium">
                                  {participant.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  @{participant.username}
                                </p>
                              </div>
                            </div>
                            {isAdmin &&
                              participant.userId !== currentUserId && (
                                <button
                                  onClick={() =>
                                    setShowConfirmation({
                                      show: true,
                                      type: "removeParticipant",
                                      data: participant,
                                    })
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="border-t pt-4 space-y-2">
                      <button
                        onClick={() => setShowEditForm(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Edit Group Settings</span>
                      </button>
                      <button
                        onClick={() =>
                          setShowConfirmation({
                            show: true,
                            type: "deleteGroup",
                            data: null,
                          })
                        }
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Group</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Group Form Modal */}
      {showEditForm && (
        <EditGroupForm
          groupInfo={chatInfo}
          onSubmit={handleEditGroup}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* Add Participants Form Modal */}
      {showAddParticipants && (
        <AddParticipantsForm
          onSubmit={handleAddParticipant}
          onClose={() => setShowAddParticipants(false)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation.show}
        onClose={() =>
          setShowConfirmation({ show: false, type: null, data: null })
        }
        onConfirm={() => {
          if (showConfirmation.type === "removeParticipant") {
            handleRemoveParticipant(showConfirmation.data.userId);
          } else if (showConfirmation.type === "deleteGroup") {
            handleDeleteGroup();
          }
        }}
        title={
          showConfirmation.type === "removeParticipant"
            ? "Remove Participant"
            : "Delete Group"
        }
        message={
          showConfirmation.type === "removeParticipant"
            ? `Are you sure you want to remove ${showConfirmation.data?.fullName} from the group?`
            : "Are you sure you want to delete this group? This action cannot be undone."
        }
      />
    </>
  );
};

export default ChatInfoModal;
