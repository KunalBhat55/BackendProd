import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cookieParser());

app.use(express.json({limit: '2mb'}));
app.use(express.urlencoded({extended: true, limit: '2mb'}));
app.use(express.static('public'));
app.use(cors())

// Routes
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);


export {app};