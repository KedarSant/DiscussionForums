const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  linkedinURL: {
    type: String,
  },
  githubURL: {
    type: String,
  },
  facebookURL: {
    type: String,
  },
  twitterURL: {
    type: String,
  },
  lastName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followersCount: {
    type: Number,
    default : 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  }
})

module.exports = mongoose.model('User', UserSchema)
