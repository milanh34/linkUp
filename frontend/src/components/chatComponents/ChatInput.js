import { useState, useRef } from "react";
import { Send, Image, Video, Music, X, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const ChatInput = ({ onSendMessage, handleTyping }) => {
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const fileInputRef = useRef(null);

  const mediaTypes = {
    image: {
      accept: "image/*",
      icon: Image,
      label: "Image"
    },
    video: {
      accept: "video/*",
      icon: Video,
      label: "Video"
    },
    audio: {
      accept: "audio/*",
      icon: Music,
      label: "Audio"
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        event.target.value = null;
        return;
      }
      setMediaFile(file);
      setShowMediaSelector(false);
    }
  };

  const handleMediaTypeSelect = (type) => {
    fileInputRef.current.accept = mediaTypes[type].accept;
    fileInputRef.current.click();
  };

  const handleRemoveFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSend = () => {
    if (!message.trim() && !mediaFile) return;
    onSendMessage(message, mediaFile);
    setMessage("");
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <div className="w-full border-t bg-white px-4 py-3">
      {mediaFile && (
        <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600 truncate">
            {mediaFile.name}
          </span>
          <button
            onClick={handleRemoveFile}
            className="ml-2 text-gray-500 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="relative flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            handleTyping();
            setMessage(e.target.value)
        }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-400"
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => setShowMediaSelector(!showMediaSelector)}
          className="text-gray-500 hover:text-blue-600 p-2"
        >
          <Paperclip size={20} />
        </button>

        <AnimatePresence>
          {showMediaSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-14 bottom-14 bg-white rounded-lg shadow-lg p-2 space-y-2"
            >
              {Object.entries(mediaTypes).map(([type, { icon: Icon, label }]) => (
                <button
                  key={type}
                  onClick={() => handleMediaTypeSelect(type)}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSend}
          disabled={!message.trim() && !mediaFile}
          className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;