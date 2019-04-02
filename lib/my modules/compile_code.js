var {spawn} = require('child_process');
var fs = require('fs');
var path = require('path');
var base64Img = require('base64-img');
var tmp = require('tmp');

if (process.env.OPERATING_SYSTEM == 'windows') {
  var poppler = require('pdf-poppler');
} else if (process.env.OPERATING_SYSTEM == 'linux') {
  var PDFImage = require("pdf-image").PDFImage;
}




/* create latex document */
var wstream = exports.wstream = function (fileloc, packages, latexcode, callback) {

  try{
    var wstream = fs.createWriteStream(fileloc);

    wstream.write('\\documentclass[preview]{standalone}\n');
    // DEFAULT PACKAGES USED FOR COMPILING LATEX
    wstream.write('\\usepackage[utf8]{inputenc}\n'+               //defining packages used everytime
                  '\\usepackage{amsmath}\n'+
                  '\\usepackage{amsthm}\n'+
                  '\\usepackage{amssymb}\n'+
                  '\\usepackage[ngerman]{babel}');
    wstream.write(packages);
    wstream.write('\n\n\\begin{document}\n');
    wstream.write(latexcode);
    wstream.write('\n\n\\end{document}');
    wstream.end();
    return callback();
  } catch (Error) {
    return callback('wstream error');
  }
};

/* pdflatex function to compile latex */
var latex_compile = exports.latex_compile = function (fileloc, tmppath, callback) {

  var latex_error, latex_error2;

  /* spawn child process pdflatex */
  var latexcompiler = spawn('pdflatex',                                          // what does each -option do:
            ['-interaction','nonstopmode',// no errors shown, '-file-line-error' error in which line
            '-output-directory='+tmppath,         //in which directory to save the files created
            fileloc]);
              // possible options for pdflatex: '-interaction','nonstopmode','-halt-on-error','-file-line-error',
  

  /* define listeners on different readstreams */
  const errorstream = latexcompiler.stderr;
  errorstream.on('data', (chunk) => {
    console.log('\n\nReceived on errorstream: '+chunk);
  });

  const outstream = latexcompiler.stdout;
  outstream.on('data', (chunk) => {
    chunk = '' + chunk;
    startindex = chunk.indexOf('! Undefined control sequence')
    if ( startindex > -1) {
      endindex = chunk.indexOf('Preview: Tightpage');
      if ( endindex > -1) {
        latex_error = chunk.substring( startindex , endindex );
        latex_error = latex_error.replace(/! Undefined/g,'<br>! Undefined');
        console.log('latex_error: '+latex_error);
      } else {
        latex_error = '<br>Something went wrong while compiling. There probably is a wrong backslash command somewhere in your code.';
      }
    }
  });

  latexcompiler.on('error', function (code, signal) {         // errors of the function spawn()
    latex_error2 = ('ERROR: code: '+ code +', signal: '+ signal);
  });
  
  latexcompiler.on('message', function(code, signal) {          // communication between child and main process
    latex_error2 = ('ERROR: code: '+ code +', signal: '+ signal);
  });

  latexcompiler.on('exit', function (code, signal) {
    if (signal != null) {         // check for error
      latex_error2 = ('ERROR: code: '+ code +', signal: '+ signal);
    } else {                      // everything worked
      
      pdffileloc = tmppath+'/exercise.pdf';

      if (latex_error2) {
        return callback (latex_error2, pdffileloc);         // check for "big" error
      } else {
        return callback (latex_error, pdffileloc);          // return compile error message
      }
    }
  });
};

var pdf2png2base64 = exports.pdf2png2base64 = function (pdffileloc, callback) {

  gonnabeconvertedfile = __dirname + '/../../' + pdffileloc;

  if (process.env.OPERATING_SYSTEM == 'windows') {

      let opts = {
        format: 'png',
        out_dir: path.dirname(gonnabeconvertedfile),
        out_prefix: path.basename(gonnabeconvertedfile, path.extname(gonnabeconvertedfile)),
        page: null
      }

      poppler.convert(gonnabeconvertedfile, opts)
        .then(popplerresult => {     // if converting worked, render page with png source
            pngfile = pdffileloc.replace('.pdf','-1.png');


            /* Convert png to base64 string */
            base64Img.base64(pngfile, function(base64error, base64png) {
              return callback(base64error, base64png);
            });
        })
        .catch(popplererror => {
            console.error(popplererror);
            return callback('\nError in pdf2png2base64 - windows');
        })

  } else if (process.env.OPERATING_SYSTEM == 'linux') {

      var pdfImage = new PDFImage(gonnabeconvertedfile, {
        graphicsMagick: true,
        '-resize': '50%',
        '-quality': '100',
      });
      pdfImage.convertPage(0).then(imagePath => {
        // 0-th page (first page) of the slide.pdf is available as slide-0.png
        pngfile = pdffileloc.replace('.pdf','-0.png');

        /* Convert png to base64 string */
        base64Img.base64(pngfile, function(base64error, base64png) {
          return callback(base64error, base64png);
        });
      }).catch(pdfImageError => {
        console.log(pdfImageError);
        return callback('\nError in pdf2png2base64 - linux')
      });

  }

};


exports.final_compile = function (packages, latexcode, callback) {

  tmp.dir({dir: './cache', unsafeCleanup: true}, function _tempDirCreated(err, tmppath, cleanupCallback) {
    if (err) throw err;
    
    var fileloc = tmppath+'/exercise.tex';


    // create latex file and copy input into it
    wstream(fileloc, packages, latexcode, function(wstreamerr) {
      if (wstreamerr) {
        console.log(wstreamerr); // TODO
        return callback('Error while creating latex file');
      } else {
        // latexfile created
        
        
        latex_compile(fileloc, tmppath, function(latex_error, pdffileloc) {
          if (latex_error) {
            try{cleanupCallback()}    // delete temporary folder
            catch(err) {                    // sometimes the delete process bugs, so we try again after 5 sec
              setTimeout(function() {
                fs.rmdir(tmppath, function(err, res) {});
              }, 5*1000);
            }
            return callback(latex_error);
          } else {
            // file compiled

            // pdf to png transformation via poppler, transform png into base64 after
            pdf2png2base64(pdffileloc, function(lasterror, base64png) {
              
              try{cleanupCallback()}    // delete temporary folder
              catch(err) {                    // sometimes the delete process bugs, so we try again after 5 sec
                setTimeout(function() {
                  fs.rmdir(tmppath, function(err, res) {});
                }, 5*1000);
              }
              
              if (lasterror) {
                return callback(lasterror);
              } else {
                //res.send({res: base64png});
                return callback(null, base64png);
              }

              
            });
          }
        });
      }
    });
  });

};