"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CfbReader = exports.DirectoryObjectType = void 0;
var decodeMsiDirectoryName_1 = require("./decodeMsiDirectoryName");
var logger_1 = require("./logger");
var readBlob_1 = require("./readBlob");
var NUMBER_OF_DIFAT_IN_HEADER = 109;
var SIGNATURE = [208, 207, 17, 224, 161, 177, 26, 225];
var SECTOR_SIZE_OFFSET = 30;
var MINI_SECTOR_SIZE_OFFSET = 32;
var NUMBER_OF_DIRECTORY_SECTORS_OFFSET = 40;
var NUMBER_OF_FAT_SECTORS_OFFSET = 44;
var FIRST_DIRECTORY_SECTOR_OFFSET = 48;
var MINI_STREAM_CUTOFF_SIZE_OFFSET = 56;
var FIRST_MINI_FATSECTOR_OFFSET = 60;
var NUMBER_OF_MINI_FATSECTORS_OFFSET = 64;
var FIRST_DIFAT_SECTOR_OFFSET = 68;
var NUMBER_OF_DIFAT_SECTORS_OFFSET = 72;
var DIFAT_TABLE_OFFSET = 76;
var HEADER_SIZE = DIFAT_TABLE_OFFSET + NUMBER_OF_DIFAT_IN_HEADER * 4;
var END_OF_CHAIN = -2;
var MAX_SECTORS_COUNT_IN_CHAIN = 999999;
var DirectoryObjectType;
(function (DirectoryObjectType) {
    DirectoryObjectType[DirectoryObjectType["unknown"] = 0] = "unknown";
    DirectoryObjectType[DirectoryObjectType["storage"] = 1] = "storage";
    DirectoryObjectType[DirectoryObjectType["stream"] = 2] = "stream";
    DirectoryObjectType[DirectoryObjectType["rootStorage"] = 5] = "rootStorage";
})(DirectoryObjectType = exports.DirectoryObjectType || (exports.DirectoryObjectType = {}));
var CfbReader = /** @class */ (function () {
    function CfbReader(file) {
        this._file = file;
    }
    Object.defineProperty(CfbReader.prototype, "fileInfo", {
        get: function () {
            if (!this._fileInfo) {
                logger_1.Logger.error("Not initialized");
            }
            return this._fileInfo;
        },
        enumerable: false,
        configurable: true
    });
    CfbReader.getReader = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var reader;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reader = new CfbReader(file);
                        return [4 /*yield*/, reader.initialize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, reader];
                }
            });
        });
    };
    CfbReader.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this._fileInfo) {
                            return [2 /*return*/];
                        }
                        _a = this;
                        return [4 /*yield*/, this._readHeaders()];
                    case 1:
                        _a._fileInfo = _b.sent();
                        return [4 /*yield*/, this._readDifats()];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this._readMiniFats()];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, this._readDirectories()];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CfbReader.prototype.readStreamByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var i, directory;
            return __generator(this, function (_a) {
                for (i = 0; i < this.fileInfo.directoryTable.length; i++) {
                    directory = this.fileInfo.directoryTable[i];
                    if (directory.name === name) {
                        if (directory.isMiniStream) {
                            return [2 /*return*/, this._readMiniStream(directory.startSector, directory.streamSize)];
                        }
                        else {
                            return [2 /*return*/, this._readStream(directory.startSector, directory.streamSize)];
                        }
                    }
                }
                logger_1.Logger.error("Failed to find directory");
                return [2 /*return*/];
            });
        });
    };
    //-------------------------- Private --------------------------
    CfbReader.prototype._readHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var header, signature, data, fileInfo, i, offset, fatSectorNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading header...");
                        return [4 /*yield*/, this._readPartOfFile(0, HEADER_SIZE)];
                    case 1:
                        header = _a.sent();
                        signature = new Uint8Array(header.slice(0, 8));
                        SIGNATURE.forEach(function (byte, i) { return byte !== signature[i] && logger_1.Logger.error("File signature does not match CFB file signature"); });
                        data = new DataView(header, 0, header.byteLength);
                        fileInfo = {
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
                        fileInfo.countOfMiniSectorsInSector = fileInfo.sectorSize / fileInfo.miniSectorSize;
                        logger_1.Logger.trace("Header properties:\nsectorSize: " + fileInfo.sectorSize +
                            "\nminiSectorSize: " + fileInfo.miniSectorSize +
                            "\nnumberOfDirectorySectors: " + fileInfo.numberOfDirectorySectors +
                            "\nnumberOfFatSectors: " + fileInfo.numberOfFatSectors +
                            "\nfirstDirectorySector: " + fileInfo.firstDirectorySector +
                            "\nminiStreamCutoffSize: " + fileInfo.miniStreamCutoffSize +
                            "\nfirstMiniFatSector: " + fileInfo.firstMiniFatSector +
                            "\nnumberOfMiniFatSectors: " + fileInfo.numberOfMiniFatSectors +
                            "\nfirstDifatSector: " + fileInfo.firstDifatSector +
                            "\nnumberOfDifatSectors: " + fileInfo.numberOfDifatSectors);
                        for (i = 0; i < NUMBER_OF_DIFAT_IN_HEADER; i++) {
                            offset = DIFAT_TABLE_OFFSET + i * 4;
                            fatSectorNumber = data.getInt32(offset, true);
                            fileInfo.difatTable.push(fatSectorNumber);
                            logger_1.Logger.trace("DIFAT[" + i + "] = " + fatSectorNumber);
                        }
                        logger_1.Logger.trace("Reading header completed");
                        return [2 /*return*/, fileInfo];
                }
            });
        });
    };
    CfbReader.prototype._readDifats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var difatSector, sectorsCount, sector, data, countOfEntriesInSector, i, offset, fatSectorNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading DIFAT table...");
                        difatSector = this.fileInfo.firstDifatSector;
                        sectorsCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(sectorsCount < this.fileInfo.numberOfDifatSectors)) return [3 /*break*/, 4];
                        if (difatSector === END_OF_CHAIN) {
                            logger_1.Logger.error("DIFAT sector chain corrupted");
                        }
                        logger_1.Logger.trace("Load DIFAT sector " + difatSector);
                        return [4 /*yield*/, this._readSector(difatSector)];
                    case 2:
                        sector = _a.sent();
                        data = new DataView(sector, 0, sector.byteLength);
                        countOfEntriesInSector = (this.fileInfo.sectorSize - 4) / 4;
                        for (i = 0; i < countOfEntriesInSector; i++) {
                            offset = i * 4;
                            fatSectorNumber = data.getInt32(offset, true);
                            this.fileInfo.difatTable.push(fatSectorNumber);
                            logger_1.Logger.trace("DIFAT[" + (NUMBER_OF_DIFAT_IN_HEADER + sectorsCount * countOfEntriesInSector + i) + "] = " + fatSectorNumber);
                        }
                        difatSector = data.getInt32(this.fileInfo.sectorSize - 4, true);
                        _a.label = 3;
                    case 3:
                        sectorsCount++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (difatSector !== END_OF_CHAIN) {
                            logger_1.Logger.error("DIFAT sector chain corrupted");
                        }
                        logger_1.Logger.trace("Reading DIFAT table completed");
                        return [2 /*return*/];
                }
            });
        });
    };
    CfbReader.prototype._readMiniFats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var miniFatSectorNumber, sectorsCount, sector, data, countOfEntriesInSector, i, offset, nextSectorNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading miniFAT table...");
                        miniFatSectorNumber = this.fileInfo.firstMiniFatSector;
                        sectorsCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(sectorsCount < this.fileInfo.numberOfMiniFatSectors)) return [3 /*break*/, 5];
                        if (miniFatSectorNumber === END_OF_CHAIN) {
                            logger_1.Logger.error("MiniFAT sector chain corrupted");
                        }
                        logger_1.Logger.trace("Load miniFAT sector " + miniFatSectorNumber);
                        return [4 /*yield*/, this._readSector(miniFatSectorNumber)];
                    case 2:
                        sector = _a.sent();
                        data = new DataView(sector, 0, sector.byteLength);
                        countOfEntriesInSector = this.fileInfo.sectorSize / 4;
                        for (i = 0; i < countOfEntriesInSector; i++) {
                            offset = i * 4;
                            nextSectorNumber = data.getInt32(offset, true);
                            this.fileInfo.miniFatTable.push(nextSectorNumber);
                            logger_1.Logger.trace("MINIFAT[" + (sectorsCount * countOfEntriesInSector + i) + "] = " + nextSectorNumber);
                        }
                        return [4 /*yield*/, this._getNextSectorInChain(miniFatSectorNumber)];
                    case 3:
                        miniFatSectorNumber = _a.sent();
                        _a.label = 4;
                    case 4:
                        sectorsCount++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (miniFatSectorNumber !== END_OF_CHAIN) {
                            logger_1.Logger.error("MiniFAT sector chain corrupted");
                        }
                        logger_1.Logger.trace("Reading miniFAT table completed");
                        return [2 /*return*/];
                }
            });
        });
    };
    CfbReader.prototype._readDirectories = function () {
        return __awaiter(this, void 0, void 0, function () {
            var directorySectorNumber, sectorCount, sector, data, countOfEntriesInSector, i, offset, nameLength, nameArray, name_1, streamSize, directory;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading directory table...");
                        directorySectorNumber = this.fileInfo.firstDirectorySector;
                        sectorCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(sectorCount < MAX_SECTORS_COUNT_IN_CHAIN)) return [3 /*break*/, 5];
                        if (directorySectorNumber === END_OF_CHAIN) {
                            return [3 /*break*/, 5];
                        }
                        logger_1.Logger.trace("Load directory sector " + directorySectorNumber);
                        return [4 /*yield*/, this._readSector(directorySectorNumber)];
                    case 2:
                        sector = _a.sent();
                        data = new DataView(sector, 0, sector.byteLength);
                        countOfEntriesInSector = this.fileInfo.sectorSize / 128;
                        for (i = 0; i < countOfEntriesInSector; i++) {
                            offset = i * 128;
                            nameLength = data.getUint16(offset + 64, true);
                            nameArray = sector.slice(offset, offset + nameLength);
                            name_1 = String.fromCharCode.apply(null, Array.from(new Uint16Array(nameArray)));
                            streamSize = 0;
                            if (this.fileInfo.sectorSize <= 512) {
                                streamSize = data.getInt32(offset + 120, true);
                            }
                            else {
                                streamSize = Number(data.getBigInt64(offset + 120, true));
                            }
                            directory = {
                                nameArray: nameArray,
                                name: (0, decodeMsiDirectoryName_1.decodeMsiDirectoryName)(name_1),
                                objectType: data.getInt8(offset + 66),
                                startSector: data.getInt32(offset + 116, true),
                                streamSize: streamSize,
                                isMiniStream: streamSize < this.fileInfo.miniStreamCutoffSize,
                            };
                            logger_1.Logger.trace("DIRECTORY[" + (sectorCount * countOfEntriesInSector + i) + "]:\n                    \nname=" + directory.name + ",\n                    \nobjectType=" + directory.objectType + ",\n                    \nstartSector=" + directory.startSector + ",\n                    \nstreamSize=" + directory.streamSize + ",\n                    \nisMiniStream=" + directory.isMiniStream);
                            if (directory.objectType === DirectoryObjectType.rootStorage
                                || directory.objectType === DirectoryObjectType.storage
                                || directory.objectType === DirectoryObjectType.stream) {
                                this.fileInfo.directoryTable.push(directory);
                            }
                        }
                        return [4 /*yield*/, this._getNextSectorInChain(directorySectorNumber)];
                    case 3:
                        directorySectorNumber = _a.sent();
                        _a.label = 4;
                    case 4:
                        sectorCount++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (directorySectorNumber !== END_OF_CHAIN) {
                            logger_1.Logger.error("Directory sector chain corrupted");
                        }
                        logger_1.Logger.trace("Reading directory table completed");
                        return [2 /*return*/];
                }
            });
        });
    };
    CfbReader.prototype._readStream = function (startSectorNumber, streamSize) {
        return __awaiter(this, void 0, void 0, function () {
            var result, sectorNumber, sectorCount, sector, offset, dataSize;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading stream starting at sector " + startSectorNumber + "...");
                        result = new Uint8Array(streamSize);
                        sectorNumber = startSectorNumber;
                        sectorCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(sectorCount < MAX_SECTORS_COUNT_IN_CHAIN)) return [3 /*break*/, 5];
                        if (sectorNumber === END_OF_CHAIN) {
                            return [3 /*break*/, 5];
                        }
                        logger_1.Logger.trace("Load stream sector " + sectorNumber);
                        return [4 /*yield*/, this._readSector(sectorNumber)];
                    case 2:
                        sector = _a.sent();
                        offset = sectorCount * this.fileInfo.sectorSize;
                        dataSize = Math.min(this.fileInfo.sectorSize, streamSize - offset);
                        result.set(new Uint8Array(sector.slice(0, dataSize)), offset);
                        return [4 /*yield*/, this._getNextSectorInChain(sectorNumber)];
                    case 3:
                        sectorNumber = _a.sent();
                        _a.label = 4;
                    case 4:
                        sectorCount++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (sectorNumber !== END_OF_CHAIN) {
                            logger_1.Logger.error("Stream sector chain corrupted");
                        }
                        logger_1.Logger.trace("Reading stream starting at sector " + startSectorNumber + " completed");
                        return [2 /*return*/, result];
                }
            });
        });
    };
    CfbReader.prototype._getSectorCountByMiniSectorNumber = function (miniSectorNumber) {
        return Math.floor(miniSectorNumber / this.fileInfo.countOfMiniSectorsInSector);
    };
    CfbReader.prototype._readSectorByMiniSectorNumber = function (startSectorNumber, miniSectorNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var sectorNumber, desiredSectorCount, sectorCount, sector;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sectorNumber = startSectorNumber;
                        desiredSectorCount = this._getSectorCountByMiniSectorNumber(miniSectorNumber);
                        sectorCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(sectorCount < desiredSectorCount)) return [3 /*break*/, 4];
                        if (sectorNumber === END_OF_CHAIN) {
                            logger_1.Logger.error("Invalid ministream location");
                        }
                        return [4 /*yield*/, this._getNextSectorInChain(sectorNumber)];
                    case 2:
                        sectorNumber = _a.sent();
                        _a.label = 3;
                    case 3:
                        sectorCount++;
                        return [3 /*break*/, 1];
                    case 4:
                        logger_1.Logger.trace("Load stream sector " + sectorNumber);
                        return [4 /*yield*/, this._readSector(sectorNumber)];
                    case 5:
                        sector = _a.sent();
                        return [2 /*return*/, [sector, desiredSectorCount]];
                }
            });
        });
    };
    CfbReader.prototype._readMiniStream = function (startMiniSectorNumber, streamSize) {
        return __awaiter(this, void 0, void 0, function () {
            var root, result, startSectorNumber, miniSectorNumber, _a, sector, sectorCount, miniSectorCount, desiredSectorCount, miniSectorNumberFromStartOfSector, offset, dataSize, array;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_1.Logger.trace("Reading ministream starting at sector " + startMiniSectorNumber + "...");
                        root = this.fileInfo.directoryTable[0];
                        if (!root) {
                            logger_1.Logger.error("Directories not loaded");
                        }
                        result = new Uint8Array(streamSize);
                        startSectorNumber = root.startSector;
                        miniSectorNumber = startMiniSectorNumber;
                        return [4 /*yield*/, this._readSectorByMiniSectorNumber(startSectorNumber, miniSectorNumber)];
                    case 1:
                        _a = _c.sent(), sector = _a[0], sectorCount = _a[1];
                        miniSectorCount = 0;
                        _c.label = 2;
                    case 2:
                        if (!(miniSectorCount < MAX_SECTORS_COUNT_IN_CHAIN)) return [3 /*break*/, 6];
                        if (miniSectorNumber === END_OF_CHAIN) {
                            return [3 /*break*/, 6];
                        }
                        desiredSectorCount = this._getSectorCountByMiniSectorNumber(miniSectorNumber);
                        if (!(desiredSectorCount != sectorCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._readSectorByMiniSectorNumber(startSectorNumber, miniSectorNumber)];
                    case 3:
                        _b = _c.sent(), sector = _b[0], sectorCount = _b[1];
                        _c.label = 4;
                    case 4:
                        miniSectorNumberFromStartOfSector = miniSectorNumber - sectorCount * this.fileInfo.countOfMiniSectorsInSector;
                        offset = miniSectorNumberFromStartOfSector * this.fileInfo.miniSectorSize;
                        dataSize = Math.min(this.fileInfo.miniSectorSize, streamSize - miniSectorCount * this.fileInfo.miniSectorSize);
                        array = new Uint8Array(sector.slice(offset, offset + dataSize));
                        result.set(array, miniSectorCount * this.fileInfo.miniSectorSize);
                        miniSectorNumber = this._getNextMiniSectorInChain(miniSectorNumber);
                        _c.label = 5;
                    case 5:
                        miniSectorCount++;
                        return [3 /*break*/, 2];
                    case 6:
                        logger_1.Logger.trace("Reading ministream starting at sector " + startMiniSectorNumber + " completed");
                        return [2 /*return*/, result];
                }
            });
        });
    };
    CfbReader.prototype._getNextMiniSectorInChain = function (miniSectorNumber) {
        return this.fileInfo.miniFatTable[miniSectorNumber];
    };
    CfbReader.prototype._getNextSectorInChain = function (sectorNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var countOfEntriesInSector, fatPageNumber, offsetInFatPage, fatSector;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        countOfEntriesInSector = this.fileInfo.sectorSize / 4;
                        fatPageNumber = Math.floor(sectorNumber / countOfEntriesInSector);
                        offsetInFatPage = sectorNumber % countOfEntriesInSector;
                        if (!!this.fileInfo.fatTable[fatPageNumber]) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._readFatSector(fatPageNumber)];
                    case 1:
                        fatSector = _a.sent();
                        this.fileInfo.fatTable[fatPageNumber] = fatSector;
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.fileInfo.fatTable[fatPageNumber][offsetInFatPage]];
                }
            });
        });
    };
    CfbReader.prototype._readFatSector = function (fatPageNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var fatSectorNumber, sector, data, fatPage, countOfEntriesInSector, i, offset, nextSectorNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fatSectorNumber = this.fileInfo.difatTable[fatPageNumber];
                        return [4 /*yield*/, this._readSector(fatSectorNumber)];
                    case 1:
                        sector = _a.sent();
                        data = new DataView(sector, 0, sector.byteLength);
                        fatPage = [];
                        countOfEntriesInSector = this.fileInfo.sectorSize / 4;
                        for (i = 0; i < countOfEntriesInSector; i++) {
                            offset = i * 4;
                            nextSectorNumber = data.getInt32(offset, true);
                            fatPage.push(nextSectorNumber);
                            logger_1.Logger.trace("FAT[" + (fatPageNumber * countOfEntriesInSector + i) + "] = " + nextSectorNumber);
                        }
                        return [2 /*return*/, fatPage];
                }
            });
        });
    };
    CfbReader.prototype._readSector = function (sectorNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var offset, sector;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        offset = (sectorNumber + 1) * this.fileInfo.sectorSize;
                        return [4 /*yield*/, this._readPartOfFile(offset, this.fileInfo.sectorSize)];
                    case 1:
                        sector = _a.sent();
                        return [2 /*return*/, sector];
                }
            });
        });
    };
    CfbReader.prototype._readPartOfFile = function (offset, count) {
        return __awaiter(this, void 0, void 0, function () {
            var blob, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.Logger.trace("Reading file from " + offset + " with length " + count);
                        blob = this._file.slice(offset, offset + count);
                        return [4 /*yield*/, (0, readBlob_1.readBlob)(blob)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return CfbReader;
}());
exports.CfbReader = CfbReader;
