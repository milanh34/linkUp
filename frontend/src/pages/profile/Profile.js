import { useState, useEffect } from "react";
import axios from "axios";
import { currentUser, updateDetails, changePassword } from "../../apis/user.api";
import { Pencil, Upload, Lock, X } from "lucide-react";
import { useCookies } from "react-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProfilePage() {
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    bio: "",
    avatar: null,
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [errors, setErrors] = useState({});
  const [cookies] = useCookies(["accessToken", "email", "userId"]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(currentUser, {
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      const { data } = response.data;
      setProfileData({
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        bio: data.bio,
        avatar: data.avatar,
      });
      setAvatarPreview(data.avatar);
    } catch (error) {
      toast.error("Failed to fetch profile data!");
      console.error("Failed to fetch profile", error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarError("");

    if (file) {
      if (file.size > 1048576) {
        setAvatarError("File size must be less than 1MB");
        return;
      }
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setAvatarError("Only .jpg, .jpeg, .png, and .gif files are allowed");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setProfileData({ ...profileData, avatar: file });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullName", profileData.fullName);
    formData.append("email", profileData.email);
    formData.append("bio", profileData.bio);
    if (profileData.avatar) {
      formData.append("avatar", profileData.avatar);
    }

    try {
      await axios.post(updateDetails, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${cookies.accessToken}`,
        },
      });
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profile update failed!");
      console.error("Profile update failed", error);
      setErrors(error.response?.data?.errors || {});
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await axios.post(
        changePassword,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        { headers: { Authorization: `Bearer ${cookies.accessToken}` } }
      );
      toast.success("Password updated successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Password update failed!");
      console.error("Password update failed", error);
      setErrors(error.response?.data?.errors || {});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <ToastContainer />
      <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-5 relative">
        {!editMode ? (
          <>
            <div className="flex flex-col items-center space-y-3">
              <img
                src={avatarPreview || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-md"
              />
              <h2 className="text-base font-semibold text-gray-800">{profileData.fullName}</h2>
              <p className="text-sm text-gray-500">@{profileData.username}</p>
              <p className="text-sm text-gray-600">{profileData.email}</p>
              <p className="text-xs text-gray-500 text-center">{profileData.bio}</p>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm">Edit Profile</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="absolute top-4 right-4">
              <button 
                type="button"
                onClick={() => setEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <img
                  src={avatarPreview || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8AJM9wkP__z2M-hovSAWcTb_9XJ6smy3NKw&s"}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-3 border-gray-300 hover:border-blue-500"
                />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {avatarError && (
                <div className="text-red-500 text-xs mt-1">{avatarError}</div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-600">Full name</label>
              <input
                type="text"
                placeholder="Full name"
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Bio</label>
              <textarea
                placeholder="Bio"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-16"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Save Changes</span>
            </button>
          </form>
        )}

        {!editMode && (
          <div className="mt-4">
            <button
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Change Password</span>
            </button>
            {showPasswordFields && (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Current Password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                />
                {errors.confirmPassword && (
                  <div className="text-red-500 text-xs">
                    {errors.confirmPassword}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Update Password</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;