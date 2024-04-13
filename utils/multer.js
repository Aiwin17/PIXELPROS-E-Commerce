const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
});

const customFileFilter = (req, file, callback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  console.log("this is file name :", ext);
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    callback(new Error("File type is not supported"), false);
    return;
  }
  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    customFileFilter(req, file, (error, acceptFile) => {
      callback(error, acceptFile);
    });
  },
});

module.exports = upload;

