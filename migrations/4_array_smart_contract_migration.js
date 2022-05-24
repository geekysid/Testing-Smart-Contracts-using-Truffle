const ArraySmartContract = artifacts.require("ArraySmartContract");

module.exports = function (deployer) {
  deployer.deploy(ArraySmartContract);
};