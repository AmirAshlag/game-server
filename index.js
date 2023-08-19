const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());
// const { gameDataRouter } = require("./routers/gameData-router");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

const roomToUsers = new Map();

io.on("connection", (socket) => {
  let currentRoom = null;
  let userId = null;
  console.log("wow");

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
    console.log("joind room", user);
  });

  socket.on("update-scoreboard", (userId, score, gameId) => {
    // console.log("updating");
    if (roomToUsers.has(gameId)) {
      const users = roomToUsers.get(gameId);
      const userIndex = users.findIndex((user) => user.userId === userId);
      // console.log(userIndex, "index");       

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
      // console.log("recived", currentRoom);
      const users = roomToUsers.get(currentRoom);
      // console.log(users, "users");
      io.to(currentRoom).emit("scoreboard-updated", users);
    }
  });

  socket.on("leave-room", (gameId, userId) => {
    // console.log(roomToUsers);
    console.log("hey", roomToUsers.has(gameId), gameId);
    if (roomToUsers.has(gameId)) {
      console.log("leaving");
      const users = roomToUsers.get(gameId);
      const index = users.findIndex((user) => user.userId === userId);
      // console.log(index);
      if (index !== -1) {
        users.splice(index, 1);
        console.log(users, "users", users.length);
        if (!users.length) {
          roomToUsers.delete(gameId);
        } else {
          roomToUsers.set(gameId, users);
          io.to(gameId).emit("scoreboard-updated", users);
        }
      }
    }

    // console.log(`User with userId ${userId} has disconnected`);
  });
});

httpServer.listen("7070", () => {
  console.log("listening on port 7070");
});

// app.use("/data", gameDataRouter);
