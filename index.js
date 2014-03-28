var _ = require('lodash');
var qs = require('querystring');
var Q = require('q');
var http = require('q-io/http');

function Test(options) {
	this.options = _.extend(options || {}, {
		url: ''
	});

	this.result = Q();

	this.data = {
		req: {},
		res: {}
	};
}

Test.prototype.resolve = function(instance) {
	var self = this;

	if (_.isArray(instance)) {
		return Q.all(instance.map(function(item) {
			return self.resolve(item);
		}));
	}

	if (_.isObject(instance)) {
		var promises = [];
		var names = [];

		_.forOwn(instance, function(value, key) {
			promises.push(self.resolve(value));
			names.push(key);
		});

		if (!promises.length) {
			return Q(instance);
		}

		return Q.all(promises).then(function(values) {
			for (var i = 0; i < values.length; ++i) {
				instance[names[i]] = values[i];
			}
			return instance;
		});
	}

	return Q(instance);
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

	var deferredResponse = Q.defer();
	self.previous = {
		request: self.resolve(params.body),
		response: deferredResponse.promise
	};

	var previous = self.result;
	self.result = self.resolve(params).then(function(params) {
		return previous.then(function() {
			var url = self.options.url + params.url;
			if (params.method == 'GET' && params.body) {
				url += '?' + qs.stringify(params.body);
			}
			return http.request({
				url: url,
				method: params.method,
				body: params.method == 'POST' ? params.body : null,
				headers: self.headers
			}).then(function(response) {
				self.headers = response.headers;
				deferredResponse.resolve(response);
				return response;
			}, function(error) {
				deferredResponse.reject(error);
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
	return this;
};

Test.prototype.run = function(success, failure) {
	this.result.done(success, failure);
};

module.exports = function(options) {
	return new Test(options);
};
