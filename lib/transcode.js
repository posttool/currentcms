var kue = require('kue');
var mongoose = require('mongoose');
var pkgcloud = require('pkgcloud');
var ffmpeg = require('fluent-ffmpeg');
var gm = require('gm');

var cms_jobs = require('./jobs')
var logger = require('./utils').get_logger('transcode');

exports = module.exports = function (config) {

  // requires pkgcloud and kue configs
  var client = require('pkgcloud').storage.createClient(config.pkgcloudConfig);
  logger.info('kue established storage ['+config.pkgcloudConfig.provider+'/'+config.pkgcloudConfig.username+']');

  var jobs = kue.createQueue(config.kueConfig);
  logger.info('kue processor ready');


  /* jobs */

  mp3 = function (job, done, options) {
    cms_jobs.process_resource(client, job, done, '.mp3', function (infile, outfile, next) {
      logger.info('mp3' + ' ' + infile + ' ' + outfile)
      new ffmpeg({ source: infile })
        .withAudioBitrate(options.bitrate)
        .withAudioCodec('libmp3lame')
        .withAudioChannels(2)
        .on('end', function () {
          next();
        })
        .on('error', function (err) {
          console.log('encode error: ' + err.message);
          job.log('encode error: ' + err.message);
          next(err);
        })
        .on('progress', function (progress) {
          job.progress(progress.percent, 100);
        })
        .saveToFile(outfile);
    });
  }


  jobs.process('audio mp3', function (job, done) {
    mp3(job, done, {bitrate: '196k'});
  });


  resize = function (job, done, options) {
    cms_jobs.process_resource(client, job, done, '.jpg', function (path, path2, next) {
      logger.info(job.type + ' ' + path + ' ' + path2);
      var g = gm(path);
      g.resize(options.width, options.height, options.resizeOptions);
      g.write(path2, function (err) {
        next();
      });
    });
  };

  jobs.process('image thumb', function (job, done) {
    resize(job, done, {width: 300, height: 200});
  });

  jobs.process('image medium', function (job, done) {
    resize(job, done, {width: 500, height: 500});
  });

  jobs.process('image large', function (job, done) {
    resize(job, done, {width: 1800, height: 1200});
  });


  kue.app.set('title', 'Transcoder');

  process.once('SIGTERM', function (sig) {
    queue.shutdown(function (err) {
      console.log('Kue is shut down.', err || '');
      process.exit(0);
    }, 5000);
  });

  return kue;

};

// ffmpeg info
// The 'progress' event is emitted every time FFmpeg
// reports progress information. 'progress' contains
// the following information:
// - 'frames': the total processed frame count
// - 'currentFps': the framerate at which FFmpeg is currently processing
// - 'currentKbps': the throughput at which FFmpeg is currently processing
// - 'targetSize': the current size of the target file in kilobytes
// - 'timemark': the timestamp of the current frame in seconds
// - 'percent': an estimation of the progress
