/*
 * msi-props-reader
 * https://github.com/ChaelChu/msi-props-reader
 *
 * Copyright (c) 2021 ChaelChu
 * Licensed under the MIT license.
 */

import { CfbReader } from "./cfbReader";
import { textDecode } from "./textDecode";
import { Logger } from "./logger";


export class MsiPropsReader {

    private _propertyKeyValueMap: Record<number,number> = {};
    private _propertyRequiredStreamIds: number[] = [];
    private _streamBytes: Record<number, ArrayBuffer> = {};
    private _codePage: number|undefined;

    public async initialize(file: File): Promise<void>{
        const cfbReader = await CfbReader.getReader(file);
        const property = await cfbReader.readStreamByName('Property');
        await this._processProperties(property);
        const stringPool = await cfbReader.readStreamByName('_StringPool');
        const stringData = await cfbReader.readStreamByName('_StringData');
        await this._processStrings(stringPool, stringData);
    }

    public getProperties(): Record<string,string> {
        const codePage = this._codePage;
        if(codePage === undefined) {
            Logger.error('Not initialized');
        }
        const rawProps = this.getRawProperties();        
        const result = rawProps.reduce((obj, p) => {
                obj[textDecode(p.key, codePage)] = textDecode(p.value, codePage);
                return obj;
            }, {} as Record<string,string>);
        return result;
    }

    //---------------------------- Private --------------------------

    private getRawProperties(): {key: ArrayBuffer|undefined, value: ArrayBuffer|undefined}[] {
        const result = Object.keys(this._propertyKeyValueMap).map(key => Number(key)).map(key => ({
            key: this._streamBytes[key],
            value: this._streamBytes[this._propertyKeyValueMap[key]],
        }));
        return result;
    }

    private _processProperties(array: Uint8Array): void {
        const view = new DataView(array.buffer);
        this._propertyKeyValueMap = {};
        this._propertyRequiredStreamIds = [];
        if(view.byteLength % 4 != 0){
            Logger.error('Property table corrupted');
        }
        const countOfKeys = view.byteLength / 4;
        for (let i = 0; i < countOfKeys; i++){
            const offset = i * 2;
            const keyStreamId = view.getUint16(offset, true);
            const valueStreamId = view.getUint16(countOfKeys*2 + offset, true);
            this._propertyKeyValueMap[keyStreamId] = valueStreamId;
            this._propertyRequiredStreamIds.push(keyStreamId);
            this._propertyRequiredStreamIds.push(valueStreamId);
        }
    }

    private _processStrings(stringPoolArray: Uint8Array, stringDataArray: Uint8Array) {
        this._streamBytes = [];

        const stringPool = new DataView(stringPoolArray.buffer);
        const stringData = new DataView(stringDataArray.buffer);
        this._codePage = stringPool.getUint16(0, true);
        if(stringPool.byteLength % 4 !== 0){
            Logger.error('Invalid string pool table');
        }
        const itemCount = stringPool.byteLength / 4;
        let streamId = 1;
        let higherDwordOfSize = 0;
        let stringDataOffset = 0;
        for (let i = 1; i < itemCount; i++) {
            const stringPoolOffset = i * 4;
            let size = stringPool.getUint16(stringPoolOffset, true);
            const ref = stringPool.getUint16(stringPoolOffset+2, true);
            if(size === 0 && ref===0){
                // empty entry
                streamId++;
                continue;
            }
            if(size === 0 && ref !== 0){
                // save higher four bytes of stream size
                higherDwordOfSize = ref << 16;
                continue;
            }
            size += higherDwordOfSize;
            higherDwordOfSize = 0;
            const streamRequired = this._propertyRequiredStreamIds.some(s => s===streamId);
            if(streamRequired){
                const data = stringData.buffer.slice(stringDataOffset, stringDataOffset + size);
                this._streamBytes[streamId] = data;
            }
            stringDataOffset += size;
            streamId++;
        }
    }
}

