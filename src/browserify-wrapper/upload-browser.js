/**
 * 每位工程师都有保持代码优雅的义务
 * Each engineer has a duty to keep the code elegant
**/

'use strict';

module.exports = function upload(file, AV, saveOptions) {
  //use /files endpoint.
  var self = file;
  var dataFormat;
  self._previousSave = self._source.then(function(data, type) {
    dataFormat = data;
    return self._qiniuToken(type);
  }).then(function(response) {
    self._url = response.url;
    self._bucket = response.bucket;
    self.id = response.objectId;
    //Get the uptoken to upload files to qiniu.
    var uptoken = response.token;

    var data = new FormData();
    data.append("file", dataFormat);
    data.append('name', self._name);
    data.append("key", self._qiniu_key);
    data.append("token", uptoken);

    var promise = new AV.Promise();
    var handled = false;

    var xhr = new XMLHttpRequest();

    if (xhr.upload) {
      xhr.upload.onprogress = saveOptions.onProgress;
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (handled) {
          return;
        }
        handled = true;

        delete self._qiniu_key;
        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            promise.reject(e);
            self.destroy();
          }
          if (response) {
            promise.resolve(self);
          } else {
            promise.reject(response);
          }
        } else {
          promise.reject(xhr);
          self.destroy();
        }
      }
    };
    xhr.open('POST', 'http://upload.qiniu.com', true);
    xhr.send(data);

    return promise;
  });
};
