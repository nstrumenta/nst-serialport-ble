var util = require("util");

var bleno = require("bleno-mac");

var BlenoCharacteristic = bleno.Characteristic;

var Characteristic = function () {
  Characteristic.super_.call(this, {
    uuid: "097eb207-a128-49bb-a5e0-d3fe45100001",
    properties: ["read", "write", "notify"],
    value: null,
  });

  //callbacks used in index
  this.onSubscribe = null;
  this.onUnsubscribe = null;

  this._value = new Buffer.alloc(0);
  this._updateValueCallback = null;
};

util.inherits(Characteristic, BlenoCharacteristic);

Characteristic.prototype.onReadRequest = function (offset, callback) {
  console.log(
    "Characteristic - onReadRequest: value = " + this._value.toString("hex")
  );

  callback(this.RESULT_SUCCESS, this._value);
};

Characteristic.prototype.onWriteRequest = function (
  data,
  offset,
  withoutResponse,
  callback
) {
  this._value = data;

  console.log(
    "Characteristic - onWriteRequest: value = " +
      this._value.toString("hex")
  );

  if (this._updateValueCallback) {
    console.log("Characteristic - onWriteRequest: notifying");

    this._updateValueCallback(this._value);
  }

  callback(this.RESULT_SUCCESS);
};

Characteristic.prototype.onSubscribe = function (
  maxValueSize,
  updateValueCallback
) {
  console.log("Characteristic - onSubscribe");
  if(this.onSubscribe) this.onSubscribe();

  this._updateValueCallback = updateValueCallback;
};

Characteristic.prototype.onUnsubscribe = function () {
  console.log("Characteristic - onUnsubscribe");
  if(this.onSubscribe) this.onUnsubscribe();

  this._updateValueCallback = null;
};

module.exports = Characteristic;
