import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import axios from "axios";
import Auth from "./pages/auth/Auth";
import Social from "./pages/social/Social";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import EmailVerificationPage from "./pages/emailVerification/EmailVerification";
import ProfilePage from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import { currentUser } from "./apis/user.api";
import Feedback from "./pages/feedback/Feedback";

const getCookie = (name) => {
  const cookieString = document.cookie;
  const cookies = cookieString.split(";").map((cookie) => cookie.trim());
  for (let cookie of cookies) {
    if (cookie.startsWith(name + "=")) {
      return cookie.split("=")[1];
    }
  }
  return null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = getCookie("accessToken");
      if (accessToken) {
        try {
          const response = await axios.get(currentUser, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setUser(response.data.data);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Failed to fetch user details:", error);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <BrowserRouter>
      <Navbar
        isLoggedIn={isLoggedIn}
        userName={user?.fullName}
        userProfilePicture={user?.avatar}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/verify-email/:token"
          element={<EmailVerificationPage />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/social"
          element={
            <Social
              userName={user?.fullName}
              userProfilePicture={user?.avatar}
            />
          }
        />
        <Route path="/feedback" element={<Feedback isLoggedIn={isLoggedIn} />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
