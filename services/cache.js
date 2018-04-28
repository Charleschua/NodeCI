const mongoose = require('mongoose');
const redis = require('redis');
const keys = require('../config/keys');
const client = redis.createClient(keys.redisUrl);
const util = require('util');

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');

    return this;
}

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }
    // console.log('I\'m about to run a query');

    //console.log(this.getQuery());
    //console.log(this.mongooseCollection.name);
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name

    }));

    // console.log(key);

    // See if we have a value for 'key' in redis
    const cacheValue = await client.hget(this.hashKey, key);
    //if we do, return that
    if (cacheValue) {
        // console.log(this);
        // const doc = new this.model(JSON.parse(cacheValue));
        const doc = JSON.parse(cacheValue);

        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc);

    }
    //otherwise, issue the query and store the result in redis

    const result = await exec.apply(this, arguments);

    // console.log(result.validate);

    client.hset(this.hashKey, key, JSON.stringify(result));

    return result;
};

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
};