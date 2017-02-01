import cluster = require('cluster');
import { Service } from './Service'
import { Peer } from './Peer'

let NanoTimer = require('nanotimer');

export abstract class Room {
	public peers: Array<Peer>;

	protected tickTime: number;

	private timer: any;
	private holder: Service;

	constructor(holder: Service) {
		this.holder = holder;
		this.timer = new NanoTimer();
		this.peers = new Array<Peer>();
	}

	public setTickTime(s: number) {
		this.tickTime = s;
		this.timer.clearInterval();
		this.timer.setInterval(this.onTick.bind(this), null, s + 's');
	}

	public stop(): void {
		this.timer.clearInterval();
	}

	public abandon(): void {
		if (this.holder != null)
			this.holder.removeRoom(this);
		else {
			this.stop();
			console.error('ERROR! Room.abandon(): room holder is null');
		}
	}

	public abstract onJoin(peer: Peer): void;
	public abstract onLeave(peer: Peer): void;
	public abstract onMessage(peer: Peer, message: string | ArrayBuffer): void;
	protected abstract onTick(): void;
	public abstract onAbandon(): void;
}