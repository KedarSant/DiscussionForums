const moment = require('moment')
const Handlebars = require('handlebars')

module.exports = {
  formatDate: function (date, format) {
    return moment(date).utc().format(format)
  },
  truncate: function (str, len) {
    if (str.length > len && str.length > 0) {
      let new_str = str + ' '
      new_str = str.substr(0, len)
      new_str = str.substr(0, new_str.lastIndexOf(' '))
      new_str = new_str.length > 0 ? new_str : str.substr(0, len)
      return new_str + '...'
    }
    return str
  },
  stripTags: function (input) {
    var html = input
    return new Handlebars.SafeString(html)
  },

  editIcon: function (storyUser, loggedUser, storyId, floating = true) {
    if (storyUser._id.toString() == loggedUser._id.toString()) {
      if (floating) {
        return `<a href="/stories/edit/${storyId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`
      } else {
        return `<a href="/stories/edit/${storyId}"><i class="fas fa-edit"></i></a>`
      }
    } else {
      return ''
    }
  },

  editComment: function (commentUser, loggedUser, storyId, commentId ,floating = true) {
    if (commentUser._id.toString() == loggedUser._id.toString()) {
      if (floating) {
        return `<a href="/stories/${storyId}/editComment/${commentId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`
      } else {
        return `<a href="/stories/${storyId}/editComment/${commentId}"><i class="fas fa-edit"></i></a>`
      }
    } else {
      return ''
    }
  },

  deleteComment: function (commentUser, loggedUser, storyId, commentId, floating = true) {
    if (commentUser._id.toString() == loggedUser._id.toString()) {
      if (floating) {
        return `<form action="/stories/${storyId}/comment/${commentId}" method="POST" id="delete-form">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-floating halfway-fab btn red">
                        <i class="fas fa-trash"></i>
                    </button>
                </form>`
      } else {
        return `<form style="display:inline-block;" action="/stories/${storyId}/comment/${commentId}" method="POST" id="delete-form">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn red">
                        <i class="fas fa-trash"></i>
                    </button>
                </form>`
      }
    } else {
      return ''
    }
  },

  followingButton: function (following,loggedUser,profileUser) {
      if (!following) {
        return `<a href='/followUser/${profileUser}' class='btn btn-large btn-register waves-effect waves-light'>Follow</a>`
      } else {
        return `<a href='/unfollowUser/${profileUser}' class='btn btn-large orange waves-effect waves-light'>Unfollow</a>`
      }
  },

  reportButton: function (storyUser, loggedUser, storyId) {
    if (storyUser.toString() === loggedUser._id.toString()) {
      return ''
    } else {
      return `<div class="row">
                    <div class="col s2">
                        <a class="btn waves-effect waves-light" href="reportStory/${storyId}">Report</a>
                    </div>
                </div>`
    }
  },

  pagination: function (pageCategory, linkCategory) {
    if (pageCategory == linkCategory) {
      return 'active'
    } else {
      return 'waves-effect'
    }
  },

  deleteIcon: function (storyUser, loggedUser, storyId, floating = true) {
    if (storyUser._id.toString() == loggedUser._id.toString()) {
      if (floating) {
        return `<form action="/stories/${storyId}" method="POST" id="delete-form">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn-floating halfway-fab btn red">
                        <i class="fas fa-trash"></i>
                    </button>
                </form>`
      } else {
        return `<form style="display:inline-block;" action="/stories/${storyId}" method="POST" id="delete-form">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn red">
                        <i class="fas fa-trash"></i>
                    </button>
                </form>`
      }
    } else {
      return ''
    }
  },
  select: function (selected, category) {
    if (category == 'spam' || category == 'marketing') {
      return '<option value="private">Private</option>'
    } else {
      if (selected == 'private') {
        return `<option value="private" selected="selected">Private</option>
                <option value="public">Public</option>`
      } else {
        return `<option value="public" selected="selected">Public</option>
                <option value="private">Private</option>`
      }
    }
  },
  StripScripts : function (context) {
    var html = context;
    return new Handlebars.SafeString(html);
  }

}
