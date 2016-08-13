'use strict';

const fs = require('fs');
const config = require('config');
const zmq = require('zmq');
const moment = require('moment');

const MQ_ENGINE_URI = config.get('mq.engine.uri');
const MQ_ENGINE_TOPIC = config.get('mq.engine.topic');

const socketEngine = zmq.socket('pub');

function init() {
  socketEngine.connect(MQ_ENGINE_URI);

  runBacktest();
}

function runBacktest() {
  const fileName = config.get('data.fileName');
  const instrument = config.get('data.instrument');

  fs.readFile(`data/${fileName}`, 'utf8', (err, data) => {
    const tickData = data.split('\n').map(l => l.split(','));
    const ticks = tickData.map(arr => {
      return {
        source: MQ_ENGINE_TOPIC,
        time: new Date(arr[0]),
        instrument: instrument,
        ask: Number(arr[1]),
        bid: Number(arr[2])
      };
    });

    ticks.forEach(t => {
      socketEngine.send([
        MQ_ENGINE_TOPIC,
        JSON.stringify(t)
      ]);
    });

    console.log(`all sent: ${instrument}`);
  });
}

init();
