import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowerCase: true,
            trim: true,
            index: true,
        },
        email:{
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowerCase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar:{
            type: String, //cloudinary url
           required: true,
        },
        bio:{
            type: String,
            trim: true,
        },
        password:{
            type: String,
            required: [true, "Password is required"],
        },
        isEmailVerified:{
            type: Boolean,
            default: false,
        },
        isOnline:{
            type: Boolean,
            default: false,
        },
        isTyping:{
            type: Boolean,
            default: false,
        },
        lastSeen:{
            type: Date,
        },
        friends:[
            {
                userId:{
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        refreshToken:{
            type: String,
        },
        verificationToken:{
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
