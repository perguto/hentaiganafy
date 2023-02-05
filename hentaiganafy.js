const fs = require('fs');
// let response = await fetch("./rois.json")
// console.log(response)
let b = fs.readFileSync('./rois.json');


let j = JSON.parse(b)

console.log(j)

