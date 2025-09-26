// server.js
const WebSocket = require("ws");
const url = require("url");

// Create a WebSocket server on port 8090

const port = process.env.PORT || 8090;
const wss = new WebSocket.Server({ port });

// Map to store users and their corresponding WebSocket connections
const users = new Map();

wss.on("connection", (ws, req) => {
  const parameters = url.parse(req.url, true);
  const username = parameters.query.username;

  if (!username) {
    ws.send(
      JSON.stringify({ error: "Username is required in the query params" })
    );
    ws.close();
    return;
  }

  // Add user to the map with unique identifier to handle multiple connections with same username
  const connectionId = `${username}_${Date.now()}_${Math.random()}`;
  users.set(connectionId, { ws, username });
  console.log(`${username} connected as ${connectionId}`);
  console.log(
    "All connected users:",
    Array.from(users.entries()).map(([id, conn]) => `${id} (${conn.username})`)
  );

  ws.on("message", (message) => {
    let parsedMessage;
    console.log("\n=== INCOMING MESSAGE ===");
    console.log(
      "Current connected users:",
      Array.from(users.entries()).map(
        ([id, conn]) => `${id} (${conn.username})`
      )
    );
    console.log("Total connections:", users.size);
    console.log("Raw message type:", typeof message);

    // Convert Buffer to string if needed
    const messageString =
      message instanceof Buffer ? message.toString() : message;
    console.log("Message string:", messageString);

    try {
      parsedMessage = JSON.parse(messageString);
      console.log("Parsed message:", JSON.stringify(parsedMessage, null, 2));
    } catch (error) {
      console.error("Invalid JSON received:", messageString);
      ws.send(JSON.stringify({ error: "Invalid JSON format" }));
      return;
    }
    const { channel, data } = parsedMessage;
    // Broadcast message to all connected clients
    users.forEach((connection, connectionId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        // Forward the original message structure from sender
        connection.ws.send(JSON.stringify(parsedMessage));
        console.log(
          "✅ Message sent to username:",
          connection.username,
          "via connection:",
          connectionId,
          "Channel:",
          channel
        );
      }
    });
  });

  ws.on("close", () => {
    // Find and delete the connection by websocket instance
    for (const [connId, connection] of users.entries()) {
      if (connection.ws === ws) {
        users.delete(connId);
        console.log(`${connection.username} disconnected (${connId})`);
        break;
      }
    }
    console.log(
      "Remaining connected users:",
      Array.from(users.entries()).map(
        ([id, conn]) => `${id} (${conn.username})`
      )
    );
  });
});

console.log(
  "WebSocket server for communication with moveo webhook is running on ws://localhost:8090. Its one of 2 application required for running StaticWenbsite using MOVEO chat to trigger product and send to cart. Please refer to README.md for more details."
);
