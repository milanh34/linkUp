import React, { useState, useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { createGroup } from "../../apis/chat.api";

const GroupModal = ({ fetchChats, setIsGroupModalOpen }) => {

  const [groupName, setGroupName] = useState("");
  const [cookies] = useCookies(["accessToken"]);
  const [groupProfilePic, setGroupProfilePic] = useState(null);
  const fileInputRef = useRef(null);

  const handleCreateGroup = async () => {
    const formData = new FormData();
    formData.append("name", groupName);
    if (groupProfilePic) {
      formData.append("groupProfilePic", groupProfilePic);
    }
    try {
      await axios.post(createGroup, formData, {
        headers: {
          Authorization: `Bearer ${cookies.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setIsGroupModalOpen(false);
      setGroupName("");
      setGroupProfilePic(null);
      fetchChats();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleGroupProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupProfilePic(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-700">
            Create Group
          </h2>
          <button onClick={() => setIsGroupModalOpen(false)}>
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Group Profile Picture Upload */}
        <div className="mb-4 flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleGroupProfilePicChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
          >
            <ImagePlus size={20} className="mr-2" />
            {groupProfilePic ? "Change Group Picture" : "Add Group Picture"}
          </button>
          {groupProfilePic && (
            <img
              src={URL.createObjectURL(groupProfilePic)}
              alt="Group Profile"
              className="ml-4 w-16 h-16 rounded-full object-cover"
            />
          )}
        </div>

        <input
          type="text"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 placeholder-gray-400"
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsGroupModalOpen(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
