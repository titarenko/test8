var _ = require('lodash');
var Q = require('q');
var request = require('request');

function Test(options) {
	this.options = _.defaults(options || {}, {
		url: ''
	});

	this.result = Q();

	this.data = {
		req: {},
		res: {}
	};

	this.jar = request.jar();
}

Test.prototype.resolve = function(instance) {
	var self = this;

	if (_.isArray(instance)) {
		return Q.all(instance.map(self.resolve));
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
			var deferredRequest = Q.defer();

			var options = {
				url: self.options.url + params.url,
				method: params.method,
				qs: params.method == 'GET' ? params.body : null,
				form: params.method == 'POST' ? params.body : null,
				jar: self.jar
			};

			request(options, function(error, response, body) {
				if (error) {
					deferredRequest.reject(error);
				} else {
					deferredRequest.resolve(body);
				}
			});

			deferredRequest.promise.then(function(body) {
				var result = body;

				try {
					result = JSON.parse(result);
				} catch (e) {
				}

				deferredResponse.resolve(result);
				return result;
			}, function(error) {
				deferredResponse.reject(error);
				throw error;
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

Test.prototype.val = function(name) {
	return this.data.res[name];
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
