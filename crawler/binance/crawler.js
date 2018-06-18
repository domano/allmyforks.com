"use strict";

const HistoricalCourse = require('../common/db/historical').model;
const config = require('./config');
const RequestRepeater = require('../common/request_repeater');
const { request } = RequestRepeater(config);
const moment = require("moment");
const currencyHelper = require('../common/currency_helper')

const MIN_DATE = moment('2009-01-01'); //before BTC-Birthday
const PAGE_SIZE = 500;

const REGEX = /.*IP banned until ([0-9]+).*/

const determineSleepTime = function(response, body){
  //the time is responded in body:
  // {"code":-1003,"msg":"Way too many requests; IP banned until 1528915447267. Please use the websocket for live updates to avoid bans."}

  let jsonBody = {}
  try{
    jsonBody = JSON.parse(body)
  }catch(e){}

  if(jsonBody.msg){
    let match = REGEX.exec(jsonBody.msg)
    if(match) {
      const until = match[1]

      if (until) {
        let parsed = Number.parseInt(until)
        if (!Number.isNaN(parsed)) {
          return (parsed - new Date().getTime()) + 1000
        }
      }
    }
  }

  return config.request.repeatsleep
}

const determineStartDate = function(source, target, defaultStartDate) {
  return new Promise((resolve, reject) => {
    HistoricalCourse.find({
      from: source,
      to: target
    })
    .limit(1)
    .sort({ date: 'desc' })
    .select({ date: 1})
    .exec((err, courses) => {
      if (err || courses.length === 0) {
        resolve(defaultStartDate);
        return;
      }

      resolve(moment(courses[0].date));
    })
  });
};

const processEachCourse = function(source, target, body){
  const data = JSON.parse(body);

  /*
    Array of Arrays:
    [
      [
        1499040000000,      // Open time
        "0.01634790",       // Open
        "0.80000000",       // High
        "0.01575800",       // Low
        "0.01577100",       // Close
        "148976.11427815",  // Volume
        1499644799999,      // Close time
        "2434.19055334",    // Quote asset volume
        308,                // Number of trades
        "1756.87402397",    // Taker buy base asset volume
        "28.46694368",      // Taker buy quote asset volume
        "17928899.62484339" // Ignore
      ],
      [...]
    ]
   */

  let bulk = HistoricalCourse.collection.initializeUnorderedBulkOp();
  let operationCount = 0;

  for(let curEntity of data){
    let entity = {
      from: source,
      to: target,
      date: moment(curEntity[0]).toDate(),
      open: Number.parseFloat(curEntity[1]),
      high: Number.parseFloat(curEntity[2]),
      low: Number.parseFloat(curEntity[3]),
      close: Number.parseFloat(curEntity[4]),
      volume: Number.parseFloat(curEntity[5]),
    };

    let where = { from: entity.from, to: entity.to, date: entity.date };
    bulk.find(where).upsert().updateOne(entity);
    operationCount++;
  }

  if(operationCount !== 0){
    //return a promise of db-execute
    return bulk.execute();
  }

  return Promise.resolve();
};

const get = function(source, target, from) {
  const url = `https://api.binance.com/api/v1/klines?symbol=${source.name}${target.name}&interval=1d&startTime=${from.unix()}000&limit=${PAGE_SIZE}`;
  return request(url, determineSleepTime)
    .then(({body}) => processEachCourse(source, target, body))
};

const crawl = function(source, target = {name: "USDT", type: "crypto"}, from = MIN_DATE){
  return determineStartDate(source, target, from)
    .then(startDate => {
      const p = [];
      const today = moment();
      let curDate = moment(startDate);

      while(curDate.isBefore(today)){
        p.push(get(source, target, curDate));

        //next page
        curDate = curDate.clone().add(PAGE_SIZE, "days")
      }

      return Promise.all(p);
    });
};

const list = function() {
  const url = 'https://api.binance.com/api/v1/exchangeInfo'
  return request(url, determineSleepTime)
    .then(({body}) => {
      const data = JSON.parse(body);

      return data.symbols.map(entity => {
        return {
          symbol: entity.symbol,
          source: currencyHelper.toCurrency(entity.baseAsset),
          target: currencyHelper.toCurrency(entity.quoteAsset),
        }
      })
    })
}

module.exports = {
  crawl, list
};