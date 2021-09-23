import { CfbReader, DirectoryObjectType } from "../src/cfbReader";
import { TEST_FILE } from "./testFile";
import { readBlob } from "../src/readBlob";
import { getSha256 } from "./utils";

test("check file digest", async () => {
    const array = await readBlob(TEST_FILE);
    const digest = await getSha256(array);
    expect(digest).toBe("a4ff7d7dbcee55d581c093057f6b734be42c4ccbb8ca53fee63a4bd20caed927");
});

test("initialization", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    const info = cfb.fileInfo;
    expect(info.sectorSize).toBe(512)
    expect(info.miniSectorSize).toBe(64);
    expect(info.numberOfDirectorySectors).toBe(0);
    expect(info.numberOfFatSectors).toBe(3);
    expect(info.firstDirectorySector).toBe(1);
    expect(info.miniStreamCutoffSize).toBe(4096);
    expect(info.firstMiniFatSector).toBe(56);
    expect(info.numberOfMiniFatSectors).toBe(2);
    expect(info.firstDifatSector).toBe(-2);
    expect(info.numberOfDifatSectors).toBe(0);
    expect(info.directoryTable.length).toBe(35);
    expect(info.directoryTable[0].name).toBe("Root Entry");
    expect(info.directoryTable[0].objectType).toBe(DirectoryObjectType.rootStorage);
    expect(info.directoryTable[5].name).toBe("_StringPool");
    expect(info.directoryTable[5].objectType).toBe(DirectoryObjectType.stream);
    expect(info.directoryTable[6].name).toBe("_StringData");
    expect(info.directoryTable[6].objectType).toBe(DirectoryObjectType.stream);
    expect(info.directoryTable[17].name).toBe("Property");
    expect(info.directoryTable[17].objectType).toBe(DirectoryObjectType.stream);
})

test("Read Property stream", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    const data = await cfb.readStreamByName('Property');
    expect(data.length).toBe(160);
    expect(data[0x00]).toBe(0x77);
    expect(data[0x01]).toBe(0x02);
    expect(data[0x02]).toBe(0x91);
    expect(data[0x03]).toBe(0x02);
    expect(data[0x9c]).toBe(0x68);
    expect(data[0x9d]).toBe(0x04);
    expect(data[0x9e]).toBe(0x5d);
    expect(data[0x9f]).toBe(0x04);
})

test("Read _StringPool stream", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    const data = await cfb.readStreamByName('_StringPool');
    expect(data.length).toBe(4664);
    expect(data[0x00]).toBe(0xe4);
    expect(data[0x01]).toBe(0x04);
    expect(data[0x02]).toBe(0x00);
    expect(data[0x03]).toBe(0x00);
    expect(data[0x1230]).toBe(0x20);
    expect(data[0x1231]).toBe(0x00);
    expect(data[0x1232]).toBe(0x01);
    expect(data[0x1233]).toBe(0x00);
    expect(data[0x1234]).toBe(0x22);
    expect(data[0x1235]).toBe(0x00);
    expect(data[0x1236]).toBe(0x01);
    expect(data[0x1237]).toBe(0x00);
})

test("Read _StringData stream", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    const data = await cfb.readStreamByName('_StringData');
    expect(data.length).toBe(43197);
    expect(data[0x00]).toBe(0x4e);
    expect(data[0x01]).toBe(0x61);
    expect(data[0x02]).toBe(0x6d);
    expect(data[0x03]).toBe(0x65);
    expect(data[0xa8b8]).toBe(0x39);
    expect(data[0xa8b9]).toBe(0x30);
    expect(data[0xa8ba]).toBe(0x38);
    expect(data[0xa8bb]).toBe(0x38);
    expect(data[0xa8bc]).toBe(0x38);
})

test("Read _Columns stream", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    const data = await cfb.readStreamByName('_Columns');
    expect(data.length).toBe(3304);
    expect(data[0x00]).toBe(0x06);
    expect(data[0x01]).toBe(0x00);
    expect(data[0x02]).toBe(0x06);
    expect(data[0x03]).toBe(0x00);
    expect(data[0x0ce4]).toBe(0xff);
    expect(data[0x0ce5]).toBe(0x9f);
    expect(data[0x0ce6]).toBe(0xff);
    expect(data[0x0ce7]).toBe(0x9f);
})

test("Read not exist stream", async () => {
    const cfb = await CfbReader.getReader(TEST_FILE);
    await expect(async () => await cfb.readStreamByName('qwerty')).rejects.toThrow();
})