const { request } = require('express')
const express = require('express')
const router = express.Router()
const { ensureAuth, ensureGuest } = require('../middleware/auth')

const Story = require('../models/Story')
const User = require('../models/User')

// @desc    Login/Landing page
// @route   GET /
router.get('/', ensureGuest, (req, res) => {
  res.render('login', {
    layout: 'login',
  })
})

// @desc    Dashboard
// @route   GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    const stories = await Story.find({ user: req.user.id }).lean()
    res.render('dashboard', {
      name: req.user.firstName,
      stories,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// get user's profile
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    
    const stories = await Story.find({
      user: req.user.id,
      status: 'public',
    }).lean()

    var profile = true

    var user = await User.findById(req.user.id).lean()
    res.render('profile/profile', {
      user,
      stories,
      profile
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// get any other user's profile

router.get('/profile/:userId', ensureAuth, async (req, res) => {
  try {

    if (req.params.userId == req.user.id) {
      res.redirect('/profile')
    }

    const stories = await Story.find({
      user: req.params.userId,
      status: 'public',
    }).lean()

    var user = await User.findById(req.params.userId).lean()
    let following  = false
    if (user.followersCount == 0) {
      following = false
    }
    else {
      let followers = user.followers
      const follower = followers.filter(id => id == req.user.id)
      if (follower.length === 0) {
        following = false
      } else {
        following = true
      }
    }

    res.render('profile/profile', {
      user,
      stories,
      following,
      loggedUser : req.user.id
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// Show user profile edit page

router.get('/user/edit/:userId', ensureAuth, async (req, res) => {

  try {
    if (req.user.id !== req.params.userId) {
      res.redirect('/profile')
    }

    var user = await User.findById(req.params.userId).lean()

    res.render('profile/edit', {
      user
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// Update user profile details
router.put('/user/edit/:userId', ensureAuth, async (req, res) => {

  try {
    let user = await User.findById(req.params.userId).lean()

    if (!user) {
      return res.render('error/404')
    }

    if (req.params.userId !== req.user.id) {
      console.log('bc')
      res.redirect('/profile')
    } else {
      user = await User.findOneAndUpdate({ _id: req.params.userId }, {
        $set: {
          linkedinURL: req.body.linkedinURL,
          githubURL: req.body.githubURL,
          facebookURL: req.body.facebookURL,
          twitterURL: req.body.twitterURL,
          bio : req.body.bio
        }
      }, {
        new: true,
        runValidators: true,
      })
      console.log(user)
      res.redirect('/profile')
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }

})

// Follow a user

router.get('/followUser/:id', ensureAuth, async (req, res) => {

  try {
    let profileUser = await User.findById(req.params.id)
    let loggedUser = req.user

    if (!profileUser) {
      return res.render('error/404')
    }

    if (req.params.id == req.user.id) {
      res.redirect(`/profile/${req.params.id}`)
    }

    // Increase the other user's followers by 1

    let followers = []
    let followersCount = profileUser.followersCount + 1
    if (typeof profileUser.followers == 'undefined') {
      followers = [loggedUser]
    }
    else {
      followers = [...profileUser.followers, loggedUser]
    }

    profileUser = await User.findOneAndUpdate({ _id: req.params.id }, {
      $set: {
        followers: followers,
        followersCount : followersCount,
      }
    }, {
      new: true,
      runValidators: true,
    })

    // Increase the logged in user's following count by 1

    let following = []
    let followingCount = loggedUser.followingCount + 1
    if (typeof loggedUser.following == 'undefined') {
      following = [profileUser]
    }
    else {
      following = [...loggedUser.following, profileUser]
    }

    loggedUser = await User.findOneAndUpdate({ _id: req.user.id }, {
      $set: {
        following: following,
        followingCount: followingCount,
      }
    }, {
      new: true,
      runValidators: true,
    })

    res.redirect(`/profile/${ req.params.id }`)

  } catch (err) {
    console.error(err)
    return res.render('error/404')
  }
})

// Unfollow a user

router.get('/unfollowUser/:id', ensureAuth, async (req, res) => {

  try {
    let profileUser = await User.findById(req.params.id)
    let loggedUser = req.user

    if (!profileUser) {
      return res.render('error/404')
    }

    if (req.params.id == req.user.id) {
      res.redirect(`/profile/${req.params.id}`)
    }

    // Decrease the other user's followers by 1

    if (profileUser.followersCount == 0) {
      res.redirect(`/profile/${req.params.id}`)
    }

    let followers = profileUser.followers
    followers = followers.filter((id) => id != req.user.id)

    if (followers.length == profileUser.followers.length) {
      res.redirect(`/profile/${req.params.id}`)
    }

    let followersCount = profileUser.followersCount - 1

    profileUser = await User.findOneAndUpdate({ _id: req.params.id }, {
      $set: {
        followers: followers,
        followersCount: followersCount,
      }
    }, {
      new: true,
      runValidators: true,
    })

    // Decrease the logged in user's following count by 1

    if (loggedUser.followingCount == 0) {
      res.redirect(`/profile/${req.params.id}`)
    }

    let following = loggedUser.following
    following = following.filter((id) => id != req.params.id)

    if (following.length == loggedUser.following.length) {
      res.redirect(`/profile/${req.params.id}`)
    }

    let followingCount = loggedUser.followingCount - 1

    loggedUser = await User.findOneAndUpdate({ _id: req.user.id }, {
      $set: {
        following: following,
        followingCount: followingCount,
      }
    }, {
      new: true,
      runValidators: true,
    })

    res.redirect(`/profile/${req.params.id}`)

  } catch (err) {
    console.error(err)
    return res.render('error/404')
  }
})




module.exports = router
