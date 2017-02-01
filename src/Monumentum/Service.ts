import nano = require('nanomsg');
import ws = require('uws');
import { Room } from './Room';
import { Peer, IWebSocket } from './Peer'

export type RoomType = { new(id: number): Room };

// Array Remove – By John Resig (MIT Licensed)
function remove(ar: Array<any>, index: number): void {
	var rest = ar.slice(index + 1);
    ar.length = index < 0 ? ar.length + index : index;
    return ar.push.apply(ar, rest);
};

export abstract class Service {
	private wss: ws.Server;

	protected rooms: Array<Room>;

	protected abstract onStart(): void;
	protected abstract onStop(): void;
	protected abstract onConnect(peer: Peer): Room;
	protected abstract onAbandon(peer: Peer): Room;
	protected abstract onDisconnect(peer: Peer): void;

	constructor() {
		this.rooms = new Array<Room>();
	}

	public run(port: number): void {
		this.wss = new ws.Server({ port: port });
		this.wss.on('connection', this.onConnection.bind(this));
		this.wss.on('close', this.onConnection.bind(this));
		this.onStart();
	}

	public stop(): void {
		this.onStop();
		for (let room of this.rooms)
			room.abandon();
		this.wss.close();
	}

	public addRoom(room: Room): Room {
		if (room != null)
			this.rooms.push(room);
		else
			console.error('ERROR! Service.addRoom(): argument room is null');
		return room;
	}

	public removeRoom(room: Room): void {
		if (room != null) {
			let index = this.rooms.indexOf(room);
			if (index > -1) {
				room.stop();
				room.onAbandon();
				for (let peer of room.peers) {
					let newRoom = this.onAbandon(peer);
					if (newRoom != null) {
						newRoom.peers.push(peer);
						newRoom.onJoin(peer);
					}
				}
				//this.rooms.splice(index, 1);
				remove(this.rooms, index);
			}
			else
				console.error('ERROR! Service.removeRoom(): room not found');
		}
		else
			console.error('ERROR! Service.removeRoom(): argument room is null');
	}

	public removePeer(peer: Peer): void {
		peer.socket.close();
		if (peer.room != null) {
			let index = peer.room.peers.indexOf(peer);
			if (index > -1) {
				peer.room.onLeave(peer);
				//delete peer.room.peers[index];
				remove(peer.room.peers, index);
			}
			else
				console.error('ERROR! Service.removePeer(): peer not found in room');
		}
		else
			console.error('ERROR! Service.removePeer(): argument is null');
	}

	public transferPeer(peer: Peer, room: Room) {
		if (peer != null && peer.room != null) {
			let index = peer.room.peers.indexOf(peer);
			if (index > -1) {
				console.error('ERROR! Service.transferPeer(): peer not found in room, but continuing to transfer');
				//delete peer.room.peers[index];
				remove(peer.room.peers, index);
			}
			peer.room.onLeave(peer);
			room.peers.push(peer);
			room.onJoin(peer);
		}
		else
			console.error('ERROR! Service.transferPeer(): one of arguments is null');
	}

	private onConnection(ws: IWebSocket): void {
		ws.peer = new Peer(ws);
		let room = this.onConnect(ws.peer);
		if (room == null)
			ws.close();
		else {
			ws.peer.room = room;
			ws.onclose = this.onClose.bind(this, ws);
			ws.onmessage = this.onMessage.bind(this, ws);
			room.peers.push(ws.peer);
			room.onJoin(ws.peer);
		}
	}

	private onClose(ws: IWebSocket, ev: CloseEvent): void {
		if (ws.peer != null && ws.peer.room != null) {
			let index = ws.peer.room.peers.indexOf(ws.peer);
			if (index > -1) {
				//delete ws.peer.room.peers[index];
				remove(ws.peer.room.peers, index);
			}
			ws.peer.room.onLeave(ws.peer);
			this.onDisconnect(ws.peer);
		}
	}

	private onMessage(ws: IWebSocket, ev: MessageEvent): void {
		if (ws.peer != null && ws.peer.room != null)
			ws.peer.room.onMessage(ws.peer, ev.data);
	}
}