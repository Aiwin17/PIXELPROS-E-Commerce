const express = require("express");
const db = require("./config/connection");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const dotenv = require("dotenv");
const path = require("path");
const logger = require("morgan");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const nocache = require("nocache");

dotenv.config();

const app = express();

//Middleware sets the response header Cache-Control
app.use(nocache());
app.use((req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache,private,no-Store,must-revalidate,max-scale=0,post-check=0,pre-check=0"
  );
  next();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Setting up middleware functions in an Express application
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//Setting up a session middleware in an Express application
app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 },
  })
);

//Database Connection
db.connect((err) => {
  if (err) console.log("Connection Error");
  else console.log("Database Connected");
});

//Route Middleware
app.use("/", userRouter);
app.use("/admin", adminRouter);

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  let errorPage;
  res.render("error", { errorPage: true });
});

module.exports = app;
