var _ = require('lodash');
var qs = require('querystring');
var Q = request('q');
var http = require('q-io/http');

function Test(options) {
	this.options = _.extend(options, {
		url: ''
	};

	this.result = Q();

	this.data = {
		req: {},
		res: {}
	};
}

Test.prototype.resolve = function(instance) {
	// todo if any property of instance is promise,
	// then wrap them all into promise and resolve it when everything is resolved
	// (recursive without limits on depth)
};

Test.prototype.get = function(url, body) {
	return this.request(url, 'GET', body);
};

Test.prototype.post = function(url, body) {
	return this.request(url, 'POST', body);
};

Test.prototype.request = function(url, method, body) {
	var self = this;

	params = {
		url: url,
		method: method,
		body: body
	};

	var response = Q.defer();
	self.previous = {
		request: self.resolve(params.body),
		response: response
	};

	self.resolve(params).then(function(params) {
		self.result = self.result.then(function() {
			var url = self.options.url + params.url;
			if (params.method == 'GET') {
				query += '?' + qs.stringify(params.body);
			}
			return http.request({
				url: url,
				method: params.method,
				body: params.method == 'POST' ? params.body : null
			}).then(function(response) {
				self.response.resolve(response);
				return response;
			}, function(error) {
				self.response.reject(error);
			});
		});
	});

	return self;
};

Test.prototype.as = function(name) {
	this.data.req[name] = this.previous.request;
	this.data.res[name] = this.previous.response;
	return this;
};

Test.prototype.assert = function(callback) {
	this.result = this.resolve(this.data).then(callback);
};

Test.prototype.run = function(success, failure) {
	this.result.done(success, failure);
};

module.exports = function(options) {
	return new Test(options);
};
