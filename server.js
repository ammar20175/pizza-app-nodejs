require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const expressLayout = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo');
const passport = require('passport');
const Emitter = require('events');

const app = express();


// pulbic files
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

//importing database connection from /config/db.js
const connectDB = require('./app/config/db');
connectDB();

//json parsing 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());




//Session
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoDbStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/pizza' }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 1 }
}))

app.use(flash());

//passport config
const passportInit = require('./app/config/passport');
const order = require('./app/models/order');
const { Socket } = require('socket.io');
passportInit(passport)
app.use(passport.initialize());
app.use(passport.session());

//Event emitter
const eventEmitter = new Emitter();
//binding eventEmitter in app so it can be use anywhere in app
app.set('eventEmitter', eventEmitter);

//Global middleware so that session is avaible globally
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});


//setting template engine
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');


//routes define in web.js and calling it here.
require('./routes/web')(app)
app.use((req, res) => {
    res.status(404).render('errors/404')
});




const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    // console.log(socket.id)
    //listing for socket('join')
    socket.on('join', (orderId) => {
        socket.join(orderId);
    });

});


eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data);
});

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
});
