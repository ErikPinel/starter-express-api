const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const Lesson = require('./model/lesson.js')

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["*"],
  },
});

function getAllConnectedClients(roomId) {
  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
      };
    }
  );
}

var userCountObj = {};
io.on("connection", (socket) => {
  var currentRoom;
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data, id) => {
    currentRoom = data;
    console.log("joinroom" + "id:" + id);
    if (userCountObj[data] == null) {
      userCountObj[data] = 1;
    } else {
      userCountObj[data] += 1;
    }

    await socket.join(data);

    const clients = getAllConnectedClients(data);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        socketId: socket.id,
      });
    });

    console.log("socket room number" + userCountObj[data]);
    emitRoomSize(data, userCountObj[data], id);
  });

  socket.on("send_message", (data) => {
    console.log(data.data + "send_message");
    emitCode(data);
  });

  socket.on("sync_code", ({ socketId, data }) => {
    console.log("sync" + "----" + data);
    if (data) io.to(socketId).emit("receive_message", data);
  });

  const emitCode = (data) =>
    socket.to(data.room).emit("receive_message", data.data);
  const emitRoomSize = (room, size, id) =>
    io.to(room).emit("room_size", size, id);

  socket.on("disconnect", (data) => {
    console.log("disconnected: " + socket.id);
    userCountObj[currentRoom] -= 1;
  });
});

// app.post('/api/v1/createLesson/',async function(req,res){
//     try{
//         const { lessonName } = req.body;
//         const newLesson = new Lesson({
//             lessonName:lessonName,
//             lastSavedCode:"-"
//         });
//         await newLesson.save();
//         res.status(201).json(newLesson.lastSavedCode);
//     }catch(err)
//     {
//         res.status(409).json({ message: err.message });
//     }
// });

app.get('/api/v1/lastSavedCode/:lessonName/',async function(req,res,next){
    try{
        const { lessonName } = req.params;
        const lesson = await Lesson.findOne({ "lessonName": lessonName });
        res.status(200).json(lesson.lastSavedCode);
    }catch(err){
        res.status(409).json({ message: err.message });
    }
});



app.patch('/api/v1/saveCode/',async function(req,res){
    try{
        const { lessonName,code } = req.body;
        await Lesson.updateOne(
            { lessonName: lessonName },
            {
                lessonName:lessonName,
                lastSavedCode:code
                
            },
            {
                ignoreUndefined: true,
            }
        );
        res.status(201).json("update");
    }catch(err){
        res.status(409).json({ message: err.message });
    }
});





mongoose
  .connect(process.env.MONGODB_URI, {
    autoIndex: true,
  })
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log("SERVER IS RUNNING");
    });
  });
