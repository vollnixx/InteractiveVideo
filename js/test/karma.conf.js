// Karma configuration

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'jasmine-jquery','jasmine'],


		// list of files / patterns to load in the browser
		files: ['https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js',
		        'globalVariables.js',
		        '../jquery.InteractiveVideoQuestionViewer.js', 'InteractiveVideoQuestionViewerTest.js',
		        '../jquery.InteractiveVideoQuestionCreator.js', 'InteractiveVideoQuestionCreatorTest.js',
		        '../InteractiveVideoPlayerComments.js', 'InteractiveVideoPlayerCommentsTest.js',
		        '../InteractiveVideoPlayerAbstract.js', 'InteractiveVideoPlayerAbstractTests.js',
				'../InteractiveVideoPlayerFunctions.js',
		        {pattern: 'spec/javascripts/fixtures/*'}
		],


		// list of files to exclude
		exclude: [
		],


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'coverage', 'allure'],
		 allureReport: {
		      reportDir: '',
		    },
		preprocessors: {    '../jquery.InteractiveVideoQuestionViewer.js': ['coverage'],
							'../jquery.InteractiveVideoQuestionCreator.js': ['coverage'],
							'../InteractiveVideoPlayerComments.js': ['coverage'],
							'../InteractiveVideoPlayerAbstract.js' : ['coverage']
		},

		coverageReporter: { type : 'html', dir : 'coverage/' },

		// web server port
		port: 9877,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['PhantomJS'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false
	})
};
