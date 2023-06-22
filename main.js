"use strict";
exports.__esModule = true;
exports.add = void 0;
function add(a, b) {
    return a + b;
}
exports.add = add;
// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    console.log("Add 2 + 3 =", add(2, 3));
}
