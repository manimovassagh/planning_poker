import http from "http";
import { app } from "./app";
import { setupSocket } from "./socket";

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
