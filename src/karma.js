/* jshint node:true */

function init (files) {
    var jasmineAdapterFound = false;
    for (var i = 0; i < files.length; i++){
        // need to inject our adapter after the jasmine adapter so that we can wrap it
        if (files[i].pattern.indexOf('/adapter.js') !== -1){
            files.splice(i + 1, 0, {
                pattern: __dirname + '/jasmine-cucumber.js',
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
    'framework:jasmine-cucumber' : ['factory', init]
};