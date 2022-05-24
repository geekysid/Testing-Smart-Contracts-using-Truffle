const HelloWorldContract = artifacts.require("HelloWorld");

module.exports = function (deployer) {
  deployer.deploy(HelloWorldContract, "Message set by constructor");
};