import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { emitSocketEvents } from "../socket.js";

const sendMessage = asyncHandler( async ( req, res ) => {

    const { receiverId, chatId, message } = req.body;
    const senderId = req.user._id;

    if((!receiverId && !chatId) || (!message && !req.file)){
        throw new ApiError(400, "Receiver ID or Chat ID and either a message or media file are required");
    }

    let media = null;
    if(req.file?.path){
        const mediaUploaded = await uploadOnCloudinary(req.file.path);
        if(!mediaUploaded.url){
            throw new ApiError(400, "Error while uploading the media file");
        }
        media = {
            url: mediaUploaded.url,
            type: mediaUploaded.resource_type,
        };
    }

    let chat = null;
    let isNewChat = false;

    try{
        if(chatId){
            chat = await Chat.findById(chatId);
            if(!chat){
                throw new ApiError(404, "Chat not found");
            }
        } else if(receiverId){
            const receiver = await User.findById(receiverId);
            if(!receiver){
                throw new ApiError(404, "Receiver not found");
            }

            const receiversId = typeof receiverId === "string" ? new mongoose.Types.ObjectId(receiverId) : receiverId;

            chat = await Chat.findOne({
                participants:{ 
                    $all:[
                        { $elemMatch: { userId: senderId } },
                        { $elemMatch: { userId: receiversId } }
                    ],
                    $size: 2 
                },
                isGroup: false,
            });

            if(!chat){
                chat = await Chat.create({
                    participants:[
                        { userId: senderId },
                        { userId: receiversId }
                    ],
                    isGroup: false,
                    messages: [],
                    lastMessageAt: Date.now(),
                });
                isNewChat = true;

                const roomIds = chat.participants.map(p => p.userId.toString());
                emitSocketEvents.chatCreated(req.io, roomIds, chat);
            }
        }

        const newMessage = {
            senderId,
            message: message || "",
            media: media || null,
            isMedia: !!media,
            sentAt: Date.now(),
            isRead: false
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = Date.now();
        chat.totalMessages += 1;
        await chat.save();

        const participantIds = chat.participants.map(p => p.userId.toString());
        
        emitSocketEvents.messageUpdated(req.io, participantIds, {
            isNewChat: isNewChat,
            chat: isNewChat ? chat : null,
            chatId: chat._id,
            lastMessage: newMessage,
            messages: chat.messages,
            unreadCount: chat.messages.filter(msg => !msg.isRead && msg.senderId.toString() !== senderId.toString()).length
        });

        return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newMessage,
                "Message Sent Successfully"
            )
        );
    } catch(error){
        console.error("Error in sendMessage:", error);
        throw new ApiError(500, "Error sending message");
    }
});

const getChatById = asyncHandler( async ( req, res ) => {

    const { chatId } = req.params;
    const currentUser = req.user._id;

    if(!chatId){
        throw new ApiError(400, "Chat ID is required");
    }

    const chat = await Chat.findById(chatId)
    .populate({
        path: "participants.userId",
        select: "username fullName bio avatar",
        match: { _id: { $ne: null } }
    })
    .lean();

    if(!chat){
        throw new ApiError(404, "Chat not found");
    }

    const participant = chat.participants.find((p) => p.userId?._id.toString() === currentUser.toString());
    if(!participant) {
        throw new ApiError(403, "User is not a participant in this chat");
    }

    const lastReadIndex = participant.lastReadIndex ?? -1;
    let participantsInfo = [];
    let otherParticipant = null;

    if(chat.isGroup){
        participantsInfo = chat.participants
        .filter(participant => participant.userId)
        .map(participant => ({
            userId: participant.userId._id,
            username: participant.userId.username,
            fullName: participant.userId.fullName,
            avatar: participant.userId.avatar,
        }));
    } else{
        otherParticipant = chat.participants.find(
            participant => participant.userId && !participant.userId._id.equals(currentUser)
        );
        if(otherParticipant?.userId){
            participantsInfo = {
                userId: otherParticipant.userId._id,
                username: otherParticipant.userId.username,
                fullName: otherParticipant.userId.fullName,
                bio: otherParticipant.userId.bio,
                avatar: otherParticipant.userId.avatar,
            };
        }
    }

    const sortedMessages = chat.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                chatId: chat._id,
                isGroup: chat.isGroup,
                chatName: chat.groupName || otherParticipant?.userId?.fullName,
                chatProfilePic: chat.groupProfilePic || otherParticipant?.userId?.avatar,
                groupAdmin: chat.groupAdmin || null,
                participants: participantsInfo,
                messages: sortedMessages,
                lastReadIndex,
            },
            "Message Fetched Successfully"
        )
    );
});

const getChats = asyncHandler( async ( req, res ) => {

    const userId = req.user._id;

    const chats = await Chat.aggregate([
        {
            $match: {
                participants: {
                    $elemMatch: {
                        userId: new mongoose.Types.ObjectId(userId),
                    },
                },
            },
        },
        {
            $addFields: {
                currentUser: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$participants",
                                as: "participant",
                                cond: {
                                    $eq: ["$$participant.userId", new mongoose.Types.ObjectId(userId)],
                                },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $addFields: {
                unreadMessages: {
                    $filter: {
                        input: {
                            $slice: [
                                "$messages",
                                { $add: ["$currentUser.lastReadIndex", 1] },
                                { $max: [1, { $subtract: ["$totalMessages", { $add: ["$currentUser.lastReadIndex", 1] }] }] },
                            ],
                        },
                        as: "message",
                        cond: {
                            $ne: ["$$message.senderId", new mongoose.Types.ObjectId(userId)], // Exclude messages sent by current user
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                unreadCount: { $size: "$unreadMessages" }
            }
        },
        {
            $addFields: {
                lastMessage: { $arrayElemAt: ["$messages", -1] },
                chatDetails: {
                    $cond: {
                        if: { $eq: ["$isGroup", true] },
                        then: {
                            groupName: "$groupName",
                            groupProfilePic: "$groupProfilePic",
                        },
                        else: {
                            participant: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$participants",
                                            as: "participant",
                                            cond: {
                                                $ne: ["$$participant.userId", new mongoose.Types.ObjectId(userId)],
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: "users", 
                localField: "chatDetails.participant.userId",
                foreignField: "_id",
                as: "participantDetails",
            },
        },
        {
            $addFields: {
                participantDetails: {
                    $arrayElemAt: ["$participantDetails", 0],
                },
            },
        },
        {
            $project: {
                _id: 1,
                isGroup: 1,
                chatDetails: 1,
                lastMessage: 1,
                unreadCount: 1,
                totalMessages: 1,
                "participantDetails.username": 1,
                "participantDetails.fullName": 1,
                "participantDetails.avatar": 1,
            },
        },
        {
            $sort: {
                "lastMessage.sentAt": -1,
            },
        },
    ]);
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            chats,
            "Chats fetched successfully"
        )
    )
});

const markAsRead = asyncHandler( async ( req, res ) => {

    const { chatId } = req.body;
    const userId = req.user._id;

    if(!chatId){
        throw new ApiError(400, "Chat ID is required");
    }

    const chat = await Chat.findById(chatId);
    if(!chat){
        throw new ApiError(404, "Chat not found");
    }

    const participant = chat.participants.find((p) => p.userId.toString() === userId.toString());
    if(!participant){
        throw new ApiError(403, "User is not a participant in this chat");
    }

    const lastReadIndex = participant.lastReadIndex ?? -1;
    let updated = false;

    chat.messages.forEach((msg, index) => {
        if(index > lastReadIndex && msg.senderId.toString() !== userId.toString()){
            if(!msg.isRead){
                msg.isRead = true;
            }
            msg.readBy.push({
                userId: userId,
                readAt: new Date(),
            });
            updated = true;
        }
    });

    const participantIndex = chat.participants.findIndex((p) => p.userId.toString() === userId.toString());
    chat.participants[participantIndex].lastReadIndex = chat.messages.length - 1;
    
    await chat.save();
    
    if(updated){
        const otherParticipantIds = chat.participants.map((p) => p.userId.toString()).filter((id) => id !== userId.toString());

        emitSocketEvents.messageRead(req.io, otherParticipantIds, {
            chatId: chat._id,
            userId: userId.toString(),
            isGroup: chat.isGroup,
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Messages marked as read successfully" 
        )
    );
});

const createGroup = asyncHandler( async ( req, res ) => {

    const { name } = req.body;
    const adminId = req.user._id;
  
    if(!name){
        throw new ApiError(400, "Group name is required");
    }

    let groupProfilePic = null;

    if(req.file?.path){
        const uploadedPic = await uploadOnCloudinary(req.file.path);
        if(!uploadedPic.url){
          throw new ApiError(400, "Error uploading group profile picture");
        }
        groupProfilePic = uploadedPic.url;
    }
  
    const groupChat = await Chat.create(
        {
            isGroup: true,
            groupName: name,
            groupAdmin: adminId,
            participants: [{ userId: adminId }],
            groupProfilePic: groupProfilePic || null,
        }
    );
  
    if(!groupChat){
      throw new ApiError(500, "Failed to create the group");
    }
  
    req.io.emit("groupCreated", groupChat);
  
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            groupChat,
            "Group created successfully"
        )
    );
});

const editGroupSettings = asyncHandler( async ( req, res ) => {

    const { chatId } = req.params;
    const { name } = req.body;
    const adminId = req.user._id;
  
    const groupChat = await Chat.findById(chatId);
  
    if(!groupChat){
        throw new ApiError(404, "Group not found");
    }
  
    if(!groupChat.groupAdmin.equals(adminId)) {
        throw new ApiError(403, "Only the group admin can edit group settings");
    }
  
    let groupProfilePic = groupChat.groupProfilePic;
  
    if(req.file?.path){
        const uploadedPic = await uploadOnCloudinary(req.file.path);
        if(!uploadedPic.url) {
            throw new ApiError(400, "Error uploading group profile picture");
        }
        groupProfilePic = uploadedPic.url;
        const oldGroupPic = groupChat.groupProfilePic?.split('/').pop().split('.')[0]
        if(oldGroupPic){
            const deletedGroupPic = await cloudinary.uploader.destroy(oldGroupPic, {resource_type: 'image', invalidate: true})
            console.log("Old group pic deleted? ", deletedGroupPic)
        }
    }
  
    groupChat.groupName = name || groupChat.groupName;
    groupChat.groupProfilePic = groupProfilePic;
  
    await groupChat.save();

    const participantIds = groupChat.participants.map((p) => p.userId.toString());
  
    emitSocketEvents.groupEdited(req.io, participantIds, {
        chatId,
        chat: groupChat,
    });
  
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            groupChat,
            "Group settings updated successfully"
        )
    );
});

const addGroupParticipant = asyncHandler( async ( req, res ) => {

    const { chatId } = req.params;
    const { participants } = req.body;

    if(!Array.isArray(participants)){
        throw new ApiError(400, "Participants should be an array");
    }
  
    const groupChat = await Chat.findById(chatId);
  
    if(!groupChat){
        throw new ApiError(404, "Group not found");
    }
  
    if(!groupChat.groupAdmin.equals(req.user._id)){
        throw new ApiError(403, "Only the group admin can add participants");
    }
  
    participants.forEach((id) => {
        if(!groupChat.participants.some((p) => p.userId.equals(id))){
            groupChat.participants.push({ userId: id });
        }
    });
  
    await groupChat.save();

    const participantIds = groupChat.participants.map((p) => p.userId.toString());
  
    emitSocketEvents.participantsAdded(req.io, participantIds, {
        chatId: groupChat._id,
        chat: groupChat,
        added: participants
    });
  
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            groupChat,
            "Participants added successfully"
        )
    );
});

const removeGroupParticipant = asyncHandler( async ( req, res ) => {

    const { chatId } = req.params;
    const { participantId } = req.body;
  
    const groupChat = await Chat.findById(chatId);
  
    if(!groupChat){
        throw new ApiError(404, "Group not found");
    }
  
    if(!groupChat.groupAdmin.equals(req.user._id)){
        throw new ApiError(403, "Only the group admin can remove participants");
    }
  
    groupChat.participants = groupChat.participants.filter(
        (p) => !p.userId.equals(participantId)
    );
  
    await groupChat.save();

    const participantIds = groupChat.participants.map((p) => p.userId.toString())

    emitSocketEvents.participantRemoved(req.io, [...participantIds, participantId], {
        chat: groupChat,
        removed: participantId
    });
  
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            groupChat,
            "Participant removed successfully"
        )
    );
});

const deleteGroup = asyncHandler( async ( req, res ) => {
    
    const { chatId } = req.params;
  
    const groupChat = await Chat.findById(chatId);
  
    if(!groupChat){
        throw new ApiError(404, "Group not found");
    }
  
    if(!groupChat.groupAdmin.equals(req.user._id)){
        throw new ApiError(403, "Only the group admin can delete the group");
    }
    
    if(groupChat.groupProfilePic && groupChat.groupProfilePic.trim() !== ""){
        const oldGroupPic = groupChat.groupProfilePic?.split('/').pop().split('.')[0]
        if(oldGroupPic){
            const deletedGroupPic = await cloudinary.uploader.destroy(oldGroupPic, {resource_type: 'image', invalidate: true})
            console.log("Old group pic deleted? ", deletedGroupPic)
        }
    }
  
    await Chat.findByIdAndDelete(chatId);
  
    const participantIds = groupChat.participants.map((p) => p.userId.toString());
  
    emitSocketEvents.groupDeleted(req.io, participantIds, {
        chatId,
        groupName: groupChat.groupName,
        groupProfilePic: groupChat.groupProfilePic,
    });
  
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Group deleted successfully"
        )
    );
});

export { sendMessage, getChatById, getChats, markAsRead, createGroup, editGroupSettings, addGroupParticipant, removeGroupParticipant, deleteGroup };
