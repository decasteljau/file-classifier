var exif = require('fast-exif');

import * as fs from 'fs-extra';
import * as path from 'path';
import * as program from 'commander';
import * as async from 'async';

// Parse arguments
program
    .version('0.1.0')
    .usage(`<operation> <source> <destination>`);

program
    .command('copy <source> <destination>')
    .action(function (source, destination) {
        execute(fs.copy, source, destination);
    });

program
    .command('move <source> <destination>')
    .action(function (source, destination) {
        execute(fs.move, source, destination);
    });
    
program.parse(process.argv);


interface ExifData{
    exif:{
        DateTimeOriginal:Date;
    }
}

function execute(operation:Function, source:string, destination:string){

    fs.readdir(source, function (err, files) {

        if (err) {
            console.log(`could not read directory. Error: ${err}`);
            return;
        }
        async.mapLimit(files, 8, function (file, done) {

            var src = path.join(source, file);

            var operations = {
                get_destination: function (done: any) {
                    exif.read(src).then(function (data: ExifData) {

                        var dateTaken = data.exif.DateTimeOriginal;

                        var year = dateTaken.getFullYear().toString();
                        var month = ("00" + (dateTaken.getMonth() + 1)).slice(-2);
                        var day = ("00" + dateTaken.getDate()).slice(-2);

                        var destinationDir = path.join(
                            destination,
                            `${year}`,
                            `${year}-${month}`,
                            `${year}-${month}-${day}`,
                        );

                        done(null, destinationDir);
                    }).catch(function (err: any) { done(err) });
                },
                prepare_destination: ['get_destination', function (results: any, done: any) {
                    fs.ensureDir(results.get_destination, done);
                }],
                move_file: ['prepare_destination', function (results: any, done: any) {
                    var dst = path.join(results.get_destination, file);
                    console.log(`${operation == fs.copy ? 'copy' : 'move'} ${src} to ${dst}`);

                    operation(src, dst, done);
                }]
            };

            async.auto(operations, undefined, done);

        }, function (err, results:any[]) {

            if (err) {
                console.log(`Did not complete the operation. Error: ${err}`);
                return;
            }

            console.log(`Successfully ${operation == fs.copy ? 'copied' : 'moved'} ${results.length} files`);
        });
    });

}