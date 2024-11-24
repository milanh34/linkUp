import SERVER_API from "./server.api.js";

export const register = `${SERVER_API}/users/register`;
export const login = `${SERVER_API}/users/login`;
export const logout = `${SERVER_API}/users/logout`;
export const refreshToken = `${SERVER_API}/users/refresh-token`;
export const changePassword = `${SERVER_API}/users/change-password`;
export const forgotPassword = `${SERVER_API}/users/forgot-password`;
export const currentUser = `${SERVER_API}/users/current-user`;
export const updateDetails = `${SERVER_API}/users/update-details`;
export const userProfile = `${SERVER_API}/users/profile`;
export const searchUser = `${SERVER_API}/users/search`;
export const addFriend = `${SERVER_API}/users/add-friend`;
export const removeFriend = `${SERVER_API}/users/remove-friend`;
export const getFriends = `${SERVER_API}/users/friends`;
export const sendVerificationEmail = `${SERVER_API}/users/send-verification-email`;
export const verifyEmail = `${SERVER_API}/users/verify-email`;
export const sendFeedback = `${SERVER_API}/users/feedback`;