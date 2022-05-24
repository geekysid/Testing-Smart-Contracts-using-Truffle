const TestingStruct = artifacts.require("TestingStruct");

module.exports = function (deployer) {
  deployer.deploy(TestingStruct);
};