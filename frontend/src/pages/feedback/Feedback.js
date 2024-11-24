import { useState } from "react";
import { FaThumbsUp, FaThumbsDown, FaHeart, FaFrown } from "react-icons/fa";
import axios from "axios";
import { useCookies } from "react-cookie";
import { sendFeedback } from "../../apis/user.api";

const FeedbackPage = ({ isLoggedIn }) => {
  const [feedBack, setFeedBack] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookies] = useCookies(["accessToken"]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        sendFeedback,
        { message: feedBack },
        { headers: { Authorization: `Bearer ${cookies?.accessToken}` } }
      );
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError("Oops, something went wrong! It's not you, it's definitely us.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-2xl mx-auto p-6 mt-8 bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg rounded-3xl">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <FaFrown className="w-8 h-8 mt-1" />
              <h1 className="text-3xl font-bold">Hold Up, Mystery Critic!</h1>
            </div>
            <p className="text-lg">
              We appreciate your enthusiasm to share feedback, but it seems you
              haven't even logged in yet! That's like trying to review a
              restaurant without tasting the food. 🤔
            </p>
            <p className="text-gray-200">
              How about we make a deal? Create an account, test out our amazing
              features, maybe find a few bugs (we're sure there are plenty 😅),
              and then come back to tell us what you think. We promise it'll be
              worth it!
            </p>
            <button
              onClick={() => (window.location.href = "/auth")}
              className="bg-yellow-400 hover:bg-yellow-600 text-black font-bold text-lg py-2 px-4 rounded-full w-full shadow-md transform transition-transform duration-300 hover:scale-105"
            >
              Log In and Roast Us!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="max-w-2xl mx-auto p-8 mt-8 bg-white shadow-lg rounded-3xl border border-gray-200">
        {loading ? (
          <div className="text-center space-y-4">
            <FaHeart className="w-16 h-16 text-red-500 mx-auto animate-spin" />
            <h2 className="text-2xl font-bold">Hold Tight...</h2>
            <p className="text-lg text-gray-600">
              We are definitely not making you wait on purpose - our servers are faster
              than your coffee brewing. 😉
            </p>
          </div>
        ) : !submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex justify-center space-x-2">
                <FaHeart className="w-10 h-10 text-red-500" />
                <h1 className="text-3xl font-bold text-gray-900">
                  We Love Feedback!
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Thank you for being our brave beta tester! Your feedback helps
                us make our app less buggy (maybe) and more awesome
                (definitely)! Whether you're here to praise us, roast us, or
                something in between - we're all ears!
              </p>
              <div className="flex justify-center space-x-6 py-4">
                <FaThumbsUp className="w-10 h-10 text-green-500" />
                <FaThumbsDown className="w-10 h-10 text-red-500" />
              </div>
              <textarea
                value={feedBack}
                onChange={(e) => setFeedBack(e.target.value)}
                placeholder="Tell us what you really think! Don't worry, our feelings are wrapped in try-catch blocks 😉"
                className="w-full min-h-[150px] border rounded-3xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-full w-full shadow-md transform transition-transform duration-300 hover:scale-105"
            >
              {loading ? "Submitting..." : "Submit Your Feedback"}
            </button>
          </form>
        ) : error ? (
          <div className="text-center space-y-4">
            <FaFrown className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold">Oops! Something Went Wrong.</h2>
            <p className="text-lg text-gray-600">
              Well, this is embarrassing. Looks like our code decided to take a
              coffee break. Try again, maybe?
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <FaHeart className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">You’re Awesome!</h2>
            <p className="text-lg text-gray-600">
              Thanks for sharing your thoughts! We’ll cherish your feedback
              forever. Or until the next bug report comes in. (Whichever comes
              first.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
