import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../apis/user.api';
import axios from 'axios';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    message: 'Verifying your email...'
  });

  useEffect(() => {
    const performEmailVerification = async () => {
      try {
        await axios.post(`${verifyEmail}?token=${token}`);
        setVerificationStatus({
          success: true,
          message: 'Email verified successfully!'
        });
      } catch (error) {
        setVerificationStatus({
          success: false,
          message: error.response?.data?.message || 'Email verification failed.'
        });
      }
    };

    console.log(token)
    if (token) {
      performEmailVerification();
    }
  }, [token]);

  const handleLoginRedirect = () => {
    navigate('/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4 text-green-500">{verificationStatus.message}</h1>
      {verificationStatus.success && (
        <button 
          onClick={handleLoginRedirect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      )}
    </div>
  );
};

export default EmailVerificationPage;