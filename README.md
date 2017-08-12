# file-classifier

Classify photos. 

The program extract the date the picture was taken from the exif data, then it copies the photos to the destination using the following convention for the destination:

[destination]/[year]/[year]-[month]/[year]-[month]-[day]

## Setup 

`npm install`

## Usage

`node index copy <source> <destination>`

or

`node index move <source> <destination>`
