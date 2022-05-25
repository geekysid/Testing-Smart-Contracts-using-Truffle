const { balance, constant, BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const BankingSystem = artifacts.require("BankingSystem");

contract("BankingSystem", (accounts) => {
    let instance = null;
    const managerWallet = accounts[0];
    const sidWallet = accounts[1];
    const manishWallet = accounts[2];

    before( async () => {
        instance = await BankingSystem.deployed();
    });

    describe("BankingSystem", async () => {
        it("Should set bank manager to account 0", async () => {
            const bankManager = await instance.bankManager();
            assert.equal(bankManager, managerWallet, `From contract: ${bankManager} || Actual: ${managerWallet}`);
        });

        it("Should allow only Manager to create account", async () => {
            /* expectRevert( function call, error expected) */
            await expectRevert(
                instance.createAccount(sidWallet, {from: manishWallet}),
                "Only bank manaker can access this functionality"
            );

            /* expectEvent( receipt object, name of event, {values to validate} ) */
            const receipt = await instance.createAccount(sidWallet, {from: managerWallet})
            expectEvent(
                receipt,
                "AccountCreated",
                {
                    accountAddress: sidWallet
                }
            );
        });

        it("Should not allow duplicate account creation", async () => {
            /* expectRevert( function call, error expected) */
            await expectRevert(
                instance.createAccount(sidWallet, {from: managerWallet}),
                "It seems account already exists"
            );
        });

        it("Account should have status of 1 on creation", async () => {
            await instance.createAccount(manishWallet, {from: managerWallet});
            const status = await instance.getAccountStatus(sidWallet);
            assert.equal(1, new BN(status), "Status is not same");
        });

        it("Should not allow account owner to access account untill account is in active state", async () => {
            await expectRevert(
                instance.getBalance({from: sidWallet}),
                "It seems account is not active"
            );
        });

        it("Should only allow manager to change account status", async () => {
            await expectRevert(
                instance.updateAccountStatus(sidWallet, 0, { from: sidWallet }),
                "Only bank manaker can access this functionality"
            );

            const receipt = await instance.updateAccountStatus(sidWallet, 0, { from: managerWallet });
            expectEvent(
                receipt,
                "AccountStatusUpdated",
                {
                    accountAddress: sidWallet,
                    newStatus: new BN(0)
                }
            );
        });
    });
});