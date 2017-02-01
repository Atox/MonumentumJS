export class DataViewController {
    index: number;
    littleEndian: boolean;
    protected dv: DataView;

    public static readonly bigEndian = false;
    public static readonly littleEndian = true;

    constructor(dv: DataView, littleEndian: boolean) {
        this.dv = dv;
        this.littleEndian = littleEndian;
        this.index = 0;
    }

    public load(dv: DataView, littleEndian: boolean): void {
        this.dv = dv;
        this.littleEndian = littleEndian;
        this.index = 0;
    }

    public reset(): void {
        this.index = 0;
    }

    public readInt8(): number {
        this.index++;
        return this.dv.getInt8(this.index - 1);
    }

    public readUInt8(): number {
        this.index++;
        return this.dv.getUint8(this.index - 1);
    }

    public readInt16(): number {
        this.index += 2;
        return this.dv.getInt16(this.index - 2, this.littleEndian);
    }

    public readUInt16(): number {
        this.index += 2;
        return this.dv.getUint16(this.index - 2, this.littleEndian);
    }

    public readInt32(): number {
        this.index += 4;
        return this.dv.getInt32(this.index - 4, this.littleEndian);
    }

    public readUInt32(): number {
        this.index += 4;
        return this.dv.getUint32(this.index - 4, this.littleEndian);
    }

    public readFloat(): number {
        this.index += 4;
        return this.dv.getFloat32(this.index - 4, this.littleEndian);
    }

    public writeInt8(value: number) {
        this.dv.setInt8(this.index, value);
        this.index++;
    }

    public writeUInt8(value: number) {
        this.dv.setUint8(this.index, value);
        this.index++;
    }

    public writeInt16(value: number) {
        this.dv.setInt16(this.index, value, this.littleEndian);
        this.index += 2;
    }

    public writeUInt16(value: number) {
        this.dv.setUint16(this.index, value, this.littleEndian);
        this.index += 2;
    }

    public writeInt32(value: number) {
        this.dv.setInt32(this.index, value, this.littleEndian);
        this.index += 4;
    }

    public writeUInt32(value: number) {
        this.dv.setUint32(this.index, value, this.littleEndian);
        this.index += 4;
    }

    public writeFloat(value: number) {
        this.dv.setFloat32(this.index, value, this.littleEndian);
        this.index += 4;
    }

    public writeString(value: string) {
        for (let i = 0; i < value.length; i++)
            this.writeUInt8(value.charCodeAt(i));
    }
}