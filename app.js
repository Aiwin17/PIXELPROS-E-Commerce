var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer')
const nocache = require("nocache");


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const newFilename = `${timestamp}_${path.basename(file.originalname, ext)}.jpg`;
    cb(null, newFilename);
  }
});

const upload = multer({storage: fileStorage})

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
// const expresslayout = require('express-ejs-layouts')
var app = express();
var db=require('./config/connection')
var session=require('express-session')
var fileUpload=require('express-fileupload')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"Key",cookie:{maxAge:600000000}}))

app.use(multer({dest:'./public/images',storage:fileStorage}).array('image'))
app.use(nocache());
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache,private,no-Store,must-revalidate,max-scale=0,post-check=0,pre-check=0');
  next();
})

db.connect((err)=>{
  if(err){
    console.log("Connection Error");
  }
  else{
  console.log("Database Connected");
  }
})
// app.use(fileUpload())
// app.use(expresslayout)
app.use('/', userRouter);
app.use('/admin', adminRouter);
// app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partial'}))
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  if(err.status === 404){
    res.render("error")
  }else{
    res.status(err.status || 500);
    res.render('error');
  }
});

module.exports = app;
