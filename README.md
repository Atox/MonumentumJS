# MonumentumJS
Realtime game server backend written with TypeScript on top of Node.js and using WebSockets for transporting. Implements fixed timestep simulation model, provides functional for game rooms management and peers handling. Suitable for client-server authoritative applications.

## Used modules
* **uWebSockets** for WebSocket server
* **nanotimer** for fixed timestep loop

Call `npm install uws nanotimer` inside TypeScript outDir (can be changed in tsconfig.json) to install modules required for a base server. If you want to run included example application you should also install `p2` module for game physics calculation.

For example:

```
cd js
npm install uws nanotimer p2`
```

## Server architecture

* **Service** is a WebSocket server and a game room manager. It accepts sockets, wraps them into **Peer** structure and emits events to hosted game rooms (and lobbies) for this peer. User must subclass **Service** and implement a matchmaking mechanism for players separation. **Service** will pass all socket events directly to the room assigned to it.

* **Room** is a shared game session. A **Peer** will be placed inside a game room after succesful connection to server. **Room** contains all information about it's peers, assigns unique IDs to them and provides some event callbacks to the used, such as: on peer join/on peer leave/message received. Implements a fixed timestep loop that can be initiated using `setTickTime(...)` that accepts seconds. User also must implement `void onTick()` and place all room's game logick inside it's body.

* **Peer** is a structure, that describes the connected socket. Contains the socket itself and a **Room** that it has been assigned to. User can extend **Peer** with interfaces to link additional information about particular player. After getting assigned to particular game room, the **Peer** gets unique ID.

**Service** and **Room** are abstract classes, user must subclass them and provide own realization.

## How to use
Make sure you have installed required modules for MonumentumJS. The engine comes with simple game example that realizes 2D physics based player movement in empty 2D space and uses simple binary protocol for communication between peers and server for such events like: peer joined/peer leaved/peer's state update/receive peer's input. The example requires `p2` module to be installed. You can build the example project with TypeScript compiler and use node to run the `App.js` by default located in `js` dir after succesful compilation. To create youw own project should instantiate subclassed **Service** with proper matchmaking, add some **Rooms** to it and run `myService.run(port)`
