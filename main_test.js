"use strict";
exports.__esModule = true;
var asserts_ts_1 = require("https://deno.land/std@0.176.0/testing/asserts.ts");
var main_ts_1 = require("./main.ts");
Deno.test(function addTest() {
    (0, asserts_ts_1.assertEquals)((0, main_ts_1.add)(2, 3), 5);
});
