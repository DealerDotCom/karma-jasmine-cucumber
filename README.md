karma-jasmine-cucumber
================

# Getting Started

	npm install karma-jasmine-cucumber --save-dev
	
Update karma.conf.js

	frameworks: ['jasmine', 'karma-jasmine-cucumber']
	
Notice that `karma-jasmine-cucumber` depends on `jasmine` to come before it.

Check out [jasmine-cucumber](https://github.com/DealerDotCom/jasmine-cucumber) for more details about the actual api. 

# Release Notes
##v 1.0.0
* updated to depend on jasmine-cucumber 1.0 which gives us jasmine 2.0 support. This was a breaking change due to breaking nature of jasmine 2.0 syntax. Main win was better async support which is now exposed in grunt style syntax

```javascript
	.given('some step defintion', function(){
		var done = this.async();
		setTimeout(done);
	})
```
To use karma with jasmine 2.0  `npm install karma-jasmine@~0.2.0 --save-dev`

## v 0.3.4
* supports Jasmine 1.3 syntax

# Roadmap
* [x] Split `karma-jasmine-cucumber` to `jasmine-cucumber` so that it can be used with jasmine alone, eg: in protractor. 
* [x] add support for `when` after `then` for sequence oriented end to end tests where it doesn't always make sense to start the workflow over again for every assertion

	
