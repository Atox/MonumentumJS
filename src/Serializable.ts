import { DataViewController } from "DataViewController"

export interface ISerializable {
	serialize(dvc: DataViewController): void;
	deserialize(dvc: DataViewController): void;
}