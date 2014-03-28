var should = require('should');
var test8 = require('../index');

describe('test8', function() {

	it('should allow to do get request', function(done) {
		test8()
			.get('http://www.google.com.ua/?gfe_rd=cr&ei=iAI2U9rHFeyO8Qfu7YFw')
			.as('page')
			.assert(function(data) {
				data.res['page'].headers.should.be.ok;
			}).run(done, done);
	});

});
