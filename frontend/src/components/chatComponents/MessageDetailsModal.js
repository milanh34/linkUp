import Avatar from "./Avatar";

const MessageDetailsModal = ({ isOpen, onClose, message, currentUserId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Message Details</h2>

        <div className="mb-4">
          <h3 className="font-semibold">Sender</h3>
          <div className="flex items-center space-x-2">
            <Avatar
              src={message.senderAvatar}
              alt={message.senderName}
              className="h-8 w-8"
            />
            <span>
              {message.senderName}{" "}
              {message.senderId === currentUserId && "(You)"}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Message Content</h3>
          <p>{message.message}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Read Status</h3>
          <div>
            <h4>Read By:</h4>
            {message.readBy && message.readBy.length > 0 ? (
              message.readBy.map((reader) => (
                <div
                  key={reader.userId}
                  className="flex justify-between items-center mb-2"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar
                      src={reader.avatar}
                      alt={reader.fullName}
                      className="h-6 w-6"
                    />
                    <span>
                      {reader.name} {reader.userId === currentUserId && "(You)"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(reader.readAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No one has read this message yet</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MessageDetailsModal;
