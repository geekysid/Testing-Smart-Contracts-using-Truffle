const { balance, constant, BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const BankingSystem = artifacts.require("BankingSystem");

contract("BankingSystem", (accounts) =>  {
    let instance = null;
    const managerWallet = accounts[0];

    const sidWallet = accounts[1];
    const manishWallet = accounts[2];
    let sidWalletTracker = null;
    let manishWalletTracker = null;
    let contractBalanceTracker = null;

    before( async () => {
        instance = await BankingSystem.deployed();
        sidWalletTracker = await balance.tracker(sidWallet, 'ether');
        // console.log(await sidWalletTracker.get());

        manishWalletTracker = await balance.tracker(manishWallet, "ether");
        // console.log(await manishWalletTracker.get());

        contractBalanceTracker = await balance.tracker(instance.address, 'ether');
        // console.log(await contractBalanceTracker.get());
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

        it("Should have an initial balance of 0", async () => {
            const sidAccountBalance = await instance.getBalance({from: sidWallet});
            assert.equal(0, sidAccountBalance.toNumber(), `Expected: 0 || Actual: ${sidAccountBalance.toNumber()}`);
        });

        it("Should allow account owner to deposit amount in his account", async () => {
            const receipt = await instance.deposit({ from: sidWallet, value: web3.utils.toWei("5", "ether") });
            await expectEvent(
                receipt,
                'AmountDeposited'
            );
        });

        it("Sid's account balance should be 5", async () => {
            const accountBalance = await instance.getBalance({ from: sidWallet });
            assert.equal(accountBalance.toNumber(), 5, `Expected: 5 || Actual: ${accountBalance.toNumber()}`);
        });

        it("Should not allow withdrawal more then account balance", async () => {
            await expectRevert(
                instance.withdraw(6, { from: sidWallet }),
                "Don\'t have enough balance to make this transaction"
            );
        });

        it("Should allow account owner to withdraw", async () => {
            // const receipt = await instance.withdraw(2, { from: sidWallet});
            await expectEvent(
                await instance.withdraw(2, { from: sidWallet}),
                "AmountWithdrawal",
                {
                    amount: new BN(2)
                }
            );
        });

        it("Should not allow accounts to be added as beneficiary which does not exist or are not active", async () => {
            // console.log((await instance.getAccountStatus(manishWallet)).toNumber());
            await expectRevert(
                instance.addBeneficiary(manishWallet, { from: sidWallet }),
                "It seems account is not active"
            );

            // making sure inactive accounts can not add beneficiaries
            await expectRevert(
                instance.addBeneficiary(sidWallet, { from: manishWallet }),
                "It seems account is not active"
            );

            await expectRevert(
                instance.addBeneficiary(manishWallet, { from: accounts[3] }),
                "It seems account doesnot exists"
            );

            // making sure account that does not exists are not added as beneficiaries
            await expectRevert(
                instance.addBeneficiary(accounts[3], { from: sidWallet }),
                "It seems account doesnot exists"
            );
        });

        it("Should allow accounts to be added as beneficiary only once", async () => {
            // making sure active accounts can be added as beneficiaries by actice accounts
            await instance.updateAccountStatus(manishWallet, 0);
            const receipt = await instance.addBeneficiary(manishWallet, { from: sidWallet });
            await expectEvent(
                receipt,
                "BeneficiaryAdded",
                {
                    accountAdded: manishWallet
                }
            );

            // making sure no account can be added as beneficiaries more than once.
            await expectRevert(
                instance.addBeneficiary(manishWallet, { from: sidWallet }),
                "Beneficiary already exists"
            );

        });

        it("Should only allow ammount to be transffered to the beneficiary account", async () => {
            // making sure we are not transfering funds to accounts that are not added to beneficiary
            await expectRevert(
                instance.transfer(accounts[3], 1, { from: sidWallet}),
                "It seems account doesnot exists"
            );

            // making sure we cannot transfer amount greater then account balance
            await expectRevert(
                instance.transfer(manishWallet, 10, { from: sidWallet}),
                "Don\'t have enough balance to make this transaction"
            );

            // making sure we can transfer amount to beneficiary account provided transfer amount is less then account balance
            const receipt = await instance.transfer(manishWallet, 1, { from: sidWallet});
            await expectEvent(
                receipt,
                "TransferSuccessfull",
                {
                    fromAddress: sidWallet,
                    toAddress: manishWallet,
                    amount: new BN(1)
                }
            );

            // making sure we are not transfering funds to accounts that are added to beneficiary but are not active
            await instance.updateAccountStatus(manishWallet, 2);
            await expectRevert(
                instance.transfer(manishWallet, 1, { from: sidWallet}),
                "It seems account is not active"
            );

        });

        it("Should only allow bank manager to get contract balance", async () => {
            await expectRevert(
                instance.getBankBalance({ from: manishWallet}),
                "Only bank manaker can access this functionality"
            );

            try {
                const contractBalance = await instance.getBankBalance();
                assert.equal(0, 0, "dfsdfsd");
            } catch(e) {
                assert.equal(0, 1, "Didn\'t get any contract balance");
            }
        });
    });
});