module.exports = function( grunt ) {
    "use strict";

    function readOptionalJSON( filepath ) {
        var data = {};
        try {
            data = grunt.file.readJSON( filepath );
        } catch ( e ) {}
        return data;
    }

    var gzip = require( "gzip-js" ),
        srcHintOptions = readOptionalJSON( "src/.jshintrc" );

    // The concatenated file won't pass onevar
    // But our modules can
    delete srcHintOptions.onevar;

    grunt.initConfig({
        pkg: grunt.file.readJSON( "package.json" ),
        dst: readOptionalJSON( "dist/.destination.json" ),
        "compare_size": {
            files: [ "dist/transformers.js", "dist/transformers.min.js" ],
            options: {
                compress: {
                    gz: function( contents ) {
                        return gzip.zip( contents, {} ).length;
                    }
                },
                cache: "build/.sizecache.json"
            }
        },
        concat: {
            options: {
                //separator: ';'
            },
            dist: {
                src: [
                    'src/intro.js',
                    'src/global.js',
                    'src/config.js',
                    'src/mentor.js',
                    'src/helper/browser.js',
                    'src/helper/utility.js',
                    'src/library/hash.js',
                    'src/library/location-hash.js',
                    'src/library/component-loader.js',
                    'src/component/sys.js',
                    'src/component/default.js',
                    'src/core/application.js',
                    'src/core/component-manager.js',
                    'src/core/router.js',
                    'src/define.js',
                    'src/outro.js'
                ],

                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        jsonlint: {
            pkg: {
                src: [ "package.json" ]
            },

            bower: {
                src: [ "bower.json" ]
            }
        },
        jshint: {
            all: {
                src: [
                    "src/**/*.js", "!src/intro.js", "!src/outro.js", "Gruntfile.js", "build/**/*.js"
                ],
                options: {
                    jshintrc: true
                }
            },
            dist: {
                src: "dist/transformers.js",
                options: srcHintOptions
            }
        },
        jscs: {
            src: "src/**/*.js",
            gruntfile: "Gruntfile.js",
            dist: "dist/transformers.js",

            // Right now, check only test helpers
            //test: [ "test/data/testrunner.js" ],
            tasks: "build/tasks/*.js"
        },
        watch: {
            files: [ "<%= jshint.all.src %>" ],
            tasks: [ "dev" ]
        },
        'string-replace': {
            dist: {
                files: {
                    'dist/transformers.js': 'dist/transformers.js'
                },
                options: {
                    replacements: [
                        {
                            pattern: /@VERSION/g,
                            replacement: "<%= pkg.version %>",
                        },
                        {
                            pattern: /@DATE/g,
                            replacement: "<%= grunt.template.today('yyyy-mm-dd') %>",
                        },
                        {
                            pattern: /@BUILD/g,
                            replacement: "<%= pkg.build %>",
                        }
                    ]
                }
            }
        },
        uglify: {
            all: {
                files: {
                    "dist/transformers.min.js": [ "dist/transformers.js" ]
                },
                options: {
                    preserveComments: false,
                    sourceMap: true,
                    sourceMapName: "dist/transformers.min.map",
                    report: "min",
                    beautify: {
                        "ascii_only": true
                    },
                    banner: "/*! Transformers v<%= pkg.version %> | " +
                        "(c) Hex license */",
                    compress: {
                        "hoist_funs": false,
                        loops: false,
                        unused: false
                    }
                }
            }
        }
    });

    // Load grunt tasks from NPM packages
    require( "load-grunt-tasks" )( grunt );

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-string-replace');

    grunt.registerTask( "lint", [ "jsonlint", "jshint", "jscs" ] );

    // Short list as a high frequency watch task
    grunt.registerTask( "dev", [ "concat", "string-replace", "lint", "uglify" ] );

    grunt.registerTask( "default", [ "dev", "compare_size" ] );
};
