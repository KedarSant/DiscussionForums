const express = require('express')
const router = express.Router()
const { ensureAuth } = require('../middleware/auth')

const Story = require('../models/Story')
const Comment = require('../models/Comment')
const pd = require('paralleldots')
const sendMail = require("../utils/mail")
const { getPostCategory,getSpamMessage } = require('./../utils/spamIdentification')
const { keywords } = require('paralleldots')


// Set paralleldots API key
pd.apiKey = process.env.PD_APIKEY

// @desc    Show add page
// @route   GET /stories/add
router.get('/add', ensureAuth, (req, res) => {
  res.render('stories/add')
})

// @desc    Process add form
// @route   POST /stories
router.post('/', ensureAuth, async (req, res) => {
  req.body.user = req.user.id
  let str = `${req.body.title} ${req.body.body}`
  pd.intent(str, 'en')
    .then(async (response) => {
      let category = getPostCategory(response)
      req.body.category = category
      if (category == 'spam' || category == 'marketing') {
        let comment = await Comment.create({
          body: getSpamMessage(),
          user: process.env.SPAM_IDENTIFICATION_BOT_ID,
        })
        req.body.status = 'private'
        req.body.comments = [comment]
        req.body.keywords = []
      } else {
        req.body.keywords = JSON.parse(await pd.keywords(str, 'en')).keywords.map(word => word.keyword);
      }
      await Story.create(req.body)
      res.redirect('/dashboard')
    }).catch((error) => {
      console.error(error);
      res.render('error/500');
    })
})
  
// @desc    Show all stories
// @route   GET /stories
router.get('/', ensureAuth, async (req, res) => {
  try {
    let category = req.query.category
    const stories = category == 'all' ? await Story.find({status: 'public',}).populate('user').sort({ createdAt: 'desc' }).lean() : await Story.find({status: 'public',category}).populate('user').sort({ createdAt: 'desc' }).lean()

    res.render('stories/index', {
      stories,
      feed: true,
      category
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// Show home page

router.get('/home', ensureAuth, async (req, res) => {
  try {
    let following = req.user.following
    let home = true;
    let stories = await Story.find({
      status: 'public',
      user : { "$in": following },
    }).populate('user').lean()
      
    res.render('stories/index', {
      stories,
      home
    })

  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    Show single story
// @route   GET /stories/:id
router.get('/:id', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id).populate('user').populate({
      path: 'comments',
      model: 'Comment',
      populate : {
        path: 'user',
        model: 'User'
      }
    }).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (story.user._id != req.user.id && story.status == 'private') {
      res.render('error/404')
    } else {
      res.render('stories/show', {
        name : req.user.displayName,
        story,
      })
    }
  } catch (err) {
    console.error(err)
    res.render('error/404')
  }
})

// @desc    Show edit page
// @route   GET /stories/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
    }).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (story.user != req.user.id) {
      res.redirect('/stories')
    } else {
      res.render('stories/edit', {
        story,
      })
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// @desc    Update story
// @route   PUT /stories/:id
router.put('/:id', ensureAuth, async (req, res) => {

  try {
    let story = await Story.findById(req.params.id).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (story.user != req.user.id) {
      res.redirect('/stories')
    }
    let str = `${req.body.title} ${req.body.body}`
    pd.intent(str, 'en')
      .then(async (response) => {
        let category = getPostCategory(response)
        req.body.category = category
        if (category == 'spam' || category == 'marketing') {
          let comment = await Comment.create({
            body: getSpamMessage(),
            user: process.env.SPAM_IDENTIFICATION_BOT_ID,
          })
          req.body.status = 'private'
          req.body.comments = [comment]
          req.body.keywords = []
        } else {
          req.body.keywords = JSON.parse(await pd.keywords(str, 'en')).keywords.map(word => word.keyword);
        }
        await Story.findOneAndUpdate({ _id: req.params.id }, req.body, {
          new: true,
          runValidators: true
        })
        res.redirect('/dashboard')
      }).catch((error) => {
        console.error(error);
        res.render('error/500');
      })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// Add a comment to a post
router.post('/:id/addComment', ensureAuth, async (req, res) => {
  try {
    req.body.user = req.user.id

    let story = await Story.findById(req.params.id).lean()

    if (!story) {
      return res.render('error/404')
    }

    let comment = await Comment.create(req.body)
    let comments = []

    if (typeof story.comments == 'undefined') {
      comments = [comment]
    }
    else {
      comments = [...story.comments, comment]
    }

    story = await Story.findOneAndUpdate({ _id: req.params.id}, {comments : comments} , {
      new: true,
      runValidators: true,
    })

    res.redirect(`/stories/${req.params.id}`)

  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
  
  
})

// Show the page to edit a comment

router.get('/:storyId/editComment/:commentId', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.storyId).populate('user').populate({
      path: 'comments',
      model: 'Comment',
      populate: {
        path: 'user',
        model: 'User'
      }
    }).lean()

    let comment = await Comment.findById(req.params.commentId).populate('user').lean()

    if (!story) {
      return res.render('error/404')
    }

    if (!comment) {
      return res.render('error/404')
    }

    if ((story.user._id != req.user.id && story.status == 'private') || (comment.user._id != req.user.id)) {
      res.render('error/404')
    } else {
      res.render('stories/editComment', {
        name: req.user.displayName,
        story,
        comment,
      })
    }
  } catch (err) {
    console.error(err)
    res.render('error/404')
  }
})

// @desc    Delete story
// @route   DELETE /stories/:id

router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (story.user != req.user.id) {
      res.redirect('/stories')
    } else {
      await Comment.deleteMany({ _id: { "$in": story.comments } })
      await Story.deleteOne({ _id: req.params.id })
      res.redirect('/dashboard')
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// update comment

router.put('/:storyId/comment/:commentId', ensureAuth, async (req, res) => {

  try {
    let story = await Story.findById(req.params.storyId).populate('user').populate({
      path: 'comments',
      model: 'Comment',
      populate: {
        path: 'user',
        model: 'User'
      }
    }).lean()

    let comment = await Comment.findById(req.params.commentId).populate('user').lean()

    if (!story) {
      return res.render('error/404')
    }

    if (!comment) {
      return res.render('error/404')
    }

    if (comment.user._id != req.user.id) {
      console.log(comment.user._id)
      console.log(req.user.id)
      return res.render('error/404')
    }

    comment = await Comment.findOneAndUpdate({ _id: req.params.commentId }, { body: req.body.body }, {
      new: true,
      runValidators: true,
    })

    res.redirect(`/stories/${req.params.storyId}`)

  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }
})

// delete a comment

router.delete('/:storyId/comment/:commentId', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.storyId).lean()
    let comment = await Comment.findById(req.params.commentId).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (!comment) {
      return res.render('error/404')
    }

    if (comment.user != req.user.id) {
      res.redirect(`/stories/${req.params.storyId}`)
    } else {
      await Comment.remove({ _id: req.params.commentId })
      let comments = story.comments
      comments = comments.filter(comment => comment != req.params.commentId)
      story = await Story.findOneAndUpdate({ _id: req.params.storyId }, { comments: comments }, {
        new: true,
        runValidators: true,
      })
      res.redirect(`/stories/${req.params.storyId}`)
    }
  } catch (err) {
    console.error(err)
    return res.render('error/500')
  }

})

// Show the page to report a story

router.get('/reportStory/:storyId', ensureAuth, async (req, res) => {
  let story = await Story.findById(req.params.storyId).lean()

  if (!story) {
    return res.render('error/404')
  }

  if (story.user == req.user.id) {
    res.redirect(`/stories/${req.params.storyId}`)
  }

  pd.abuse(story.body, 'en')
    .then(async (response) => {
      let data = JSON.parse(response)
      if (data.abusive > 0.5 || data.hate_speech > 0.5) {
        await Story.remove({ _id: req.params.storyId })
        return res.render('report/report', {
          story,
          abusive : true,
        })
      }
      return res.render('report/report', {
        story,
      })
    }).catch((error) => {
      console.error(error);
      return res.render('error/500')
    })

})

// Send mail to admin for reporting post

router.post('/reportStory/:storyId', ensureAuth, async (req, res) => {

  try {
    let story = await Story.findById(req.params.storyId).lean()

    if (!story) {
      return res.render('error/404')
    }

    if (story.user == req.user.id) {
      res.redirect(`/stories/${req.params.storyId}`)
    }

    await sendMail(req.user.id, req.user.displayName, req.body.reason, req.params.storyId, story.body);

    return res.render('report/acknowledgement.hbs')
  } catch (err) {
    console.error(err);
    return res.render('error/500')
  }

})

// Search posts according to a given query

router.get('/search/query', ensureAuth, async (req, res) => {

  try {
    let query = req.query.keyword

    let stories = await Story.find({
      status: 'public',
      keywords: { "$regex": `.*${query}.*`, "$options" : 'i'},
    }).populate('user').lean()

    res.render('stories/index', {
      stories,
      search: true,
      searchKeyword : query
    })

  } catch (err) {
    console.error(err);
    return res.render('error/500')
  }
})

module.exports = router
