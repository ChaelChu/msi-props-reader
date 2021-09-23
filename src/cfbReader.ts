import { decodeMsiDirectoryName } from "./decodeMsiDirectoryName";
import { Logger } from "./logger";
import { readBlob } from "./readBlob";

const NUMBER_OF_DIFAT_IN_HEADER = 109;
const SIGNATURE = [208, 207, 17, 224, 161, 177, 26, 225];
const SECTOR_SIZE_OFFSET = 30;
const MINI_SECTOR_SIZE_OFFSET = 32; 
const NUMBER_OF_DIRECTORY_SECTORS_OFFSET = 40;
const NUMBER_OF_FAT_SECTORS_OFFSET = 44;
const FIRST_DIRECTORY_SECTOR_OFFSET = 48;
const MINI_STREAM_CUTOFF_SIZE_OFFSET = 56;
const FIRST_MINI_FATSECTOR_OFFSET = 60;
const NUMBER_OF_MINI_FATSECTORS_OFFSET = 64;
const FIRST_DIFAT_SECTOR_OFFSET = 68;
const NUMBER_OF_DIFAT_SECTORS_OFFSET = 72;
const DIFAT_TABLE_OFFSET = 76;
const HEADER_SIZE = DIFAT_TABLE_OFFSET + NUMBER_OF_DIFAT_IN_HEADER*4;
const END_OF_CHAIN = -2;
const MAX_SECTORS_COUNT_IN_CHAIN = 999999;


export enum DirectoryObjectType {
    unknown = 0,
    storage = 1,
    stream = 2,
    rootStorage = 5,
}

export interface Directory {
    nameArray: ArrayBuffer;
    name: string;
    objectType: DirectoryObjectType,
    startSector: number,
    streamSize: number,
    isMiniStream: boolean,
}

export interface FileInfo {
    sectorSize: number;
    miniSectorSize: number;
    numberOfDirectorySectors: number;
    numberOfFatSectors: number;
    firstDirectorySector: number;
    miniStreamCutoffSize: number;
    firstMiniFatSector: number;
    numberOfMiniFatSectors: number;
    firstDifatSector: number;
    numberOfDifatSectors: number;
    difatTable: number[];
    miniFatTable: number[];
    fatTable: number[][];
    directoryTable: Directory[];
    countOfMiniSectorsInSector :number;
}

export class CfbReader {
    private _file: File;
    private _fileInfo: FileInfo|undefined;

    public get fileInfo(): FileInfo {
        if(!this._fileInfo){
            Logger.error("Not initialized");
        }
        return this._fileInfo;
    }

    constructor(file: File){
        this._file = file;
    }

    public static async getReader(file: File): Promise<CfbReader>{
        const reader = new CfbReader(file);
        await reader.initialize();
        return reader;
    }

    public async initialize(): Promise<void>{
        if(this._fileInfo){
            return;
        }
        this._fileInfo = await this._readHeaders();
        await this._readDifats();
        await this._readMiniFats();
        await this._readDirectories();
    }

    public async readStreamByName(name: string): Promise<Uint8Array> {
        for (let i = 0; i < this.fileInfo.directoryTable.length; i++) {
            const directory = this.fileInfo.directoryTable[i];
            if(directory.name === name){
                if(directory.isMiniStream){
                    return this._readMiniStream(directory.startSector, directory.streamSize);
                }else{
                    return this._readStream(directory.startSector, directory.streamSize);
                }
            }
        }
        Logger.error("Failed to find directory");
    }

    //-------------------------- Private --------------------------

    private async _readHeaders(): Promise<FileInfo> {
        Logger.trace("Reading header...");
        const header = await this._readPartOfFile(0, HEADER_SIZE);
        const signature = new Uint8Array(header.slice(0, 8));
        SIGNATURE.forEach((byte, i) => byte !== signature[i] && Logger.error("File signature does not match CFB file signature"));
        const data = new DataView(header, 0, header.byteLength);
        const fileInfo: FileInfo = {
            sectorSize: Math.pow(2, data.getUint16(SECTOR_SIZE_OFFSET, true)),
            miniSectorSize: Math.pow(2, data.getUint16(MINI_SECTOR_SIZE_OFFSET, true)),
            numberOfDirectorySectors: data.getInt32(NUMBER_OF_DIRECTORY_SECTORS_OFFSET, true),
            numberOfFatSectors: data.getInt32(NUMBER_OF_FAT_SECTORS_OFFSET, true),
            firstDirectorySector: data.getInt32(FIRST_DIRECTORY_SECTOR_OFFSET, true),
            miniStreamCutoffSize: data.getInt32(MINI_STREAM_CUTOFF_SIZE_OFFSET, true),
            firstMiniFatSector: data.getInt32(FIRST_MINI_FATSECTOR_OFFSET, true),
            numberOfMiniFatSectors: data.getInt32(NUMBER_OF_MINI_FATSECTORS_OFFSET, true),
            firstDifatSector: data.getInt32(FIRST_DIFAT_SECTOR_OFFSET, true),
            numberOfDifatSectors: data.getInt32(NUMBER_OF_DIFAT_SECTORS_OFFSET, true),
            difatTable: [],
            miniFatTable: [],
            fatTable: [],
            directoryTable: [],
            countOfMiniSectorsInSector: 0,
        };
        fileInfo.countOfMiniSectorsInSector  = fileInfo.sectorSize / fileInfo.miniSectorSize;
        Logger.trace("Header properties:\nsectorSize: " + fileInfo.sectorSize + 
        "\nminiSectorSize: " + fileInfo.miniSectorSize + 
        "\nnumberOfDirectorySectors: " + fileInfo.numberOfDirectorySectors + 
        "\nnumberOfFatSectors: " + fileInfo.numberOfFatSectors + 
        "\nfirstDirectorySector: " + fileInfo.firstDirectorySector + 
        "\nminiStreamCutoffSize: " + fileInfo.miniStreamCutoffSize + 
        "\nfirstMiniFatSector: " + fileInfo.firstMiniFatSector + 
        "\nnumberOfMiniFatSectors: " + fileInfo.numberOfMiniFatSectors + 
        "\nfirstDifatSector: " + fileInfo.firstDifatSector + 
        "\nnumberOfDifatSectors: " + fileInfo.numberOfDifatSectors);
        for(let i = 0; i < NUMBER_OF_DIFAT_IN_HEADER; i++){
            const offset = DIFAT_TABLE_OFFSET + i * 4;
            const fatSectorNumber = data.getInt32(offset, true);
            fileInfo.difatTable.push(fatSectorNumber);
            Logger.trace(`DIFAT[${i}] = ${fatSectorNumber}`);
        }
        Logger.trace("Reading header completed");        
        return fileInfo;
    }


    private async _readDifats(): Promise<void> {
        Logger.trace("Reading DIFAT table...");
        let difatSector = this.fileInfo.firstDifatSector
        for (let sectorsCount = 0; sectorsCount < this.fileInfo.numberOfDifatSectors; sectorsCount++) {
            if(difatSector === END_OF_CHAIN){
                Logger.error("DIFAT sector chain corrupted");
            }
            Logger.trace(`Load DIFAT sector ${difatSector}`);
            const sector = await this._readSector(difatSector);
            const data = new DataView(sector, 0, sector.byteLength);
            const countOfEntriesInSector = (this.fileInfo.sectorSize - 4) / 4;
            for(let i = 0; i < countOfEntriesInSector; i++){
                const offset = i * 4;
                const fatSectorNumber = data.getInt32(offset, true);
                this.fileInfo.difatTable.push(fatSectorNumber);
                Logger.trace(`DIFAT[${NUMBER_OF_DIFAT_IN_HEADER + sectorsCount*countOfEntriesInSector + i}] = ${fatSectorNumber}`);
            }
            difatSector = data.getInt32(this.fileInfo.sectorSize - 4, true);            
        }
        if(difatSector !== END_OF_CHAIN){
            Logger.error("DIFAT sector chain corrupted");
        }
        Logger.trace("Reading DIFAT table completed");
    }

    private async _readMiniFats(): Promise<void> {
        Logger.trace("Reading miniFAT table...");
        let miniFatSectorNumber = this.fileInfo.firstMiniFatSector
        for (let sectorsCount = 0; sectorsCount < this.fileInfo.numberOfMiniFatSectors; sectorsCount++) {
            if(miniFatSectorNumber === END_OF_CHAIN){
                Logger.error("MiniFAT sector chain corrupted");
            }
            Logger.trace(`Load miniFAT sector ${miniFatSectorNumber}`);
            const sector = await this._readSector(miniFatSectorNumber);
            const data = new DataView(sector, 0, sector.byteLength);
            const countOfEntriesInSector = this.fileInfo.sectorSize / 4;
            for(let i = 0; i < countOfEntriesInSector; i++){
                const offset = i * 4;
                const nextSectorNumber = data.getInt32(offset, true);
                this.fileInfo.miniFatTable.push(nextSectorNumber);
                Logger.trace(`MINIFAT[${sectorsCount*countOfEntriesInSector + i}] = ${nextSectorNumber}`);
            }
            miniFatSectorNumber = await this._getNextSectorInChain(miniFatSectorNumber);
        }
        if(miniFatSectorNumber !== END_OF_CHAIN){
            Logger.error("MiniFAT sector chain corrupted");
        }
        Logger.trace("Reading miniFAT table completed");

    }

    private async _readDirectories(): Promise<void> {
        Logger.trace("Reading directory table...");
        let directorySectorNumber = this.fileInfo.firstDirectorySector
        for (let sectorCount = 0; sectorCount < MAX_SECTORS_COUNT_IN_CHAIN; sectorCount++) {
            if(directorySectorNumber === END_OF_CHAIN){
                break;
            }
            Logger.trace(`Load directory sector ${directorySectorNumber}`);
            const sector = await this._readSector(directorySectorNumber);
            const data = new DataView(sector, 0, sector.byteLength);
            const countOfEntriesInSector = this.fileInfo.sectorSize / 128;
            for(let i = 0; i < countOfEntriesInSector; i++){
                const offset = i * 128;
                const nameLength = data.getUint16(offset + 64, true);
                const nameArray = sector.slice(offset, offset + nameLength);
                const name = String.fromCharCode.apply(null, Array.from(new Uint16Array(nameArray)));
                let streamSize = 0;
                if(this.fileInfo.sectorSize <= 512){
                    streamSize = data.getInt32(offset + 120, true);
                }else{
                    streamSize = Number(data.getBigInt64(offset + 120, true));
                }
                const directory: Directory = {
                    nameArray: nameArray,
                    name: decodeMsiDirectoryName(name),
                    objectType: data.getInt8(offset + 66),
                    startSector: data.getInt32(offset + 116, true),
                    streamSize: streamSize,
                    isMiniStream: streamSize < this.fileInfo.miniStreamCutoffSize,
                }
                Logger.trace(`DIRECTORY[${sectorCount*countOfEntriesInSector + i}]:
                    \nname=${directory.name},
                    \nobjectType=${directory.objectType},
                    \nstartSector=${directory.startSector},
                    \nstreamSize=${directory.streamSize},
                    \nisMiniStream=${directory.isMiniStream}`);

                if(directory.objectType === DirectoryObjectType.rootStorage 
                    || directory.objectType === DirectoryObjectType.storage 
                    || directory.objectType === DirectoryObjectType.stream){
                    this.fileInfo.directoryTable.push(directory); 
                }
            }
            directorySectorNumber = await this._getNextSectorInChain(directorySectorNumber);

        }
        if(directorySectorNumber !== END_OF_CHAIN){
            Logger.error("Directory sector chain corrupted");
        }
        Logger.trace("Reading directory table completed");
    }

    private async _readStream(startSectorNumber: number, streamSize: number): Promise<Uint8Array> {
        Logger.trace(`Reading stream starting at sector ${startSectorNumber}...`);
        const result = new Uint8Array(streamSize);
        let sectorNumber = startSectorNumber;
        for (let sectorCount = 0; sectorCount < MAX_SECTORS_COUNT_IN_CHAIN; sectorCount++) {
            if(sectorNumber === END_OF_CHAIN){
                break;
            }
            Logger.trace(`Load stream sector ${sectorNumber}`);
            const sector = await this._readSector(sectorNumber);
            const offset = sectorCount * this.fileInfo.sectorSize;
            const dataSize = Math.min(this.fileInfo.sectorSize, streamSize - offset);
            result.set(new Uint8Array(sector.slice(0, dataSize)), offset);
            sectorNumber = await this._getNextSectorInChain(sectorNumber);
        }
        if(sectorNumber !== END_OF_CHAIN){
            Logger.error("Stream sector chain corrupted");
        }
        Logger.trace(`Reading stream starting at sector ${startSectorNumber} completed`);
        return result;
    }

    private _getSectorCountByMiniSectorNumber(miniSectorNumber: number): number {
        return Math.floor(miniSectorNumber / this.fileInfo.countOfMiniSectorsInSector);
    }

    private async _readSectorByMiniSectorNumber(startSectorNumber: number, miniSectorNumber: number): Promise<[ArrayBuffer,number]> {
        let sectorNumber = startSectorNumber;
        const desiredSectorCount = this._getSectorCountByMiniSectorNumber(miniSectorNumber);
        for (let sectorCount = 0; sectorCount < desiredSectorCount; sectorCount++) {
            if(sectorNumber === END_OF_CHAIN){
                Logger.error("Invalid ministream location");
            }
            sectorNumber = await this._getNextSectorInChain(sectorNumber);
        }
        Logger.trace(`Load stream sector ${sectorNumber}`);
        const sector = await this._readSector(sectorNumber);
        return [sector, desiredSectorCount];
    }

    private async _readMiniStream(startMiniSectorNumber: number, streamSize: number): Promise<Uint8Array> {
        Logger.trace(`Reading ministream starting at sector ${startMiniSectorNumber}...`);
        const root = this.fileInfo.directoryTable[0];
        if(!root){
            Logger.error("Directories not loaded");
        }
        const result = new Uint8Array(streamSize);
        const startSectorNumber = root.startSector;
        let miniSectorNumber = startMiniSectorNumber;

        let [sector, sectorCount] = await this._readSectorByMiniSectorNumber(startSectorNumber, miniSectorNumber);
        for (let miniSectorCount = 0; miniSectorCount < MAX_SECTORS_COUNT_IN_CHAIN; miniSectorCount++) {
            if(miniSectorNumber === END_OF_CHAIN){
                break;
            }
            const desiredSectorCount = this._getSectorCountByMiniSectorNumber(miniSectorNumber);
            if(desiredSectorCount != sectorCount){
                [sector, sectorCount] = await this._readSectorByMiniSectorNumber(startSectorNumber, miniSectorNumber);
            }
            const miniSectorNumberFromStartOfSector = miniSectorNumber - sectorCount * this.fileInfo.countOfMiniSectorsInSector;
            const offset = miniSectorNumberFromStartOfSector * this.fileInfo.miniSectorSize;
            const dataSize = Math.min(this.fileInfo.miniSectorSize, streamSize - miniSectorCount * this.fileInfo.miniSectorSize);
            const array = new Uint8Array(sector.slice(offset, offset + dataSize));
            result.set(array, miniSectorCount * this.fileInfo.miniSectorSize);
            miniSectorNumber = this._getNextMiniSectorInChain(miniSectorNumber);
        }
        Logger.trace(`Reading ministream starting at sector ${startMiniSectorNumber} completed`);
        return result;
    }

    private  _getNextMiniSectorInChain(miniSectorNumber: number): number {
        return  this.fileInfo.miniFatTable[miniSectorNumber];
    }

    private async _getNextSectorInChain(sectorNumber: number): Promise<number> {
        const countOfEntriesInSector = this.fileInfo.sectorSize / 4;
        const fatPageNumber = Math.floor(sectorNumber / countOfEntriesInSector);
        const offsetInFatPage = sectorNumber % countOfEntriesInSector;
        if(!this.fileInfo.fatTable[fatPageNumber]){
            const fatSector = await this._readFatSector(fatPageNumber);
            this.fileInfo.fatTable[fatPageNumber] = fatSector;
        }
        return this.fileInfo.fatTable[fatPageNumber][offsetInFatPage];
    }

    private async _readFatSector(fatPageNumber: number): Promise<number[]> {
        const fatSectorNumber = this.fileInfo.difatTable[fatPageNumber];
        const sector = await this._readSector(fatSectorNumber);
        const data = new DataView(sector, 0, sector.byteLength);
        const fatPage: number[] = [];
        const countOfEntriesInSector = this.fileInfo.sectorSize / 4;
        for(let i = 0; i < countOfEntriesInSector; i++){
            const offset = i * 4;
            const nextSectorNumber = data.getInt32(offset, true);
            fatPage.push(nextSectorNumber);
            Logger.trace(`FAT[${fatPageNumber*countOfEntriesInSector + i}] = ${nextSectorNumber}`);
        }
        return fatPage;
    }

    private async _readSector(sectorNumber: number): Promise<ArrayBuffer>{
        const offset = (sectorNumber + 1) * this.fileInfo.sectorSize;
        const sector = await this._readPartOfFile(offset, this.fileInfo.sectorSize);
        return sector;
    }

    private async _readPartOfFile(offset: number, count: number): Promise<ArrayBuffer> {
        Logger.trace(`Reading file from ${offset} with length ${count}`);
        const blob = this._file.slice(offset, offset + count);
        const result = await readBlob(blob);
        return result;
    }
}