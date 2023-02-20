const User = require('../../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport')

function authController() {
    function _getRedirectUrl(req) {
        return req.user.role === 'admin' ? '/admin/orders' : '/'
    }
    return {
        login(req, res) {
            res.render('auth/login');
        },
        postLogin(req, res, next) {

            //validate request

            // if (!email || !password) {
            //     req.flash('error', 'Error: All fields are required');
            //     return res.redirect('/');
            // }

            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    req.flash('error', info.message);
                    next(err);
                }
                if (!user) {
                    req.flash('error', info.message);
                    return res.redirect('/login')
                }

                req.login(user, (err) => {
                    if (err) {
                        req.flash('error', info.message);
                        next(err);
                    }

                    return res.redirect(_getRedirectUrl(req));
                });
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register');
        },
        async postRegister(req, res) {
            const { name, email, password } = req.body;

            //validate request

            if (!name || !email || !password) {
                req.flash('error', 'Error: All fields are required');
                req.flash('name', name);
                req.flash('email', email);
                return res.redirect('/register');
            }

            //checking if email is already taken
            User.exists({ email: email }, (err, result) => {
                if (result) {
                    req.flash('error', 'Error: Email already taken.Try another email.');
                    req.flash('name', name);
                    req.flash('email', email);
                    return res.redirect('/register');
                }
            });

            //hasing the password
            const hashPassword = await bcrypt.hash(password, 10);

            //creating user
            const user = new User({
                email,
                name,
                password: hashPassword
            });

            user.save().then((user) => {
                //login
                console.log(user);
                return res.redirect('/');

            }).catch((err) => {
                req.flash('error', 'Error: Something went wrong.Try again.');
                return res.redirect('/');
            });

            // console.log(req.body);
        },
        logout(req, res, next) {

            req.logout(function (err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/')
            });
        }
    }
}

module.exports = authController