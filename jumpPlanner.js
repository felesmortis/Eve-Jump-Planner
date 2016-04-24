//Promise polyfill because fuck IE
!function(t){function e(){}function n(t,e){return function(){t.apply(e,arguments)}}function o(t){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof t)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],s(t,this)}function r(t,e){for(;3===t._state;)t=t._value;return 0===t._state?void t._deferreds.push(e):(t._handled=!0,void l(function(){var n=1===t._state?e.onFulfilled:e.onRejected;if(null===n)return void(1===t._state?i:u)(e.promise,t._value);var o;try{o=n(t._value)}catch(r){return void u(e.promise,r)}i(e.promise,o)}))}function i(t,e){try{if(e===t)throw new TypeError("A promise cannot be resolved with itself.");if(e&&("object"==typeof e||"function"==typeof e)){var r=e.then;if(e instanceof o)return t._state=3,t._value=e,void f(t);if("function"==typeof r)return void s(n(r,e),t)}t._state=1,t._value=e,f(t)}catch(i){u(t,i)}}function u(t,e){t._state=2,t._value=e,f(t)}function f(t){2===t._state&&0===t._deferreds.length&&setTimeout(function(){t._handled||d(t._value)},1);for(var e=0,n=t._deferreds.length;n>e;e++)r(t,t._deferreds[e]);t._deferreds=null}function c(t,e,n){this.onFulfilled="function"==typeof t?t:null,this.onRejected="function"==typeof e?e:null,this.promise=n}function s(t,e){var n=!1;try{t(function(t){n||(n=!0,i(e,t))},function(t){n||(n=!0,u(e,t))})}catch(o){if(n)return;n=!0,u(e,o)}}var a=setTimeout,l="function"==typeof setImmediate&&setImmediate||function(t){a(t,1)},d=function(t){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",t)},h=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)};o.prototype["catch"]=function(t){return this.then(null,t)},o.prototype.then=function(t,n){var i=new o(e);return r(this,new c(t,n,i)),i},o.all=function(){var t=Array.prototype.slice.call(1===arguments.length&&h(arguments[0])?arguments[0]:arguments);return new o(function(e,n){function o(i,u){try{if(u&&("object"==typeof u||"function"==typeof u)){var f=u.then;if("function"==typeof f)return void f.call(u,function(t){o(i,t)},n)}t[i]=u,0===--r&&e(t)}catch(c){n(c)}}if(0===t.length)return e([]);for(var r=t.length,i=0;i<t.length;i++)o(i,t[i])})},o.resolve=function(t){return t&&"object"==typeof t&&t.constructor===o?t:new o(function(e){e(t)})},o.reject=function(t){return new o(function(e,n){n(t)})},o.race=function(t){return new o(function(e,n){for(var o=0,r=t.length;r>o;o++)t[o].then(e,n)})},o._setImmediateFn=function(t){l=t},o._setUnhandledRejectionFn=function(t){d=t},"undefined"!=typeof module&&module.exports?module.exports=o:t.Promise||(t.Promise=o)}(this);

Array.prototype.min = function(){
    return Math.min.apply(Math, this);
};

function sendRequest(verb, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(verb, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

var stations = {
    "Jita": {
        "To": 5.545,
        "From": 8.931
    },
    "Hek": {
        "To": 3,
        "From": 3.355
    },
    "Amarr": {
        "To": 13.213,
        "From": 14.015
    },
    "Dodixie": {
        "To": 9.075,
        "From": 7.744
    },
    "Rens": {
        "To": 6.294,
        "From": 6.959
    },
    "Other": {}
};

var url = "https://public-crest.eveonline.com/market/10000002/orders/sell/?type=https://public-crest.eveonline.com/types/{0}/";

var jitaId = 60003760;

var isotopes = [
    17888,//Nitrogen
    17887,//Oxygen
    17889,//Hydrogen
    16274//Helium
];

var maxLoad = 350000,
    JfcSkill = 4,
    JfSkill = 4,
    dotlanUrl = "http://evemaps.dotlan.net/jump/Rhea,544,S,I/{0}:{1}:{0}",
    priceMultiplier = 2;


function calculateJump(station, loadSize, lightyears) {
    var fuel;
    var promise = Promise.all([
        sendRequest("GET", url.replace('{0}', isotopes[0])),
        sendRequest("GET", url.replace('{0}', isotopes[1])),
        sendRequest("GET", url.replace('{0}', isotopes[2])),
        sendRequest("GET", url.replace('{0}', isotopes[3]))]);
    var route = stations[station];
    if(station === "Other" && !lightyears) throw "Lightyears must be specified if Other is selected"
    lightyears = lightyears || (route.To + route.From);
    
    fuel = lightyears * (4400 * (1 - 0.1 * JfcSkill) * (1 - 0.1 * JfSkill));
    return promise.then(function(arr) {
        var lowestIsotopePrices = arr.map(function(regionData) {
            return JSON.parse(regionData).items.filter(function(item) {
                return item.location.id === jitaId;
            }).map(function(item) {
                return item.price;
            }).min();
        });
        var fuelCost = lowestIsotopePrices.reduce(function(a, b) { return a + b; }) / lowestIsotopePrices.length;
        return ~~(priceMultiplier * ((loadSize / maxLoad) * (fuel * fuelCost)));
    });
}