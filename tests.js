/* global b64img */
/* jshint browser:true */
var now;
if(window.performance){
  now = function(){
    return window.performance.now();
  };
} else {
  now = function(){
    return +(new Date());
  };
}

var results = {};

//SINGLE WORKER
//echos, no transfer
var limit = 1000;
var resDiv = document.getElementById('results');
function getListener(name, start, done) {
  var end, rec = 0;
  var report = function (dur) {
    dur = Math.floor(dur*100) / 100;
    var status = name + ': ' + dur + 'ms' + ' - Ops/Sec: ' + Math.floor(1000/(dur/1000));
    console.log(status);
    results[name.replace(/\s/g, '_')] = dur;
    var p=document.createElement('p');
    p.innerHTML = status;
    resDiv.appendChild(p);
  };
  return function () {
    if (++rec == limit) {
      end = now();
      report(end - start);
      if(typeof done == 'function'){done();}
    }
  };
}

function fillArrayBuff(length){
  function rand256(){
    return Math.floor(Math.random() * 256);
  }
  var buff = new ArrayBuffer(length);
  var view = new Uint8Array(buff);
  for(var i=0;i<view.length;i++){
    view[i]=rand256();
  }
  return buff;
}

var echoTests = [
  ['short string', 'Hello World'],
  ['int', parseInt(1e6,10)],
  ['float', Math.PI*1000.1],
  ['array', [100, 'foo', 7, 'bar', 67892.34, 'baz', true]],
  ['object', {foo: 100, bar: 'baz', baz: 67892.34, boom: true}],
  ['nested object', {foo: {value: 100}, bar: {obj: {arr: [Math.PI, 'abc'], str: 'Hello World'}}, baz: [{val:1}, {val: {n:2}}]}],
  ['ArrayBuffer', fillArrayBuff(2048)],
  ['Uint8Array', new Uint8Array(fillArrayBuff(2048))],
  ['Int32Array', new Int32Array(fillArrayBuff(65536))],
  ['Float64Array', new Float64Array(fillArrayBuff(65536))],
  ['long text', b64img.slice(-15000).replace(/\//g,'\n').replace(/\+/g,' ')]
];

function runEchoTest(i, cb) {
  var testInfo = echoTests[i];
  var w = new Worker('echo.js');
  var val = testInfo[1];
  var sent = 0;

  function n() {
    w.terminate();
    if (++i < echoTests.length) {
      runEchoTest(i,cb);
    } else {
      if(typeof cb == 'function'){cb();}
    }
  }
  w.addEventListener('message', getListener(testInfo[0], now(), n));
  while (sent++ < limit) {
    w.postMessage(val);
  }
}

function runTransEchoTest(i,cb) {
  var testInfo = i ? echoTests[i] : echoTests[0];
  var w = new Worker('echo.js');
  var val = testInfo[1];
  var t;
  if(val.byteLength || val.buffer){
    w.postMessage({useTransfer: true});
    t = true;
    val = (val.buffer) ? val.buffer : val;
  }
  var sent = 0;

  function d() {
    w.terminate();
    if (++i < echoTests.length) {
      runTransEchoTest(i,cb);
    } else {
      if(typeof cb == 'function'){cb();}
    }
  }

  w.addEventListener('message', getListener(testInfo[0], now(), d));
  if(sent++ < limit){
    if(t){
      val = new window[testInfo[0]](val.slice());
      w.postMessage(val, (val.buffer) ? [val.buffer] : [val]);
    } else {
      w.postMessage(val);
    }
  }
}

console.log("ECHOS, no transfer");
runEchoTest(0/*, function(){
  console.log("ECHOS, transfer");
  runTransEchoTest(0);
}*/);
