import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const app = express();
app.use(cors());

const httpServer = createServer(app);
const prisma = new PrismaClient({});

// Crucial: Allow cross-origin requests from your Vercel frontend
const io = new Server(httpServer, {
  cors: {
    origin: "*", // You can restrict this to your vercel domain later
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_request", (ServiceRequestID) => {
    socket.join(`request_${ServiceRequestID}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { message, ReplyByID, Status, ServiceRequestID } = data;

      const reply = await prisma.serviceRequestReply.create({
        data: {
          Message: message,
          RepliedByID: Number(ReplyByID),
          StatusID: Number(Status),
          ServiceRequestID: Number(ServiceRequestID),
        },
        include: { Users: true },
      });

      io.to(`request_${ServiceRequestID}`).emit("receive_message", reply);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Render or Railway will dynamically assign a PORT env variable
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`WebSocket running on port ${PORT}`);
});
