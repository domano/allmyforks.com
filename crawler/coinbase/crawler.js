"use strict";

const HistoricalCourse = require('../common/db/historical').model;
const config = require('./config');
const RequestRepeater = require('../common/request_repeater');
const { request } = RequestRepeater(config);

const processEachCourse = function(body){
  const data = JSON.parse(body);
  const symbol = data.data.base;
  const fiat = data.data.currency;

  let bulk = HistoricalCourse.collection.initializeUnorderedBulkOp();
  let operationCount = 0;

  for(let price of data.data.prices){
    let entity = {
      from: {
        name: symbol,
        type: 'crypto'
      },
      to: {
        name: fiat,
        type: 'fiat'
      },
      date: price.time,
      close: Number.parseFloat(price.price)
    };

    let where = { from: entity.from, to: entity.to, date: entity.date };
    bulk.find(where).upsert().updateOne(entity);
    operationCount++;
  }

  if(operationCount !== 0){
    //return a promise of db-execute
    return bulk.execute();
  }

  return Promise.all(p);
};

const get = function(symbol){
  const url = `https://www.coinbase.com/api/v2/prices/${symbol}-USD/historic?period=all`;
  return request(url)
    .then(({body}) => processEachCourse(body))
};

module.exports = {
  get
};