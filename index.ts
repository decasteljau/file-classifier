var exif = require('fast-exif');

import * as fs from 'fs-extra';
import * as path from 'path';
import * as program from 'commander';
import * as recursiveReadDir from 'recursive-readdir';

import exifr from 'exifr'

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

program
    .command('dry <source> <destination>')
    .action(function (source, destination) {
        execute(function move(src: string, dest: string){}, source, destination);
    });    
    
program.parse(process.argv);


interface ExifData{
    exif:{
        DateTimeOriginal:Date;
    }
}

async function execute(operation:Function, source:string, destination:string){

    try{
        await fs.ensureDir(destination);
        var existingFiles = await recursiveReadDir(destination, ["*.jpg"]);

        // Store the existing files in a set
        var existingSet = new Set<string>();
        existingFiles.forEach((f:string)=>existingSet.add(path.basename(f)));

        var sourceFiles = await fs.readdir(source);

        // Only keep the non existing files
        sourceFiles = sourceFiles.filter(function(file){
            return !existingSet.has(path.basename(file));
        });

        for (const file of sourceFiles) {
            try{            
                var src = path.join(source, file);

                // Read exif
                //var exifData:ExifData = await exif.read(src);
                var exif = await exifr.parse(src);

                var fstats = await fs.stat(src);
                var dateTaken = fstats.birthtime;
                if(exif){
                    dateTaken = exif.DateTimeOriginal;
                }

                var year = dateTaken.getFullYear().toString();
                var month = ("00" + (dateTaken.getMonth() + 1)).slice(-2);
                var day = ("00" + dateTaken.getDate()).slice(-2);

                var destinationDir = path.join(
                    destination,
                    `${year}`,
                    `${year}-${month}`,
                    `${year}-${month}-${day}`,
                );
                
                // Prepare destination
                await fs.ensureDir(destinationDir);

                var dst = path.join(destinationDir, file);
                console.log(`${operation == fs.copy ? 'copy' : 'move'} ${file} to ${destinationDir}`);

                // Execute operation
                await operation(src, dst);
            }
            catch(e)
            {
                console.error(`Error while processing file ${file}: ${e}`);
            }
        }

        console.log(`Successfully completed the operation.`);

    }
    catch(e)
    {
        console.error(`Did not complete the operation. Error: ${e}`);
    }
    
    console.log('Press any key to exit');

    //process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));            
}