
const User = require('../models/User')


async function createSpamIdentificationBot() {

    let user = await User.findOne({ displayName: "Spam Identification Bot" })

    if (user == null) {
        return User.create({
            googleId: 'Nan',
            displayName: 'Spam Identification Bot',
            firstName: 'Nan',
            lastName: 'Nan'
        })
    } else {
        return user
    }
}

function getPostCategory(response) {
    let intent = JSON.parse(response).intent
    if (typeof intent.feedback === 'object' && intent.feedback !== null) {
        intent.feedback = intent.feedback.score
    }
    return Object.keys(intent).reduce((a, b) => intent[a] > intent[b] ? a : b);
}

function getSpamMessage() {
    return 'This post has been classified as a spam/marketing post and thus its status has been set to private. This post will be hidden from your followers and from the public feed. This is done to weed out low quality content.'
}

module.exports = {
    createSpamIdentificationBot,
    getPostCategory,
    getSpamMessage,
}