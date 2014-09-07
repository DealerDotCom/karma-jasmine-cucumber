karma-jasmine-cucumber
================

# Getting Started

	npm install karma-jasmine-cucumber --save-dev
	
Update karma.conf.js

	plugins: [
		'karma-jasmine',
		'karma-jasmine-cucumber'
	],
	frameworks: ['jasmine', 'jasmine-cucumber']
	
Notice that `jasmine-cucumber` depends on `jasmine` to come before it.

# Motivation
The motivation behind this project was to bring the power of cucumber to expressing complex permutations of tests where jasmine alone starts to fail. This isn't to say that you should no longer use jasmine syntax in favor of this syntax, instead use the right tool for the job. 

Personally, I have found that after about 100 tests jasmine becomes unmanageable. You can refactor your tests to reduce the duplication but then the tests become high maintenance and still tend to be brittle. Cucumber provides a nice syntax for managing this level of complexity by making it easy to re-use a step definition in an almost infinite number of combinations, with the only duplication being human readable scenarios. 

In short, unit tests likely still make sense in Jasmine and would be hard to write in a GWT style. Integration tests (integrating multiple units) is where this will shine. 

*What about cucumberjs?* I haven't spent a lot of effort trying to make cucumberjs work - but it has the extra layer of translating non js files into js which adds considerable complexity (it isn't **just** javascript). It was also very important to me that 1 step be able to abstract away other steps (see nested steps below).

#Api
I recommend splitting your files into specs and steps, here is an example specs.js file

```javascript
	feature('Calculator: add')
	    .scenario('should be able to add 2 numbers together')
    	    .when('I enter "1"')
        	.and('I add "2"')
	        .then('I should get "3"')
    	.scenario('should be able to add to a result of a previous addition')
        	.given('I added "1" and "2"')
	        .when('I add "3"')
    	    .then('I should get "6"')
```
    	    
and steps.js file
	
```javascript
	featureSteps('Calculator:')
	    .before(function(){
    	    this.values = [];
        	this.total = null;
	    })
    	.given('I added "(.*)" and "(.*)"', function(first, second){
        	this.when('I enter "' + first + '"');
	        this.when('I add "' + second + '"');
    	})
	    .when('I enter "(.*)"', function(val){
    	    this.values.push(val * 1);
	    })
    	.when('I add "(.*)"', function(val){
        	this.values.push(val * 1);
	        this.total = this.values[0] + this.values[1];
    	    this.values = [this.total];
	    })
    	.then('I should get "(.*)"', function(val){
        	expect(this.total).toBe(val * 1);
	    })
```

So what are we doing?

```javascript
	feature('Calculator: add')
```

Creates a feature to run tests and serves 2 functions. 
1) the string is used in output for a failing test
2) when declaring step definition, we use regex against the feature string

```javascript
	.scenario('should be able to add 2 numbers together')
```

Creates a scenario, which really just provides output during a failing test

```javascript
	.when('I enter "1"')
```

Tells jasmine-cucumber to execute the step definition that matches `'I enter "1"'`

```javascript
	.and('I add "2"')
```

Is the same as `when('I add "2"')`. 

*Note:* Given and When are interchangable, thens are special because they are wrapped in a jasmine `it()`. In v2.0 they likely will all be interchangeable. 

Enough about the specs, lets take a look at the steps. 

```javascript
	featureSteps('Calculator:')
```

is using regex to say match all features with `Calculator:`

```javascript
	    .before(function(){
    	    this.values = [];
        	this.total = null;
	    })
```
	   
provides code to run before each assertion, this maps to a jasmine `beforeEach`. `this` is a `scenarioContext` which is reset on every assertion (`then`) and allows us to share state between step definitions

```javascript
	    .when('I enter "(.*)"', function(val){
    	    this.values.push(val * 1);
	    })
```
	    
matches `I enter "1"` making val = `'1'` 
	 
```javascript
    	.when('I add "(.*)"', function(val){
        	this.values.push(val * 1);
	        this.total = this.values[0] + this.values[1];
    	    this.values = [this.total];
	    })
```
	    
matches `I add "2"` 
	    
```javascript
    	.then('I should get "(.*)"', function(val){
        	expect(this.total).toBe(val * 1);
	    })
```

matches `I should get "3"` and does the assertion which is being wrapped in a jasmine `it()`
	    
```javascript
  	.given('I added "(.*)" and "(.*)"', function(first, second){
        	this.when('I enter "' + first + '"');
	        this.when('I add "' + second + '"');
    	})
```
    	
This step definition is especially cool as it allows us to abstract away other step definitions. This allows the more complex scenario to be more readable with one line instead of 2 (imagine 4 or 5 lines of setup for each scenario in a real world app). It then re-uses the existing steps by simply creating the strings that would match their regex. 

Last thing worth mentioning is the output… 

If you enter a string that doesn't match any regex, the scenario will fail stating that it is missing a step definition: 

	Feature: Calculator: add
    Scenario: should be able to add to a result of a previous addition
     Given  I added "1" and "2"
     When  I add "3"

    Missing step definitions FAILED
      Missing step definitions:
        I get "6"
        
So now we know we need a step definition for 'I get "6"', or do we… it also attempts to find steps that are a close match and will provide a hint in case it already exists… 

    Feature: Calculator: add
    Scenario: should be able to add to a result of a previous addition
     Given  I added "1" and "2"
     When  I add "3"

    Missing step definitions FAILED
      Missing step definitions:
        I get "6"
          Did you mean?
            I should get "3" (8)
            
It is using levenshteinDistance which is very rough, but often its just enough to remind you that you're off by one word or letter. 

# Roadmap
* Split `karma-jasmine-cucumber` to `jasmine-cucumber` so that it can be used with jasmine alone, eg: in protractor. 
* add support for `when` after `then` for sequence oriented end to end tests where it doesn't always make sense to start the workflow over again for every assertion
* 

	
