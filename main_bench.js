"use strict";
exports.__esModule = true;
var main_ts_1 = require("./main.ts");
Deno.bench(function addSmall() {
    (0, main_ts_1.add)(1, 2);
});
Deno.bench(function addBig() {
    (0, main_ts_1.add)(Math.pow(2, 32), Math.pow(2, 32));
});
