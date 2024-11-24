import SERVER_API from "./server.api.js";

export const sendMessage = `${SERVER_API}/chats/send-message`;
export const getChatById = `${SERVER_API}/chats/get-chat`;
export const getChats = `${SERVER_API}/chats/get-chats`;
export const markAsRead = `${SERVER_API}/chats/mark-as-read`;
export const createGroup = `${SERVER_API}/chats/create-group`;
export const editGroupSettings = `${SERVER_API}/chats/edit-group`;
export const addGroupParticipant = `${SERVER_API}/chats/group/add`;
export const removeGroupParticipant = `${SERVER_API}/chats/group/remove`;
export const deleteGroup = `${SERVER_API}/chats/delete-group`;