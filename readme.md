# How to Upload File to AWS S3 Bucket Using Node.js
Add module from npm 
```node.js
const AWS = require('aws-sdk');
var s3 = require('@auth0/s3');
const formidable = require("formidable");
const fs = require('fs');
const fse = require('fs-extra')
```

Call API with file and key value pair
```
router.post('/uploadDataOnServer',uploadingInventoryData)
```

Your File going to be uploaded on Amazon S3
