export declare enum DirectoryObjectType {
    unknown = 0,
    storage = 1,
    stream = 2,
    rootStorage = 5
}
export interface Directory {
    nameArray: ArrayBuffer;
    name: string;
    objectType: DirectoryObjectType;
    startSector: number;
    streamSize: number;
    isMiniStream: boolean;
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
    countOfMiniSectorsInSector: number;
}
export declare class CfbReader {
    private _file;
    private _fileInfo;
    get fileInfo(): FileInfo;
    constructor(file: File);
    static getReader(file: File): Promise<CfbReader>;
    initialize(): Promise<void>;
    readStreamByName(name: string): Promise<Uint8Array>;
    private _readHeaders;
    private _readDifats;
    private _readMiniFats;
    private _readDirectories;
    private _readStream;
    private _getSectorCountByMiniSectorNumber;
    private _readSectorByMiniSectorNumber;
    private _readMiniStream;
    private _getNextMiniSectorInChain;
    private _getNextSectorInChain;
    private _readFatSector;
    private _readSector;
    private _readPartOfFile;
}
