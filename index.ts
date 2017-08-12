var exif = require('fast-exif');

import * as fs from 'fs-extra';
import * as path from 'path';
import * as program from 'commander';
import * as async from 'async';
import * as recursiveReadDir from 'recursive-readdir';

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

    var mainTasks = {
        read_existing : function(done:any){
            recursiveReadDir(destination, ["*.jpg"], done);
        },
        read_source : ['read_existing', function(results: any, done:any){
            fs.readdir(source, function (err, files) {

                if (err) {
                    console.log(`could not read directory. Error: ${err}`);
                    return;
                }

                // Store the existing files in a set
                var existing = new Set<string>();
                results.read_existing.forEach((f:string)=>existing.add(path.basename(f)));

                // Only keep the non existing files
                files = files.filter(function(file){
                    return !existing.has(path.basename(file));
                });

                // Process files
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

                    // Execute file operations
                    async.auto(operations, undefined, done);

                }, done);
            });            
        }]
    };
    
    async.auto(mainTasks, undefined,
        function (err, results: any[]) {

            if (err) {
                console.log(`Did not complete the operation. Error: ${err}`);
                return;
            }

            console.log(`Successfully completed the operation.`);
            console.log('Press any key to exit');

            //process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', process.exit.bind(process, 0));            
        });
}