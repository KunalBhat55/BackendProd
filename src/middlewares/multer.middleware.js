import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    // const { filename, path, size } = req.file;
  },
});
export const upload = multer({ storage: storage }); // process files uploaded multipart/form-data
