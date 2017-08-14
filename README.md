# file-classifier

Classify photos. 

The program extract the date the picture was taken from the exif data, then it copies the photos to the destination using the following convention for the destination:

[destination]/[year]/[year]-[month]/[year]-[month]-[day]

The program only copies/moves pictures that are not on destination.

## Setup 

Install dependencies:

`npm install`

Compile TypeScript:

`tsc -p .`

## Usage

`node index copy <source> <destination>`

or

`node index move <source> <destination>`
