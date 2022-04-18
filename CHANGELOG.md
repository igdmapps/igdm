### 3.0.4 / 2022-04-18 ###

* Fix login flow from returning 404 errors (thank you @jeancaffou)
* Fix broken media messages (thank you @7urkm3n)

### 3.0.3 / 2021-05-29 ###

* Fix broken images (thank you @7urkm3n)

### 3.0.2 / 2021-04-25 ###

* show unexpected errors in UI
* upgrade instagram API module
* adding time display to media content
* added indication of last message date to chat list


### 3.0.1 / 2020-05-02 ###

* Fix missing app menu
* Better message notifications


### 3.0.0 / 2020-04-29 ###

* Add maxlength attribute to message input
* Add option to save image
* Reset message input height after it grows tall
* When viewing media messages, make close button always clickable
* Play video in carousel
* Stop playing video once it is closed
* Add option to auto launch IGdm on start up
* Add option to delete conversation
* Make auto-update optional
* Show cascading avatars in group chats
* Better handling of sending messages
* Indicate when users are "active" or "last seen"
* Render video messages
* Fix 2FA
* Fix image upload
* Upload audio, and video


### 2.8.1 / 2019-11-05 ###

* Show user thumbnail in chat header
* Cache older messages per convo
* Better UX when loading chat
* Make media messages look less overwhelming


### 2.8.0 / 2019-10-31 ###

* 2FA Support
* Better ux for chatList


### 2.7.1 / 2019-09-11 ###

* Better URL parsing (again)
* Fix not able to contact new people
* add ability to copy image URL to clipboard


### 2.7.0 / 2019-08-21 ###

* disable drag and drop
* use group and chat titles
* render Message As ActionLog
* add support for audio media
* render message reactions (message likes)
* render GIFs
* less confusing "send 'seen' receipts" indicator

### 2.6.5 / 2019-04-27 ###

* fix "No Configs given" issue

### 2.6.4 / 2019-04-06 ###

* fix marking "seen" from triggering error
* fix chat switching glitch
* fix raven media (story like posts sent from phone)

### 2.6.3 / 2019-04-02 ###

* Fix login challenge issue

### 2.6.2 / 2019-02-24 ###

* Fix link parsing in messages

### 2.6.1 / 2018-12-26 ###

* Fix Segfault issue on Linux

### 2.6.0 / 2018-12-22 ###

* Fix notification on windows
* Friendly image upload UX
* Chat message performance improvement

### 2.5.4 / 2018-09-30 ###

* Fix endless "message sending..." glitch

### 2.5.3 / 2018-09-20 ###

* Add support for checkpoint verification

### 2.5.2 / 2018-09-08 ###

* Fix broken "Quote message"
* Fix Broken linux build

### 2.5.1 / 2018-06-11 ###

* Mute Notifications

### 2.5.0 / 2018-06-04 ###

* Load older chat messages

### 2.4.3 / 2018-06-01 ###

* Fix inbox list

### 2.4.2 / 2018-05-29 ###

* Fix Users not following bug

### 2.4.1 / 2018-04-21 ###

* Fix cookie error

### 2.4.0 / 2018-03-25 ###

* New fresh UI look (thank you @ciolt)
* Use HTML 5 notifications
* Fix for chat not updating after a long while (by fixing electron timeout)
* Warn about no 2fa support (thank you @raimille1)

### 2.3.1 / 2018-01-07 ###

* store user cookies in external app directory

### 2.3.0 / 2017-12-04 ###

* Render stories when they are replied to (thank you @cce)
* close modal view on esc button
* fix unneeded new thread creation when DMing a group [#22](issues/22)
* You can now upload photos in the DM [#3](issues/3)

### 2.2.0 / 2017-09-27 ###

* Add notification badges to app icon [#29](issues/29)
* View shared IG posts within the app [#27](issues/27)
* Display user profile pic on settings icon.
* Render links as media now. [#34](issues/34)

### 2.1.0 / 2017-08-14 ###

* Link to report an issue [#18](issues/18)
* Link to star the project.
* Failed login error messages (thank you @andela-mmakinde) [#17](issues/17)
* Parse urls within messages (thank you @solomon-fibonacci) [#6](issues/6)
* Support newline in message sending/formatting [#21](issues/21)
* Fix chatlist/chatrooms refusing to update after sometime.
* Quote messages now formats on newlines

### 2.0.2 / 2017-06-20 ###

* Fix cookie file storage permission issues on linux
* Fix Message date not showing day of the month. (Thanks @solomon-fibonacci)
* Display Unfollowers in grid form. (Thanks @solomon-fibonacci)


### 2.0.1 / 2017-06-02 ###

* Fix Message 'Seen' receipts bug.


### 2.0 / 2017-06-01 ###

* Better notification behaviour
* Quote a chat message.
* Get users not following back
* Render 'like' messages
* Render image messages
* Display 'seen' reciepts
* Configurable 'seen' receipts
* Label group message sender
* Software auto-update on new version


### 1.0.2 / 2017-04-10 ###
* Fix for issue [#1](https://github.com/ifedapoolarewaju/igdm/issues/1)


### 1.0.1 / 2017-04-05 ###

* Fix osx clipboard commands issues


### 1.0.0 / 2017-04-05 ###

* Initial release
