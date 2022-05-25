const BankingSystem = artifacts.require("BankingSystem");

module.exports = function (deployer) {
  deployer.deploy(BankingSystem, "HDFC", "0460");
};