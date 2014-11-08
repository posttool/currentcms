var fs = require('fs');
var tmp = require('tmp');
var uuid = require('node-uuid');

/* requires job.data.container and job.data.filename
 * process get 3 args: infile (downloaded to local file system), outfile (written by process), and 'next'
 * 'next' continues to upload the written file to storage and deletes in & out from local file system
 * then calls job done
 * */
exports.process_resource = function (client, job, done, out_ext, process) {
  var ext = exports.get_ext(job.data.filename);
  tmp.tmpName({ postfix: ext }, function (err, path) {
    if (err) return done(err);
    var downloadStream = fs.createWriteStream(path);
    client.download({container: job.data.container, remote: job.data.filename},
      function (err, info) {
        if (err) return done(err);
        job.log('download complete', info.size);
        tmp.tmpName({ postfix: out_ext }, function (err, path2) {
          if (err) return done(err);
          process(path, path2, function () {
            job.log('process complete', path2);
            var remote = exports.get_filename(job.data.filename, out_ext);
            fs.createReadStream(path2).pipe(client.upload({container: job.data.container, remote: remote},
              function () {
                var size = fs.statSync(path2).size;
                job.log('upload complete', path2, size);
                fs.unlink(path, function (err) {
                  if (err) return done(err);
                  fs.unlink(path2, function (err) {
                    if (err) return done(err);
                    job.log('deleted ' + path + ' ' + path2);
                    job.set('path', remote, function () {
                      job.set('size', size, function () {
                        done();
                      });
                    });
                  });
                });
              }));
          });
        });
      }).pipe(downloadStream);
  });
};




exports.get_filename = function(filename, out_ext)
{
  var didx = filename.lastIndexOf('.');
  if (didx == -1)
    return filename + uuid.v1();
  else
    return filename.substring(0, didx) + uuid.v1() + (out_ext ? out_ext : filename.substring(didx));
}


exports.get_ext = function(filename)
{
  var didx = filename.lastIndexOf('.');
  if (didx == -1)
    return "";
  else
    return filename.substring(didx);
}