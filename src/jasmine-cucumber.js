(function(){
    var origStart = window.__karma__.start;
    window.__karma__.start = function(){
        features.forEach(jasmineFeatureRunner);
        var scenarios = features.reduce(function(memo, f){
            return memo + f.scenarios.length;
        }, 0);

        // TODO: how can we output to the console in a "prettier" way?
        console.log('Found ' + features.length + ' features with ' + scenarios + ' scenarios');
        origStart.apply(this, arguments);
    };

    function levenshteinDistance (a, b) {
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;

        var matrix = [];

        // increment along the first column of each row
        var i;
        for(i = 0; i <= b.length; i++){
            matrix[i] = [i];
        }

        // increment each column in the first row
        var j;
        for(j = 0; j <= a.length; j++){
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for(i = 1; i <= b.length; i++){
            for(j = 1; j <= a.length; j++){
                if(b.charAt(i-1) == a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                        Math.min(matrix[i][j-1] + 1, // insertion
                                matrix[i-1][j] + 1)); // deletion
                }
            }
        }

        return matrix[b.length][a.length];
    }


    function jasmineFeatureRunner(feature){
        var relevantFeatureSteps = steps.filter(function(item){
            return item.pattern.test(feature.description);
        });
        feature.steps = relevantFeatureSteps.reduce(function(reduce, item){
            return reduce.concat(item.steps);
        }, []);
        feature.beforeSteps = relevantFeatureSteps.reduce(function(reduce, item){
            return reduce.concat(item.beforeSteps);
        }, []);
        var scenarios = feature.scenarios.filter(function(item){
            return item.isOnly;
        });
        // if we have no scenarios to run specifically (isOnly) then run them all
        if (scenarios.length === 0){
            // then run them all
            scenarios = feature.scenarios.filter(function(item){
                return !item.never;
            });
        }
        scenarios.forEach(function(scenario){
            var missingSteps = [],
                ambiguousSteps = [],
                scenarioContext;

            describe('\nFeature: ' + feature.description, function(){
                beforeEach(function(){
                    scenarioContext = {
                        when : function(description){
                            var step = getStep({
                                description : description,
                                arguments : Array.prototype.slice(arguments, 1)
                            });
                            if (step !== noOp){
                                step();
                            }
                            else{
                                // we are now in the executing phase... and so we need to throw rather than queue into missingSteps
                                throw new Error('failed to find "' + description + '"');
                            }
                        },
                        given : function(){
                            this.when.apply(this, arguments);
                        },
                        then : function(){
                            this.when.apply(this, arguments);
                        }
                    };

                    feature.beforeSteps.forEach(function(step){
                        step.call(scenarioContext);
                    });
                });
                var desc = scenario.isOnly ? ddescribe : describe;
                desc('\nScenario: ' + scenario.description + '\n', getScenarioRunner(scenario));
            });

            function getScenarioRunner(scenario){
                return recursiveDescribe(scenario.givens, 'Given', recursiveDescribe(scenario.whens, 'When', getThensRunner(scenario.thens)));
            }

            function recursiveDescribe(descriptions, prefix, callback){
                if (descriptions.length > 0){
                    var description = descriptions.pop();

                    var smartPrefix = descriptions.length === 0 ? prefix : 'And';

                    return recursiveDescribe(descriptions, prefix, function(){
                        describe(smartPrefix + '  ' + description.description + '\n', function(){
                            var step = getStep(description);
                            beforeEach(function(){
                                if (step && missingSteps.length === 0 && ambiguousSteps.length === 0){
                                    step();
                                }
                            });

                            callback();
                        });
                    });
                } else{
                    return callback;
                }
            }

            function getThensRunner(thens){
                var itWrappers = thens.map(function(then){
                    var step = getStep(then);
                    return function(){
                        if (step && missingSteps.length === 0 && ambiguousSteps.length === 0){
                            it('Then  ' + then.description + '\n', function(){
                                step();
                            });
                        }
                    };
                });
                return function(){
                    itWrappers.forEach(function(item){
                        item();
                    });

                    if (missingSteps.length > 0){
                        it('\nMissing step definitions', function(){
                            this.fail('Missing step definitions:\n\t' +
                                missingSteps.map(stepWithLikelyMatch)
                                .join('\n\t'));
                        });
                    }
                    else if (thens.length === 0){
                        it('\nMissing Then...', function(){
                            this.fail('Missing then, add a then step');
                        });
                    }

                };
            }

            function mapDescription(step){
                return step.description;
            }
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }


            function stepWithLikelyMatch(unknownDescription){
                var candidates = features.reduce(function(memo, feature){
                    return memo.concat(feature.scenarios);
                }, [])
                    .reduce(function(memo, scenario){
                        return memo.concat(scenario.givens.map(mapDescription))
                            .concat(scenario.whens.map(mapDescription))
                            .concat(scenario.thens.map(mapDescription));
                    }, [])
                    .filter(onlyUnique)
                    .filter(function(description){
                        return missingSteps.indexOf(description) === -1;
                    })
                    .map(function(knownDescription){
                        return {
                            description : knownDescription,
                            score : levenshteinDistance(unknownDescription, knownDescription)
                        };
                    })
                    .sort(function(l, r){
                        return l.score - r.score;
                    })
                    .map(function(item){
                        return item.description + ' (' + item.score + ')';
                    })
                    .slice(0,5);
                return unknownDescription + '\n\t\tDid you mean?\n\t\t\t' + candidates.join('\n\t\t\t');
            }

            function noOp(){}

            function getStep(description){
                // look for 1 and only one match step
                var matchingSteps = feature.steps
                    .map(function(item){
                        var result = item.pattern.exec(description.description);
                        return {
                            definition : item.definition,
                            pattern : item.pattern,
                            arguments : result ? result.slice(1).concat(description.arguments) : [],
                            match : !!result
                        };
                    })
                    .filter(function(item){
                        return item.match;
                    });

                if (matchingSteps.length === 0){
                    missingSteps.push(description.description);
                }
                else if (matchingSteps.length > 1){
                    ambiguousSteps.push(description.description);
                }

                if (matchingSteps.length === 1){
                    return function(){
                        try{
                            matchingSteps[0].definition.apply(scenarioContext, matchingSteps[0].arguments);
                        }
                        catch(e){
                            throw new Error('error while executing "' + description.description + '"\n ' + e.toString() + '\n' + e.stack);
                        }
                    };
                }
                else{
                    return noOp;
                }
            }
        });
    }
    var features = [];
    var featureRunner = {
        enqueue : function(feature){
            features.push(feature);
        }
    };


    function Feature(featureDescription){
        function Scenario(scenarioDescription, options){
            var self = this;
            options = options || {};
            this.description = scenarioDescription;
            this.givens = [];
            window.given = this.given = function(){
                self.givens.push({ description : arguments[0], arguments : Array.prototype.splice.call(arguments, 1) });
                self.and = self.given;
                return self;
            };
            this.whens = [];
            this.when = function(){
                this.whens.push({ description : arguments[0], arguments : Array.prototype.splice.call(arguments, 1) });
                this.and = this.when;
                return this;
            };
            this.thens = [];
            this.then = function(){
                this.thens.push({ description : arguments[0], arguments : Array.prototype.splice.call(arguments, 1) });
                this.and = this.then;
                return this;
            };
            this.isOnly = options.only === true ? true : false;
            this.never = options.not === true ? true : false;
        }
        Scenario.prototype = this;
        var self = this;

        self.not = {
            scenario : function(){
                return self.scenario.apply(self, Array.prototype.slice.call(arguments, 0).concat({ not : true}));
            }
        };

        self.only = {
            scenario : function(){
                return self.scenario.apply(self, Array.prototype.slice.call(arguments, 0).concat({ only : true}));
            }
        };

        this.description = featureDescription;
        this.scenarios = [];
        window.scenario = this.scenario = function(scenarioDescription, callback){
            var scenario = new Scenario(scenarioDescription, callback);
            self.scenarios.push(scenario);
            return scenario;
        };
    }
    function feature(featureDescription, callback){
        var f = new Feature(featureDescription, callback);
        featureRunner.enqueue(f);
        return f;
    }
    
    var steps = [];
    
    function FeatureSteps(featurePattern, callback){
        this.pattern = new RegExp(featurePattern);
        this.beforeSteps = [];
        this.steps = [];
        this.given = this.when = this.then = function(pattern, definition){
            this.steps.push({pattern : new RegExp('^' + pattern + '$'), definition : definition});
            return this;
        };
        this.before = function(definition){
            this.beforeSteps.push(definition);
            return this;
        };

        if (callback){
            callback.call(this);
        }
    }

    window.feature = feature;
    window.featureSteps = function(featurePattern, callback){
        var featureSteps = new FeatureSteps(featurePattern, callback);
        steps.push(featureSteps);
        return featureSteps;
    };
}());