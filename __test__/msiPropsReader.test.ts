import { MsiPropsReader } from "../src/msiPropsReader";
import { TEST_FILE } from "./testFile";

test("Read props", async () => {
    const reader = new MsiPropsReader();
    await reader.initialize(TEST_FILE);
    const props = reader.getProperties();
    expect(Object.keys(props).length).toBe(40);
    const productCode = props['ProductCode'];
    expect(productCode).toBe('{FA3570CE-F790-4563-9533-A8CFC786260F}');
    const productName = props['ProductName'];
    expect(productName).toBe('ProductName');
    const productVersion = props['ProductVersion'];
    expect(productVersion).toBe('1.0.0');
    const manufacturer = props['Manufacturer'];
    expect(manufacturer).toBe('Manufacturer');
    const arpcontact = props['ARPCONTACT'];
    expect(arpcontact).toBe('Author');
    const arpcomments = props['ARPCOMMENTS'];
    expect(arpcomments).toBe('Description');
    const arpurlinfoabout = props['ARPURLINFOABOUT'];
    expect(arpurlinfoabout).toBe('ManufacturerUrl');
})