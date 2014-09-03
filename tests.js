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

var str = b64img.slice(-64).replace(/\//g,' ');
var longStr = b64img.slice(-15000).replace(/\//g,'\n').replace(/\+/g,' ');
var int = parseInt(str.length,10);
var float = longStr.length * Math.PI;

var echoTests = [
  ['short string', str],
  ['int', int],
  ['float', float],
  ['array', [int, str, float, longStr]],
  ['object', {foo: int, bar: str, baz: float, boom: longStr}],
  ['nested object', {foo: {value: int}, bar: {obj: {arr: [float, 'abc'], str: str}}, baz: [{val:1}, {val: {n:longStr}}]}],
  ['ArrayBuffer', fillArrayBuff(65536)],
  ['Uint8Array', new Uint8Array(fillArrayBuff(65536))],
  ['Int32Array', new Int32Array(fillArrayBuff(65536))],
  ['Float64Array', new Float64Array(fillArrayBuff(65536))],
  ['long text', longStr]
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
