var css = require('selenium-webdriver').By.css;

function makeLocators(obj) {
    var ret = {};
    Object.keys(obj).forEach(function(key) {
        if (typeof obj[key] === 'string') {
            ret[key] = css(obj[key]);
        } else {
            ret[key] = makeLocators(obj[key]);
        }
    });
    return ret;
}

module.exports = makeLocators;
