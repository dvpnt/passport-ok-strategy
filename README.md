# passport-ok-strategy
[![Build Status](https://api.travis-ci.org/dvpnt/passport-ok-strategy.svg)](https://travis-ci.org/dvpnt/passport-ok-strategy)
[![Coverage Status](https://coveralls.io/repos/github/dvpnt/passport-ok-strategy/badge.svg?branch=master)](https://coveralls.io/github/dvpnt/passport-ok-strategy?branch=master)
[![NPM Version](https://img.shields.io/npm/v/passport-ok-strategy.svg)](https://www.npmjs.com/package/passport-ok-strategy)

[Passport](http://passportjs.org/) strategy for authenticating with [odnoklassniki](https://ok.ru/)
using the OAuth 2.0 API.

## Install
    $ npm i passport-ok-strategy

## Usage

#### Configure Strategy

```js
var passport = require('passport'),
    OdnoklassnikiStrategy = require('passport-ok-strategy').Strategy;

passport.use(new OdnoklassnikiStrategy({
    clientID: '<app id>',
    clientPublic: '<public key>',
    clientSecret: '<secret key>',
    callbackURL: 'http://localhost:3000/auth/odnoklassniki/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({okId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'odnoklassniki'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/odnoklassniki',
  passport.authenticate('odnoklassniki'));

app.get('/auth/odnoklassniki/callback',
  passport.authenticate('odnoklassniki', {failureRedirect: '/login'}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

## License

[The MIT License](https://raw.githubusercontent.com/dvpnt/passport-ok-strategy/master/LICENSE)
