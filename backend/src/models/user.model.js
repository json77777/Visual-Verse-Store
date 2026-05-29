import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import { env } from "../config/env.js";
import mongoosePaginate from "mongoose-paginate-v2"


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  avatar: {
    type: String, // cloudinary url
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  refreshToken: {
    type: String,
  },
  isActive:{
    type:Boolean,
    default:true
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
},{timestamps:true});

userSchema.plugin(mongoosePaginate)

// using hooks --- do this before saving

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


// Compares plain password with hashed password
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken =  function () {
  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      username:this.username,
      role:this.role
    }, 
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:env.ACCESS_TOKEN_EXPIRY
    }
  )
}


userSchema.methods.generateRefreshToken =  function () {
  return jwt.sign(
    {
      _id:this._id,
    }, 
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model('User', userSchema)