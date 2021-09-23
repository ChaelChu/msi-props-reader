export declare class MsiPropsReader {
    private _propertyKeyValueMap;
    private _propertyRequiredStreamIds;
    private _streamBytes;
    private _codePage;
    initialize(file: File): Promise<void>;
    getProperties(): Record<string, string>;
    private getRawProperties;
    private _processProperties;
    private _processStrings;
}
