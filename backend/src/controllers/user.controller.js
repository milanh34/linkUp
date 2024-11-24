import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
} 

const registerUser = asyncHandler( async ( req, res ) => {

    const { username, email, password, fullName, bio } = req.body

    if(
        [username, email, password, fullName, bio].some((field) => field?.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existingUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Path is required");
    }

    let avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        bio,
        avatar: avatar.url,
        isEmailVerified: false,
        verificationToken: null,
        friends: [],
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdUser,
            "User Registration Successful"
        )
    )

})

const loginUser = asyncHandler( async ( req, res ) => {

    const { email, username, password } = req.body

    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials");
    }

    if(!user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email before logging in");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save();

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User Login Successful"
        )
    )

})

const logoutUser = asyncHandler( async ( req, res ) => {

    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            },
            $set: {
                isOnline: false, 
                lastSeen: Date.now() 
            },
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logout Successful"
        )
    )
})

const refreshAccessToken = asyncHandler( async ( req, res ) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler( async ( req, res ) => {

    const { oldPassword, newPassword, confirmPassword } = req.body

    if(!(oldPassword && newPassword && confirmPassword)){
        throw new ApiError(400, "All password fields are required")
    }

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400, "New Password and Confirm Password do not match")
    }

    const user = await User.findById(req.user?._id)

    const isPassCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPassCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const forgotPassword = asyncHandler( async ( req, res ) => {

    const { identifier } = req.body;

    if(!identifier){
        throw new ApiError(400, "Email or Username is required")
    }

    const user = await User.findOne(
        {
            $or: [
                { email: identifier },
                { username: identifier }
            ],
        }
    );

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const newPassword = Math.random().toString(36).slice(-8);
    console.log(newPassword);

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; text-align: center;">Password Reset Request</h2>
            <p>Hi <strong>${user?.fullName}</strong>,</p>
            <p>We received a request to reset your password for your Live Chat account. Your new temporary password is:</p>
            <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 18px; font-weight: bold; color: #4CAF50; background-color: #f9f9f9; padding: 10px; border-radius: 5px; display: inline-block;">
                    ${newPassword}
                </p>
            </div>
            <p style="color: #ff0000; font-weight: bold;">Important:</p>
            <p>Please log in using this password and change it immediately to ensure your account's security.</p>
            <p>If you didn’t request this password reset, please contact our support team immediately.</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0;" />
            <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
    `;

    await transporter.sendMail({
        from: '"Live Chat" <no-reply@app.com>',
        to: user?.email,
        subject: "Verify Your Email",
        html: emailContent,
    });

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async ( req, res ) => {

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user, 
            "Current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler( async ( req, res ) => {

    const { fullName, email, bio } = req.body;
    const updates = {};

    if(fullName){
        updates.fullName = await fullName;
    }
    if(email){
        updates.email = await email;
    }
    if(bio){
        updates.bio = await bio;
    }
    if(req.file?.path){
        const avatar = await uploadOnCloudinary(req.file?.path);
        if(!avatar.url){
            throw new ApiError(400, "Error while uploading avatar");
        }
        const oldAvatar = req.user?.avatar?.split('/').pop().split('.')[0]
        if(oldAvatar){
            const deletedAvatar = await cloudinary.uploader.destroy(oldAvatar, {resource_type: 'image', invalidate: true})
            console.log("Old avatar deleted? ", deletedAvatar)
        }
        updates.avatar = await avatar.url;
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: updates
        },
        { 
            new: true
        }
    ).select("-password");

    if(!user){
        throw new ApiError(404, "Error updating details")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )
})

const getUserProfile = asyncHandler( async ( req, res ) => {

    const { userId } = req.query;

    if(!userId){
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId).select("-password -isEmailVerified -friends -refreshToken -verificationToken");

    if(!user){
        throw new ApiError(404, "User not found or email not verified");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User profile fetched successfully"
        )
    );
})

const searchUsers = asyncHandler( async ( req, res ) => {

    const { query } = req.query;

    if(!query || query.trim() === ""){
        throw new ApiError(400, "Search query is required");
    }

    const users = await User.find({
        $or: [
            { username: new RegExp(query, "i") },
            { fullName: new RegExp(query, "i") },
        ],
    }).select("-password -isEmailVerified -friends -refreshToken -verificationToken");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            users,
            "Search results fetched successfully"
        )
    );
});

const addFriend = asyncHandler( async ( req, res ) => {

    const { userId } = req.body;

    if(!userId){
        throw new ApiError(400, "User Id is required");
    }

    const friend = await User.findById(userId);

    if(!friend){
        throw new ApiError(404, "User not found");
    }

    if(friend._id.equals(req.user._id)){
        throw new ApiError(400, "You cannot add yourself as a friend");
    }

    const user = await User.findById(req.user._id);

    const isAlreadyFriend = user.friends.some((f) => f.userId.equals(friend._id));
    if(isAlreadyFriend) {
        throw new ApiError(400, "User is already in your friend list");
    }

    user.friends.push({ userId: friend._id });
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                friendId: friend._id
            },
            "Friend added successfully"
        )
    );
});

const removeFriend = asyncHandler( async ( req, res ) => {

    const { userId } = req.body;

    if(!userId){
        throw new ApiError(400, "Friend ID is required");
    }

    const user = await User.findById(req.user._id);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    user.friends = user.friends.filter((friend) => !friend.userId.equals(userId));

    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Friend removed successfully"
        )
    );
});

const getFriends = asyncHandler( async ( req, res ) => {

    const user = await User.findById(req.user._id).populate({
        path: "friends.userId",
        select: "fullName username avatar bio isOnline lastSeen",
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const friends = user.friends.map((f) => ({
        _id: f.userId._id,
        fullName: f.userId.fullName,
        username: f.userId.username,
        avatar: f.userId.avatar,
        bio: f.userId.bio,
        isOnline: f.userId.isOnline,
        lastSeen: f.userId.lastSeen
    }));

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            friends,
            "Friends list fetched successfully"
        )
    );
});

const sendVerificationEmail = asyncHandler( async ( req, res ) => {

    const { username } = req.params

    if(!username || username.trim() === ""){
        throw new ApiError(400, "Username is required")
    }

    const user = await User.findOne({
        username
    });

    if(!user){
        throw new ApiError(400, "User is required")
    }

    const verificationToken = jwt.sign(
        {
            email: user.email
        },
        process.env.VERIFICATION_TOKEN_SECRET,
        {
            expiresIn: "1d"
        }
    );

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
            $set: {
                verificationToken: verificationToken
            }
        },
        { 
            new: true
        }
    );
    
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; text-align: center;">Welcome to Live Chat!</h2>
            <p>Hi <strong>${user?.fullName}</strong>,</p>
            <p>Thank you for registering on our platform. To complete your registration, please verify your email address by clicking the link below:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationLink}" style="background-color: #4CAF50; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #888; font-size: 12px; text-align: center;">If the button above doesn't work, copy and paste this link into your browser: <a href="${verificationLink}">${verificationLink}</a></p>
            <hr style="border: none; border-top: 1px solid #f0f0f0;" />
            <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
    `;
    
    await transporter.sendMail({
        from: '"Live Chat" <no-reply@app.com>',
        to: user?.email,
        subject: "Verify Your Email",
        html: emailContent,
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Verification Email sent successfully"
        )
    )

})

const verifyEmail = asyncHandler( async ( req, res ) => {

    const { token } = req.query;

    if(!token){
        throw new ApiError(400, "Verification token is required")
    }

    try{
        const decodedUser = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
        const user = await User.findOne({ email: decodedUser.email });
    
        if(!user){
            throw new ApiError(404, "User not found");
        }
    
        if(user.isEmailVerified){
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Email is already verified"
                )
            );
        }
    
        user.isEmailVerified = true;
        user.verificationToken = null;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #4CAF50; text-align: center;">Email Verified Successfully!</h2>
                <p>Hi <strong>${user.fullName}</strong>,</p>
                <p>Congratulations! Your email address has been successfully verified.</p>
                <p>You can now enjoy all the features and benefits ofLive Chat.</p>
                <p>Thank you for being a part of our community!</p>
                <hr style="border: none; border-top: 1px solid #f0f0f0;" />
                <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
            </div>
        `;
        await transporter.sendMail({
            from: '"Live Chat" <no-reply@app.com>',
            to: user.email,
            subject: "Email Verified Successfully",
            html: emailContent,
        });
    
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Email has been verified successfully"
            )
        );
    } catch(error){
        throw new ApiError(401, "Invalid or expired verification token");
    }
})

const sendFeedback = asyncHandler( async ( req, res ) => {

    const { message } = req.body;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; text-align: center;">New Feedback Received</h2>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Full Name:</strong> ${user.fullName}</p>
            ${
                user.avatar
                    ? `<p><strong>Avatar:</strong></p><img src="${user.avatar}" alt="User Avatar" style="max-width: 100px; height: auto; border-radius: 50%;" />`
                    : `<p><strong>Avatar:</strong> No avatar provided</p>`
            }
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0;" />
            <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
    `;

    await transporter.sendMail({
        from: '"Live Chat Feedback" <no-reply@app.com>',
        to: process.env.FEEDBACK_EMAIL,
        subject: "New Feedback from User",
        html: emailContent,
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            message,
            "Feedback has been submitted successfully"
        )
    );
});


export { registerUser , loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, forgotPassword, getCurrentUser, updateAccountDetails, getUserProfile, searchUsers, addFriend, removeFriend, getFriends, sendVerificationEmail, verifyEmail, sendFeedback }