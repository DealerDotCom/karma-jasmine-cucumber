/* jshint node:true */

var path = require('path');

function init (files) {
  var jasmineCucumberPath = path.join(__dirname, '/../node_modules/jasmine-cucumber/');
    var jasmineAdapterFound = false;
    for (var i = 0; i < files.length; i++){
        // need to inject our adapter after the jasmine adapter so that we can wrap it
        if (files[i].pattern.indexOf('/adapter.js') !== -1){
            files.splice(i + 1, 0, {
                pattern: path.join(jasmineCucumberPath, 'src/jasmine-cucumber.js'),
                included: true,
                served: true,
                watched: false
            });
            files.splice(i + 1, 0, {
                pattern: path.join(jasmineCucumberPath, 'src/jasmine-feature-runner.js'),
                included: true,
                served: true,
                watched: false
            });
            files.splice(i + 1, 0, {
                pattern: path.join(jasmineCucumberPath, 'src/karma-jasmine-runner.js'),
                included: true,
                served: true,
                watched: false
            });
            jasmineAdapterFound = true;
            break;
        }
    }
    if (!jasmineAdapterFound){
        throw new Error('jasmine adapter.js not found... did you include jasmine in frameworks: [\'jasmine\', \'jasmine-cucumber\']');
    }
}

// pass config.files to init as first arg, files
init.$inject = ['config.files'];

module.exports = {
    'framework:karma-jasmine-cucumber' : ['factory', init]
};