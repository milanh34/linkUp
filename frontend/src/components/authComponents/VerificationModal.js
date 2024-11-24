import { useState } from "react";
import { sendVerificationEmail } from "../../apis/user.api";
import { useCookies } from "react-cookie";
import axios from "axios";

const VerificationModal = ({ isOpen, onClose, username }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies] = useCookies(["accessToken"]);

  const handleSendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${sendVerificationEmail}/${username}`, {
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
      });
      setEmailSent(true);
      setCanResend(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to send verification email", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-red-700">
          Email Verification Required
        </h2>

        <p className="mb-4 text-red-500">
          {emailSent
            ? "Verification email has been sent. Please check your inbox."
            : "Your email needs to be verified before you can log in."}
        </p>

        <div className="flex justify-between">
          <button
            onClick={
              !emailSent
                ? handleSendVerificationEmail
                : canResend
                ? handleSendVerificationEmail
                : null
            }
            className={`px-4 py-2 rounded ${
              !emailSent || canResend
                ? "bg-red-400 text-white hover:bg-red-500"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={emailSent && !canResend}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : !emailSent ? (
              "Send Verification Email"
            ) : canResend ? (
              "Resend Email"
            ) : (
              `Resend in ${countdown}s`
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 rounded hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
