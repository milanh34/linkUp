import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronDown, FaUserAlt, FaCommentAlt } from "react-icons/fa";
import { UserIcon, CogIcon, LogoutIcon } from "@heroicons/react/outline";
import axios from "axios";
import { useCookies } from "react-cookie";
import logo from "../assets/logo.png";

const Navbar = ({ isLoggedIn, userName, userProfilePicture }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cookies, removeCookie] = useCookies(["accessToken", "email", "userId"]);

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "/api/logout",
        {},
        { headers: { Authorization: `Bearer ${cookies.accessToken}` } }
      );
      console.log(response);
      removeCookie("accessToken");
      removeCookie("email");
      removeCookie("userId");
      navigate("/auth");
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 w-full">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
          <img src={logo} alt="LinkUp" className="h-10" />
        </Link>

        <div className="flex items-center space-x-6">
              <Link
                to="/feedback"
                className="text-gray-600 hover:text-blue-600 transition flex items-center gap-2"
              >
                <FaCommentAlt className="w-5 h-5" />
                Feedback
              </Link>
          {!isLoggedIn && (
              <Link to="/auth" className="text-gray-600 hover:text-blue-600 transition">
                Login
              </Link>
          )}

          {isLoggedIn && (
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
                  {userProfilePicture ? (
                    <img
                      src={userProfilePicture}
                      alt={userName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-300 w-full h-full flex items-center justify-center">
                      <FaUserAlt className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <FaChevronDown className="w-5 h-5 text-gray-500" />
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg w-48 z-50">
                  <div>
                    <button
                      onClick={() => navigate("/profile")}
                      className="flex items-center px-4 py-2 w-full text-left text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                    >
                      <UserIcon className="w-5 h-5 mr-2" />
                      View Profile
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => navigate("/settings")}
                      className="flex items-center px-4 py-2 w-full text-left text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                    >
                      <CogIcon className="w-5 h-5 mr-2" />
                      Settings
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 w-full text-left text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                    >
                      <LogoutIcon className="w-5 h-5 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
