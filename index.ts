var exif = require('fast-exif');
var mkdirp = require('mkdirp');

import * as fs from 'fs';
import * as path from 'path';
import * as minimist from 'minimist';
import * as async from 'async';

var argv = minimist(process.argv.slice(2));
console.dir(argv);

const sourceDir = argv.source;
const destinationRootDir = argv.destination;

interface ExifData{
    exif:{
        DateTimeOriginal:Date;
    }
}

fs.readdir(sourceDir, function(err, files) {
     
    async.mapLimit(files, 8, function(file, done){

        var src = path.join(sourceDir,file);
        
        var operations = {
            get_destination: function(done:any){
                exif.read(src).then(function(data:ExifData){

                    var dateTaken = data.exif.DateTimeOriginal;
                    
                    var year = dateTaken.getFullYear().toString();
                    var month = ("00" + dateTaken.getMonth()+1).slice(-2);
                    var day = ("00" + dateTaken.getDate()).slice(-2);
                    
                    var destinationDir = path.join(
                        destinationRootDir, 
                        `${year}`, 
                        `${year}-${month}`,
                        `${year}-${month}-${day}`, 
                    );  

                    done(null, destinationDir);
                }).catch(function(err:any){done(err)});
            },
            prepare_destination: ['get_destination', function(results:any, done:any){
                mkdirp(results.get_destination, done);
            }],
            move_file: ['prepare_destination', function(results:any, done: any){
                var dst = path.join(results.get_destination,file);
                console.log(`copy ${src} to ${dst}`);
                fs.rename(src,dst,done);                
            }]};
        
        async.auto(operations, undefined, done);

    }, function(err){
       
    });
});

