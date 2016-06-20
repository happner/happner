/**
 * Created by johan on 6/15/16.
 */

module.exports = function () {
  return new Component();
}

function Component() {


}

Component.prototype.remoteCall = function (callback) {
  callback();
};
