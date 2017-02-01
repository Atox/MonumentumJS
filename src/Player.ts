import { ISerializable } from './Serializable'
import { DataViewController } from './DataViewController'
import p2 = require('p2')

let vertices: [number, number][] = [[-0.5, -1], [0.5, -1], [0.5, 1], [-0.5, 1]];

export class Player implements ISerializable {
	body: p2.Body;
	turretRot: number;
	keys: number;
	lastKeys: number;

	constructor() {
		this.keys = this.lastKeys = 0;
		this.turretRot = -Math.PI * 0.5;
		this.body = new p2.Body({ mass: 5 });
		this.body.addShape(new p2.Convex({ vertices: vertices }));
		this.body.damping = 0.99;
		this.body.angularDamping = 0.99;
	}

	serialize(dvc: DataViewController): void {
		dvc.writeFloat(this.body.position[0]);
		dvc.writeFloat(this.body.position[1]);
		dvc.writeFloat(this.body.angle);
		dvc.writeFloat(this.turretRot);
	}

	deserialize(dv: DataViewController): void {
		console.error('Player::deserialize() is not implemented on server');
	}

	simulate(timeDelta: number) {
		let movingForce = 0.0;
		this.body.damping
		if (this.keys & 0b0001) { // Up
			movingForce += 1.0;
		}
		if (this.keys & 0b0010) { // Down
			movingForce -= 0.5;
		}
		if (this.keys & 0b0100) { // Left
			if (this.keys & 0b0010) // Down
				this.body.angularForce -= 5;
			else
				this.body.angularForce += 5;
		}
		if (this.keys & 0b1000) { // Right
			if (this.keys & 0b0010) // Down
				this.body.angularForce += 5;
			else
				this.body.angularForce -= 5;
		}
		if (this.keys & 0b10000) { // Turn turret left
			this.turretRot += 0.05;
		}
		if (this.keys & 0b100000) { // Turn turret right
			this.turretRot -= 0.05;
		}
		movingForce *= 15;
		this.body.applyForce([Math.cos(this.body.angle + Math.PI * 0.5) * movingForce, Math.sin(this.body.angle + Math.PI * 0.5) * movingForce]);
	}
}