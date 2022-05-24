const SimpleTestContract = artifacts.require("SimpleTestContract");

module.exports = function (deployer) {
  deployer.deploy(SimpleTestContract);
};