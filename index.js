const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/", (req, res, next) => {
  console.log("hey");
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://goldratt-game23.onrender.com",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

const roomToUsers = new Map();

io.on("connection", (socket) => {
  let currentRoom = null;
  let userId = null;

  socket.on("join-room", (user) => {
    socket.join(user.roomId);
    currentRoom = user.roomId;
    userId = user.userId;

    if (!roomToUsers.has(user.roomId)) {
      roomToUsers.set(user.roomId, []);
    }
    const users = roomToUsers.get(user.roomId);
    users.push(user);
    io.to(user.roomId).emit("scoreboard-updated", users);
    roomToUsers.set(user.roomId, users);
  });

  socket.on("update-scoreboard", (userId, score, gameId) => {
    if (roomToUsers.has(gameId)) {
      const users = roomToUsers.get(gameId);
      const userIndex = users.findIndex((user) => user.userId === userId);

      if (userIndex !== -1) {
        users[userIndex].score = score;
        roomToUsers.set(gameId, users);
        io.to(gameId).emit("scoreboard-updated", users);
      }
    }
  });

  socket.on("finished-game", () => {
    if (roomToUsers.has(currentRoom)) {
      const users = roomToUsers.get(currentRoom);
      const userIndex = users.findIndex((user) => user.userId === userId);

      if (userIndex !== -1) {
        console.log(users[userIndex]);
        users[userIndex].finished = true;
        // roomToUsers.set(currentRoom, users);
        io.to(currentRoom).emit("scoreboard-updated", users);
      }
    }
  });

  socket.on("get-scoreboard", () => {
    if (roomToUsers.has(currentRoom)) {
      const users = roomToUsers.get(currentRoom);
      io.to(currentRoom).emit("scoreboard-updated", users);
    }
  });

  socket.on("leave-room", (gameId, userId) => {
    if (roomToUsers.has(gameId)) {
      const users = roomToUsers.get(gameId);
      const index = users.findIndex((user) => user.userId === userId);
      if (index !== -1) {
        users.splice(index, 1);
        if (!users.length) {
          roomToUsers.delete(gameId);
        } else {
          roomToUsers.set(gameId, users);
          io.to(gameId).emit("scoreboard-updated", users);
        }
      }
    }
  });
});

httpServer.listen("7070", () => {
  console.log("listening on port 7070");
});



// app.use("/data", gameDataRouter);
