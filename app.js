const path = require('path');
const env = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cors = require('cors');
const methodOverride = require('method-override');

const sql = require('./database/mysql');
const adminRoutes = require('./routes/admin');
// const staffRoutes = require('./routes/staff');
// const studentRoutes = require('./routes/student');
const homeRoutes = require('./routes/home');

// Load environment variables
env.config();

const app = express();

// Connect to the database
sql.connect();

// Middleware setup
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Session and flash messaging
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Set global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Set view engine and public directory
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.use('/admin', adminRoutes);
// app.use('/staff', staffRoutes);
// app.use('/student', studentRoutes);
app.use('/', homeRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started @ ${PORT}`);
});
