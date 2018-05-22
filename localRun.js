const index = require('./src/index');

// see: https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html
const event = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": ""
        },
        "request": {
          "clientIp": "",
          "headers": {
            "accept-encoding": [
              {
                "key": "Accept-Encoding",
                "value": "gzip"
              }
            ],
            "host": [
              {
                "key": "Host",
                "value": "my-sample-bucket.s3.amazonaws.com"
              }
            ],
            "user-agent": [
              {
                "key": "User-Agent",
                "value": "Amazon CloudFront"
              }
            ]
          },
          "method": "GET",
          "origin": {
            "s3": {
              "authMethod": "none",
              "customHeaders": {},
              "domainName": "my-sample-bucket.s3.amazonaws.com",
              "path": ""
            }
          },
          "querystring": "w=1000&p=t",
          "uri": "/sample.jpg"
        },
        "response": {
          "headers": {
            "accept-ranges": [
              {
                "key": "Accept-Ranges",
                "value": "bytes"
              }
            ],
            "content-length": [
              {
                "key": "Content-Length",
                "value": "123456"
              }
            ],
            "content-type": [
              {
                "key": "Content-Type",
                "value": "image/jpeg"
              }
            ],
            "date": [
              {
                "key": "Date",
                "value": "Sat, 21 Apr 2018 16:04:20 GMT"
              }
            ],
            "etag": [
              {
                "key": "ETag",
                "value": "\"3830c65ea33fa06e3840202e5d9b03a6\""
              }
            ],
            "last-modified": [
              {
                "key": "Last-Modified",
                "value": "Fri, 20 Apr 2018 13:15:51 GMT"
              }
            ],
            "server": [
              {
                "key": "Server",
                "value": "AmazonS3"
              }
            ]
          },
          "status": "200",
          "statusDescription": "OK"
        }
      }
    }
  ]
};

const context = {};

const callback = function (error, response) {
  if (error) {
    console.log(error);
  } else {
    console.log(response);
  }
};

index.handler(event, context, callback);
