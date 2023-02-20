// const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');

function init(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        //login
        //check if user exits
        const user = await User.findOne({ email: email });

        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        //if user found.then comparing password
        bcrypt.compare(password, user.password).then(match => {
            if (match) {
                return done(null, user, { message: 'Logged in successfully' });
            }
            return done(null, false, { message: 'Invalid email or password' });
        }).catch(err => {
            return done(null, false, { message: 'something went wrong' });
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
}

module.exports = init;