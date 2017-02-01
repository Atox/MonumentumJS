import { Service } from './Monumentum/Service';
import { Room } from './Monumentum/Room';
import { Peer } from './Monumentum/Peer';
import { DataViewController } from './DataViewController'
import { Player } from './Player'
import p2 = require('p2')

enum ServerProtocol {
	AssignID,
	WorldSnapshot,
	PlayerJoined,
	PlayerLeaved,
	UpdatePlayer
}

enum ClientProtocol {
	UpdateInput
}

interface Connection extends Peer {
	id: number;
	gameObject: Player;
}

class BattleRoom extends Room {
	buffer: ArrayBuffer;
	dv: DataView;
	dvc: DataViewController;
	indvc: DataViewController;
	updated: Array<Connection>;
	world: p2.World;

	constructor(holder: Service) {
		super(holder);
		this.buffer = new ArrayBuffer(2048);
		this.dv = new DataView(this.buffer);
		this.dvc = new DataViewController(this.dv, DataViewController.littleEndian);
		this.updated = [];
		this.indvc = new DataViewController(null, DataViewController.littleEndian);
		this.world = new p2.World({ gravity: [0,0] });
		this.setTickTime(0.1);
	}

	sendBuffer(peer: Peer): void {
		peer.send(this.buffer.slice(0, this.dvc.index));
	}

	initPlayer(player: Connection): void {
		player.id = this.peers.indexOf(player);
		player.gameObject = new Player();
	}

	onJoin(peer: Connection): void {
		this.initPlayer(peer);
		console.log('Peer ' + peer.id + ' joined');
		this.dvc.reset();
		this.dvc.writeUInt8(ServerProtocol.AssignID);
		this.dvc.writeUInt16(peer.id);
		peer.gameObject.serialize(this.dvc);
		this.sendBuffer(peer);
		if (this.peers.length > 1) {
			this.dvc.reset();
			this.dvc.writeUInt8(ServerProtocol.WorldSnapshot);
			this.dvc.writeUInt16(this.peers.length - 1);
			for (let other of this.peers) {
				if (other != peer) {
					this.dvc.writeUInt16((<Connection>other).id);
					(<Connection>other).gameObject.serialize(this.dvc);
				}
			}
			this.sendBuffer(peer);
		}
		this.dvc.reset();
		this.dvc.writeUInt8(ServerProtocol.PlayerJoined);
		this.dvc.writeUInt16(peer.id);
		(<Connection>peer).gameObject.serialize(this.dvc);
		for (let other of this.peers) {
			if (other != peer)
				this.sendBuffer(other);
		}
		this.world.addBody(peer.gameObject.body);
	}

	onLeave(peer: Connection): void {
		console.log('Peer ' + peer.id + ' leaved');
		this.dvc.reset();
		this.dvc.writeUInt8(ServerProtocol.PlayerLeaved);
		this.dvc.writeUInt16(peer.id);
		for (let other of this.peers)
			this.sendBuffer(other);
		this.world.removeBody(peer.gameObject.body);
	}

	onMessage(peer: Connection, message: string | ArrayBuffer): void {
		if (message instanceof ArrayBuffer) {
			this.indvc.load(new DataView(message), DataViewController.littleEndian);
			let packetID = this.indvc.readUInt8();
			if (packetID == 0)
				peer.gameObject.keys = this.indvc.readUInt8();
		}
	}

	onTick(): void {
		for (let peer of this.peers) {
			/*if ((<Connection>peer).gameObject.lastKeys != (<Connection>peer).gameObject.keys) {
				this.updated.push(<Connection>peer);
				(<Connection>peer).gameObject.lastKeys = (<Connection>peer).gameObject.keys;
			}*/
			this.updated.push(<Connection>peer);
		}
		if (this.updated.length > 0) {
			this.dvc.reset();
			this.dvc.writeUInt8(ServerProtocol.UpdatePlayer);
			this.dvc.writeUInt16(this.updated.length);
			for (let peer of this.updated) {
				this.dvc.writeUInt16(peer.id);
				this.dvc.writeUInt8(peer.gameObject.keys);
				(<Connection>peer).gameObject.serialize(this.dvc);
			}
			for (let peer of this.peers)
				this.sendBuffer(peer);
		}
		for (let peer of this.updated) {
			(<Connection>peer).gameObject.simulate(this.tickTime);
		}
		this.updated = [];
		this.world.step(this.tickTime);
	}

	onAbandon(): void {

	}
}

class TanksService extends Service {
	constructor() {
		super();
	}

	onStart(): void {
		this.addRoom(new BattleRoom(this));
	}

	onStop(): void {

	}

	onConnect(peer: Peer): Room {
		for (let room of this.rooms)
			if (room instanceof BattleRoom)
				return room;
		return null;
	}

	onAbandon(peer: Peer): Room {
		for (let room of this.rooms)
			if (room instanceof BattleRoom)
				return room;
		return null;
	}

	onDisconnect(peer: Peer): void {

	}
}

let service = new TanksService();
service.run(2048);