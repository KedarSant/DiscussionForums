
const express = require('express')
const router = express.Router()
const Room = require('../models/Room')
const { ensureAuth } = require('../middleware/auth')

router.get('/joinRoom', ensureAuth,  async (req, res) => {
    try {
        let rooms = await Room.find({}).lean()

        res.render('chat/joinroom', {
            rooms
        })
    } catch (err) {
        res.render('error/404')
    }
})

router.get('/', ensureAuth, (req, res) => {
    try {
        res.render('chat/chatroom')
    } catch (err) {
        res.render('error/404')
    }
})

router.post('/addRoom', ensureAuth, async (req, res) => {
    try {
        req.body.createdBy = req.user.id;
        let room = await Room.find({ name: req.body.name })
        if (room.length === 0) {
            await Room.create(req.body)
            res.redirect('/chatrooms/joinRoom')
        }
        res.redirect('/chatrooms/joinRoom')
    } catch (err) {
        res.render('error/404')
    }
})

module.exports = router