var cheerio = require('cheerio')
var path = require('path')
var fs = require('fs')
var url = require('url')
var sharp = require('sharp')
var through = require('through2')

var gutil = require('gulp-util')
var PluginError = gutil.PluginError

var contentTypes = {
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".bmp": "image/bmp",
  ".webp": "image/webp"
}

var toBase64 = function (extension, data) {
  return 'data:' + contentTypes[extension] + ';base64,' + data.toString('base64');
};


function inliner(html, base) {
  base = base || process.cwd()

  var dom = cheerio.load(String(html))
  inlineImages(dom)

  return new Buffer(dom.html({decodeEntities: false}))

  function inlineImages(dom) {
    var styles = [];
    dom('img').each(function(idx, el) {
      el = dom(el)
      var src = el.attr('src')
      if (src && isLocal(src)) {
        var dir = path.dirname(src)
        var loc = path.join(base, src)
        var extension = path.extname(loc)

        sharp(loc)
          .resize(14) // resize to 16px width and auto height
          .toBuffer() // converts to buffer for Base64 conversion
          .then(data => {
            presource = toBase64(extension, data)
            el.attr('src', presource)
            el.attr('data-CogitipLoad-src', src)
          })
          .catch(err => {
            console.error("FUCK FUCK ")
            console.error(err)
          })
      }
    })
  }

  function isLocal(href) {
    return href && !url.parse(href).hostname;
  }
}

function gulpExport(dir) {
  var stream = through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
      return cb();
    }
    if (file.isBuffer()) {
      file.contents = inliner(file.contents, dir);
      this.push(file);
      return cb();
    }
    return cb(null, file); //no-op
  });

  return stream;
}

module.exports = gulpExport;
