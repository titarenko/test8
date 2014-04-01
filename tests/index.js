var should = require('should');
var test8 = require('../index');

describe('test8', function() {

	it('should allow to do get request', function(done) {
		test8({ url: 'http://localhost:3000' })
			.post('/login', {
				email: 'admin@example.com',
				password: 'test'
			})
			.get('/affiliates')
			.as('users')
			.assert(function(data) {
				console.log(data.res['users']);
				data.res['users'].should.be.ok;
			}).run(done, done);
	});

});
