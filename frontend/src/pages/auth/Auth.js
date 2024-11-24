import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { register, login, forgotPassword } from "../../apis/user.api.js";
import VerificationModal from "../../components/authComponents/VerificationModal.js";

function Auth() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [verificationUsername, setVerificationUsername] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordInput, setForgotPasswordInput] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    bio: "",
    avatar: null,
  });

  const flip = () => {
    setIsFlipped(!isFlipped);
  };

  const togglePasswordVisibilityLogin = () => {
    setShowPasswordLogin(!showPasswordLogin);
  };

  const togglePasswordVisibilitySignup = () => {
    setShowPasswordSignup(!showPasswordSignup);
  };

  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupInputChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const showToastError = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      const response = await axios.post(login, loginData);
      document.cookie = `accessToken=${response?.data?.data?.accessToken};max-age=${7 * 24 * 60 * 60};path=/`;
      document.cookie = `userId=${response?.data?.data?.user?._id};max-age=${7 * 24 * 60 * 60};path=/`;
      document.cookie = `email=${response?.data?.data?.user?.email};max-age=${7 * 24 * 60 * 60};path=/`;
      console.log("Login successful:", response?.data);
      navigate("/social");
      window.location.reload();
    } catch (error) {
      if (error.response?.data?.message?.includes("verify")) {
        setVerificationUsername(loginData.username);
        setVerificationModalOpen(true);
      } else{
        const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
        showToastError(errorMessage);
        console.error("Login failed:", error.response);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordModalOpen(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
  };

  const handleForgotPasswordInputChange = (e) => {
    setForgotPasswordInput(e.target.value);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);

    try {
      await axios.post(forgotPassword, { identifier: forgotPasswordInput });
      setForgotPasswordLoading(false);
      setForgotPasswordSuccess(true);
    } catch (error) {
      setForgotPasswordLoading(false);
      setForgotPasswordError(
        error.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const closeForgotPasswordModal = () => {
    setForgotPasswordModalOpen(false);
    setForgotPasswordInput("");
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarError("");

    if (file) {
      if (file.size > 1048576) {
        setAvatarError("File size must be less than 1MB");
        e.target.value = null;
        return;
      }
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setAvatarError("Only .jpg, .jpeg, .png, and .gif files are allowed");
        e.target.value = null;
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setSignupData({ ...signupData, avatar: file });
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsSignupLoading(true);

    const fullName = `${signupData.firstName} ${signupData.lastName}`;

    const formData = new FormData();
    formData.append("username", signupData.username);
    formData.append("fullName", fullName);
    formData.append("email", signupData.email);
    formData.append("bio", signupData.bio);
    formData.append("password", signupData.password);
    if (signupData.avatar) {
      formData.append("avatar", signupData.avatar);
    }

    try {
      const response = await axios.post(register, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Signup successful:", response?.data);
      flip();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      showToastError(errorMessage);
      console.error("Signup failed:", error);
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <div className="body">
     <ToastContainer />
      <div className="box">
        <div
          className={`flip-card-inner ${isFlipped ? "flipped" : ""} ${!isFlipped? "h-[600px]" : "h-[750px]"}`}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div className="box-login">
            <form onSubmit={handleLoginSubmit}>
              <h1>LOGIN</h1>
              <div className="email-login">
                <input
                  className="inpt"
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  value={loginData.username}
                  onChange={handleLoginInputChange}
                />
              </div>

              <div className="password-container">
                <input
                  className="inpt"
                  type={showPasswordLogin ? "text" : "password"}
                  name="password"
                  id="password-login"
                  placeholder="Password"
                  required
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                />
                <i
                  className={`fa ${
                    showPasswordLogin ? "fa-eye" : "fa-eye-slash"
                  }`}
                  onClick={togglePasswordVisibilityLogin}
                ></i>
              </div>
              <button type="submit" className="btn" disabled={isLoginLoading}>
                {isLoginLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "LOGIN"
                )}
              </button>
              <div className="forgot-password-link">
                <a onClick={handleForgotPasswordClick}>Forgot Password?</a>
              </div>
            </form>
            <div className="register-link">
              <p>
                Don't have an account? <a onClick={flip}>Register Now</a>
              </p>
            </div>
          </div>
          <div className="box-signup">
            <form onSubmit={handleSignupSubmit}>
              <h1>REGISTER</h1>

              <div className="avatar-upload">
                <label htmlFor="avatar-input" className="avatar-label">
                  {avatarPreview ? (
                    <div className="avatar-preview-container">
                      <div className="avatar-circle">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="avatar-image"
                        />
                      </div>
                      <button
                        type="button"
                        className="delete-avatar-btn"
                        onClick={() => {
                          setAvatarPreview(null);
                          setSignupData({ ...signupData, avatar: null });
                          document.getElementById("avatar-input").value = null;
                        }}
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  ) : (
                    <div className="avatar-placeholder">
                      <i className="fas fa-user-circle"></i>
                      <span>Add Avatar</span>
                    </div>
                  )}
                </label>
                <input
                  type="file"
                  id="avatar-input"
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={handleAvatarChange}
                  hidden
                />
                {avatarError && <p className="error-message">{avatarError}</p>}
                <p className="avatar-info">
                  Max size: 1MB. Allowed formats: .jpg, .jpeg, .png, .gif
                </p>
              </div>
              <div className="user-signup">
                <input
                  className="inpt"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={signupData.firstName}
                  onChange={handleSignupInputChange}
                  required
                />
                <input
                  className="inpt"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={signupData.lastName}
                  onChange={handleSignupInputChange}
                  required
                />
              </div>

              <input
                className="inpt"
                type="text"
                name="username"
                placeholder="Username"
                value={signupData.username}
                onChange={handleSignupInputChange}
                required
              />

              <input
                className="inpt"
                type="text"
                name="bio"
                placeholder="Bio"
                value={signupData.bio}
                onChange={handleSignupInputChange}
                required
              />

              <input
                className="inpt"
                type="email"
                name="email"
                placeholder="Email"
                required
                value={signupData.email}
                onChange={handleSignupInputChange}
              />

              <div className="password-container">
                <input
                  className="inpt"
                  type={showPasswordSignup ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  value={signupData.password}
                  onChange={handleSignupInputChange}
                />
                <i
                  className={`fa ${
                    showPasswordSignup ? "fa-eye" : "fa-eye-slash"
                  }`}
                  onClick={togglePasswordVisibilitySignup}
                ></i>
              </div>
              <button type="submit" className="btn" disabled={isSignupLoading}>
                {isSignupLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "REGISTER"
                )}
              </button>
            </form>
            <div className="register-link">
              <p>
                Already have an account? <a onClick={flip}>Log In</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      {forgotPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeForgotPasswordModal}>
              &times;
            </button>
            <h2 className="mb-4">Forgot Password?</h2>
            <form onSubmit={handleForgotPasswordSubmit}>
              <input
                type="text"
                placeholder="Enter Username or Email"
                value={forgotPasswordInput}
                onChange={handleForgotPasswordInputChange}
                required
                className="inpt"
              />
              {forgotPasswordError && (
                <p className="error-message">{forgotPasswordError}</p>
              )}
              {forgotPasswordSuccess && (
                <p className="success-message">
                  A new password has been sent to your email. Please check your inbox and change it after logging in.
                </p>
              )}
              <button 
                type="submit" 
                className="btn" 
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        username={verificationUsername}
      />
    </div>
  );
}

export default Auth;
