'use strict';

const aws = require('aws-sdk');
const s3 = new aws.S3();
const querystring = require('querystring');

let sharp;
if (process.env.NODE_ENV === 'local') {
  sharp = require('sharp');
} else {
  sharp = require('../lib/sharp');
}

const BUCKET = 'my-sample-bucket'; // S3 のバケット名
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;

exports.handler = (event, context, callback) => {
  const { request, response } = event.Records[0].cf;

  const options = {
    filePath: "",
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    webp: false,
  };

  options.filePath = decodeURIComponent(request.uri);

  const ext = options.filePath.split('.')[1];
  if (ext !== 'jpg' && ext !== 'jpeg') {
    responseOriginal();
    return;
  }

  if (response.status === '304') {
    responseOriginal();
    return;
  }

  if (response.status !== '200') {
    responseNotFound();
    return;
  }

  // クエリ文字列のパース
  const query = querystring.parse(request.querystring);
  if (query.w) {
    const width = parseInt(query.w);
    if (!isNumber(width)) {
      responseError('Width must be numeric.');
      return;
    }
    if (width <= 0 || MAX_WIDTH < width) {
      responseError(`Width must be greater than 0 and less than or equal to ${MAX_WIDTH}.`);
      return;
    }
    options.width = width;
  }
  if (query.h) {
    const height = parseInt(query.h);
    if (!isNumber(height)) {
      responseError('Height must be numeric.');
      return;
    }
    if (height <= 0 || MAX_HEIGHT < height) {
      responseError(`Height must be greater than 0 and less than or equal to ${MAX_HEIGHT}.`);
      return;
    }
    options.height = height;
  }
  if (query.p === 't' || query.p ==='true') {
    options.webp = true;
  }

  let sharpBody;
  s3.getObject(
    {
      Bucket: BUCKET,
      Key: options.filePath.substr(1), // 先頭の'/'を削除
    })
    .promise()
    .then(data => {
      sharpBody = sharp(data.Body); // 変数へ一時保存
      return sharpBody.metadata();
    })
    .then(metadata => {
      // 念のため拡張子だけでなく画像フォーマットをチェック
      if (metadata.format !== 'jpeg') {
        return Promise.reject(new FormatError('Original file format must be jpeg.'));
      }
      // 引き伸ばしはしない
      options.width = metadata.width < options.width ? metadata.width : options.width;
      options.height = metadata.height < options.height ? metadata.height : options.height;
      sharpBody.resize(options.width, options.height).max();
      if (options.webp) {
        sharpBody.webp();
      }
      return sharpBody
        .rotate()
        .toBuffer();
    })
    .then(buffer => {
      response.status = '200';
      if (options.webp) {
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/webp' }];
      } else {
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/jpeg' }];
      }
      response.body = buffer.toString('base64');
      response.bodyEncoding = 'base64';
      callback(null, response);
    })
    .catch(error => {
      if (error instanceof FormatError) {
        responseError(error.message);
        return;
      }
      responseNotFound();
    });

  function responseOriginal() {
    callback(null, response);
  }

  function responseNotFound() {
    response.status = '404';
    response.headers['content-type'] = [{ key: 'Content-Type', value: 'text/plain' }];
    response.body = `${request.uri} is not found.`;
    callback(null, response);
  }

  function responseError(message) {
    response.status = '403';
    response.headers['content-type'] = [{ key: 'Content-Type', value: 'text/plain' }];
    response.body = message;
    callback(null, response);
  }
};

function isNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

class FormatError extends Error {}
