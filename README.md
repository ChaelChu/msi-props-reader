# msi-props-reader

The module allows to read properties from the MSI installer. 
At the moment, the module supports browser environment only.

## Getting Started
Install the module with: `npm install msi-props-reader`

## Examples
To get properties just use this code:
```javascript
import { MsiPropsReader } from 'msi-props-reader';

const reader = new MsiPropsReader();
await reader.initialize(FILE);
const props = reader.getProperties();
console.log(props['ProductCode']);
```
There "FILE" is file object provided by \<input\>

## License
Copyright (c) 2021 ChaelChu  
Licensed under the MIT license.
