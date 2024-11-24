import React, { useState } from "react";
import { Search, X } from "lucide-react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { searchUser } from "../../apis/user.api";

const SearchSection = ({ showSearchResults, setShowSearchResults, viewProfile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cookies] = useCookies(["accessToken"]);
  
  const handleSearch = async (query) => {
    if (!query || query == "" || query.trim() === ""){
      setShowSearchResults(false);
      return;
    } 
    try {
      const response = await axios.get(searchUser, {
        params: { query: query || searchQuery },
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setSearchResults(response.data.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-50">
      <div className="flex shadow-sm">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            handleSearch(e.target.value);
          }}
          className="w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        />
        <button
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 rounded-r-lg hover:opacity-90 transition"
        >
          <Search size={20} />
        </button>
      </div>

      {showSearchResults && searchResults.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto bg-white shadow rounded-lg">
          <div className="flex justify-between items-center p-2">
            <h4 className="text-lg font-semibold">Search Results</h4>
            <button
              onClick={() => setShowSearchResults(false)}
              className="text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          {searchResults.map((user) => (
            <div
              key={user._id}
              onClick={() => viewProfile(user._id)}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <img
                src={user.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"}
                alt={user.username}
                className="w-8 h-8 rounded-full mr-2"
              />
              <div>
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSection;
