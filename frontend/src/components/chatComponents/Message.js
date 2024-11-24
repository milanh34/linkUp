import { motion } from "framer-motion";
import { CheckCheck, Check, Download } from "lucide-react";

const Message = ({ msg, isCurrentUser, onMessageClick, onDownload, avatar }) => {
  const messageVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      x: isCurrentUser ? 20 : -20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        duration: 0.5,
        bounce: 0.3,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        duration: 0.3,
      },
    },
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    let fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    return fileExtension === "mp3" ? "mpeg" : fileExtension;
  };
  const renderMediaContent = () => {
    if (!msg.media) return null;

    const extension = getFileExtension(msg?.media?.url);
    const mediaType = msg?.media?.type || '';

    if (mediaType.includes('image')) {
      return (
        <div className="relative group mt-2">
          <img 
            src={msg.media.url} 
            alt={"Image"}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              window.open(msg.media.url, '_blank');
            }}
          />
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(msg.media.url);
            }}
            className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full text-white"
          >
            <Download size={16} />
          </motion.button>
        </div>
      );
    }

    // Audio
    if (mediaType.includes('video') && (extension === "mpeg" || extension === "wav")) {
      return (
        <div className="relative group mt-2">
          <video 
            controls 
            className="w-full"
          >
            <source src={msg.media.url} type={`audio/${extension}`} />
            Your browser does not support the audio tag.
          </video>
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(msg.media.url);
            }}
            className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full text-white"
          >
            <Download size={16} />
          </motion.button>
        </div>
      );
    }

    // Videos
    if (mediaType.includes('video')) {
      return (
        <div className="relative group mt-2">
          <video 
            controls 
            className="max-w-full rounded-lg"
          >
            <source src={msg.media.url} type={`${mediaType}/${extension}`} />
            Your browser does not support the video tag.
          </video>
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(msg.media.url);
            }}
            className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full text-white"
          >
            <Download size={16} />
          </motion.button>
        </div>
      );
    }

    // Other files
    return (
      <motion.div 
        className={`flex items-center space-x-2 rounded-lg p-3 mt-2 ${
          isCurrentUser ? 'bg-blue-700/50' : 'bg-white'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex-1 truncate">
          <p className={`text-sm font-medium truncate ${
            isCurrentUser ? 'text-white' : 'text-gray-800'
          }`}>
            {mediaType}
          </p>
          <p className={`text-xs uppercase ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {extension}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            onDownload(msg.media.url);
          }}
          className={`${
            isCurrentUser ? 'text-white' : 'text-blue-600'
          } hover:opacity-80`}
        >
          <Download size={20} />
        </motion.button>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={messageVariants}
      className={`flex mb-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {!isCurrentUser && (
        <div className="h-8 w-8 mr-2 self-end flex-shrink-0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {avatar}
          </motion.div>
        </div>
      )}
      <motion.div
        className={`group relative max-w-[70%] p-4 rounded-2xl transition-all duration-300
            ${
              isCurrentUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none hover:from-blue-600 hover:to-blue-700"
                : "bg-white text-gray-800 rounded-bl-none shadow-sm hover:bg-gray-50"
            }`}
        onClick={onMessageClick}
        whileHover={{ y: -2 }}
        layout
      >
        {msg.message && (
          <p className="text-[15px] leading-relaxed">{msg.message}</p>
        )}
        {renderMediaContent()}
        <motion.div
          className={`flex items-center space-x-1 mt-1 text-xs ${
            isCurrentUser ? "text-blue-100" : "text-gray-400"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>
            {new Date(msg.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isCurrentUser && (
            <span className="transition-opacity duration-200 opacity-75 hover:opacity-100">
              {msg.isRead ? (
                <CheckCheck size={16} className="text-current" />
              ) : (
                <Check size={16} className="text-current" />
              )}
            </span>
          )}
        </motion.div>
        <div
          className={`absolute bottom-0 ${
            isCurrentUser ? "right-0" : "left-0"
          } w-4 h-4 ${
            isCurrentUser
              ? "bg-gradient-to-br from-blue-600 to-blue-700"
              : "bg-white"
          } transform translate-y-[1px]`}
          style={{
            clipPath: isCurrentUser
              ? "polygon(0 0, 100% 0, 100% 100%)"
              : "polygon(0 0, 100% 0, 0 100%)",
          }}
        />
      </motion.div>
      {isCurrentUser && (
        <div className="h-8 w-8 ml-2 self-end flex-shrink-0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {avatar}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Message;
