import { Room } from './Room'

export interface IWebSocket extends WebSocket {
	peer: Peer;
}

export class Peer {
	public readonly url: string;
	public room: Room;
	public socket: IWebSocket;

	constructor(ws: IWebSocket) {
		this.socket = ws;
		this.url = ws.url;
	}

	public send(data: string | ArrayBuffer) {
		this.socket.send(data);
	}
}