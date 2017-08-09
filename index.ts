var exif = require('fast-exif');

import * as fs from 'fs';
import * as path from 'path';
import * as minimist from 'minimist';

var argv = minimist(process.argv.slice(2));
console.dir(argv);

const sourceDir = 'D:\\temp\\images';
const targetDir = 'D:\\temp\\images_out';

fs.readdir(sourceDir, function(err, files) {
     
    files.forEach(file => {
        let full = path.join(sourceDir,file);
        exif.read(full).then(function(data:any){
            //console.log(data);
            var dateTaken = new Date(data.exif.DateTimeOriginal);
            
            var destination = path.join(
                targetDir, 
                dateTaken.getFullYear().toString(), 
                ("00" + dateTaken.getMonth()).slice(-2),
                ("00" + dateTaken.getDate()).slice(-2),
                file
            );
            
            console.log(destination);

            // todo: make dir

            fs.rename(full,destination,err=>console.log);
        });     
    });
});

