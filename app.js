var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const Jimp = require('jimp');
const mv =  require('mv');
const fs = require('fs');
var showdown  = require('showdown');
var converter = new showdown.Converter();
const xoffset = 4368
const yoffset = 5460
var wikitemplate = fs.readFileSync('wiki.html',{ encoding: 'utf8' });
var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.post('/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('temp.jpg', function(err) {
    if (err)
      return res.status(500).send(err);
    Jimp.read("temp.jpg", function(err, lenna) {
      if (err) throw err;
      x = parseInt(req.body.x) + xoffset
      y = parseInt(req.body.y) + yoffset
      Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function(font) {

        mv('public/img/' + x + "-" + y + ".jpg", 'backup/' + new Date().getTime() + '-' + x + "-" + y + ".jpg", function(err) {
          lenna.print(font, 10, 10, req.body.x + "," + req.body.y);
          lenna.print(font, 800, 730, req.body.name);
          lenna.crop(0, 0, 960, 768) // resize
            .write('public/img/' + x + "-" + y + ".jpg"); // save
          res.redirect('/upload.html');
        });

      }).catch(function(err) {
        if (err) throw err;
      });


    });

  });
})
app.get('/wiki/', function(req, res,next) {
  fs.readdir(__dirname+'/wiki/', function(err, files) {
      if (err) return;
      console.log(files);
      var output = ''
      files.forEach(function(f) {
          output += '<a href="/wiki/'+f+'">'+f+'</a><br>'
      });
      res.send(wikitemplate.replace('{{wiki}}',output));
  });

})
app.get('/wiki/:dir', function(req, res,next) {
  fs.readdir(__dirname+'/wiki/'+req.params.dir, function(err, files) {
      if (err) return;
      console.log(files);
      var output = ''
      files.forEach(function(f) {
          output += '<a href="./'+req.params.dir +'/'+f+'">'+f+'</a><br>'
      });
      res.send(wikitemplate.replace('{{wiki}}',output));
  });

})
app.get('/wiki/:dir/:file', function(req, res,next) {
  console.log(req.params);
  var path = __dirname + '/wiki/'+req.params.dir + '/' + req.params.file;
  fs.readFile(path, 'utf8', function(err, data) {
    if(err ) {
      res.send(err);

    }else{
      var html = converter.makeHtml(data.toString())
      var output = wikitemplate.replace('{{wiki}}',html)
      output = output.replace('{{title}}',req.params.file)
        res.send(output);

    }


  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))
module.exports = app;
