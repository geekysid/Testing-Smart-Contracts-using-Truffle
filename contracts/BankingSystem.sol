// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/* @title Banking System Simulator */
/* @author Siddhant Shah */
contract BankingSystem {
    enum TransactionStatus { Failed, Success }          // status for trasactions
    enum AccountStatus { Active, OnHold, Deactive }     // status for accounts

    // Transaction Objectl
    struct Transaction {
        address sender;             // addres of person who is sending the fund
        address receiver;           // addres of person to whome fund is being send
        uint256 amount;             // amount tansfered
        bytes32 transactionID;      // transaction ID
        uint256 timestamp;          // time of transaction
        TransactionStatus status;   // status of transaction
    }

    // Account oject
    struct Account {
        address payable owner;          // address of person to whome account belong
        address[] beneficiaries;        // list of address of all beneficiaries
        bytes32[] debitTransactions;    // list of all IDs of all debit transaction
        bytes32[] creditTransactions;   // list of all IDs of all credit transaction
        uint256 balance;                // total balanceof account
        AccountStatus status;           // status of accounts
    }

    mapping(address => Account) accounts;           // account object mapped to address of owner
    mapping(bytes32 => Transaction) transactions;   // transaction oject mapped to transaction ID
    bytes32[] transactionIDS;                       // list of all transaction IDs
    address immutable public bankManager;                            // address of bank manager
    string public branchCode;                              // code of the branch
    string public bankCode;                                // code of the bank

    constructor(string memory _bankCode, string memory _branchCode) {
        bankManager = msg.sender;       // settting bank manager to address through which Smart contract is deployed
        branchCode = _branchCode;       // setting code of branch
        bankCode = _bankCode;           // setting code of BANK
    }

    event AccountCreated(address accountAddress, uint256 timeOfTransaction);
    event AccountStatusUpdated(address accountAddress, AccountStatus newStatus);
    event AmountDeposited(uint256 amount, bytes32 transactionId, uint256 timeOfTransaction);
    event AmountWithdrawal(uint256 amount, bytes32 transactionId, uint256 timeOfTransaction);
    event BeneficiaryAdded(address accountAdded);
    event TransferSuccessfull(address fromAddress, address toAddress, bytes32 transactionID, uint256 amount, uint256 timeOfTransaction);

    /* @title MODIFIER to make sure function is called by bank manager */
    modifier onlyManager {
        require(bankManager == msg.sender, "Only bank manaker can access this functionality");
        _;
    }

    // MODIFIER to make sure account exists for a given address
    modifier accountExists(address _owner) {
        require(accounts[_owner].owner != address(0), "It seems account doesnot exists");
        _;
    }

    // MODIFIER to make sure account does not exists for a given address
    modifier hasNoAccount(address _owner) {
        require(accounts[_owner].owner == address(0), "It seems account already exists");
        _;
    }

    // MODIFIER to make sure account in question is active
    modifier isAccountActive(address _owner) {
        require(accounts[_owner].status == AccountStatus.Active, "It seems account is not active");
        _;
    }

    // MODIFIER to make sure account is accessed by the owner only
    modifier onlyAccountOwner {
        require(accounts[msg.sender].owner == msg.sender, "Only bank manaker can access this functionality");
        _;
    }

    // MODIFIER to make sure account is accessed by the owner only
    modifier onlyBankManagerOrAccountOwner(address _address) {
        require(accounts[_address].owner == _address || bankManager == _address, "Only bank manager or account owner can access this functionality");
        _;
    }

    // MODIFIER to make sure account has enough balance
    modifier hasEnoughBalance(address _accountAddress, uint _amount) {
        require(accounts[_accountAddress].balance >= (_amount * 1 ether), "Don\'t have enough balance to make this transaction");
        _;
    }

    /**
        * @dev UTILITY FUNCTION to create a new transaction object
        * @param _sender Address of the person sending fund.
        * @param _receiver Address of the person receiving fund.
        * @param _amount Total amount being transfered.
        * @return _id Trasaction ID.
    */
    function createTransactionUtil(address _sender, address _receiver, uint256 _amount) internal returns(bytes32 _id){
        // getting transaction ID depening on number of transactions created before alog with bank code and branch code
        _id = bytes32(abi.encodePacked(bankCode, branchCode, '--', transactionIDS.length+1));
        transactionIDS.push(_id);     // adding transaction id to the array that contain transaction IDs

        // creating an object of transaction and mapping it to transactionID
        transactions[_id] = Transaction({
            sender: _sender,
            receiver: _receiver,
            amount: _amount,
            timestamp: block.timestamp,
            status: TransactionStatus.Success,
            transactionID: _id
        });
    }

    /**
        * @dev UTILITY FUNCTION to check if an address is added to an account as a beneficiary
        * @param _beneficiaryAddress Address of the beneficiary.
        * @return bneficiaryExistsFlag Returns true if exists else returns false.
    */
    function checkBeneficiaryExistsUtil(address _beneficiaryAddress) internal view returns(bool bneficiaryExistsFlag){
        address[] memory _beneficiaries = accounts[msg.sender].beneficiaries;

        // if no beneficiary is present in account then return false
        if(_beneficiaries.length == 0) {
            bneficiaryExistsFlag = false;
        } else {
            // looping thourgh all beneficiaries iadded n the account
            for(uint i=0; i<_beneficiaries.length; i++) {
                if (_beneficiaries[i] == _beneficiaryAddress) {
                    bneficiaryExistsFlag = true;
                }
            }
        }
    }

    /**
        * @dev FUNCTION used by bank manager to Create Account
        * @param _owner Address of the person whose account is being created.
    */
    function createAccount(address _owner) external onlyManager hasNoAccount(_owner) {
        Account storage account = accounts[_owner];
        account.owner = payable(_owner);
        account.status = AccountStatus.OnHold;  // seeting initial status of the account as On Hold
        emit AccountCreated(_owner, block.timestamp);
    }

    /**
        * @dev FUNCTION used by bank manager or account owner to get status of Account
        * @param _accountAddress Address of the person whose account status is to be determined.
        * @return _status Status of the account.
    */
    function getAccountStatus(address _accountAddress) external view accountExists(_accountAddress) onlyBankManagerOrAccountOwner(_accountAddress) returns (AccountStatus _status) {
        _status = accounts[_accountAddress].status;
    }

    /**
        * @dev FUNCTION used by bank manager to change status of Account
        * @param _accountAddress Address of the person whose account status is to be changed.
        * @param _status New status of the account.
    */
    function updateAccountStatus(address _accountAddress, AccountStatus _status) external onlyManager accountExists(_accountAddress) {
        require(accounts[_accountAddress].status != _status, "Account status is already as desired");       // if account has same status as provide by bank manager
        accounts[_accountAddress].status = _status;
        emit AccountStatusUpdated(_accountAddress, _status);
    }

    /**
        * @dev FUNCTION used by account owner to deposit funds in Accounts
        * @return _id ID of the transaction.
    */
    function deposit() external payable accountExists(msg.sender) onlyAccountOwner isAccountActive(msg.sender) returns (bytes32 _id){
        _id = createTransactionUtil(address(0), msg.sender, msg.value);   // create a transaction object
        accounts[msg.sender].balance += msg.value;                        // increase balance of account
        accounts[msg.sender].creditTransactions.push(_id);              // add transaction ID to the credit transaction list
        emit AmountDeposited(msg.value, _id, block.timestamp);
    }

    /**
        * @dev FUNCTION used by account owner to withdraw funds from Account
        * @param _amount Ammount that is being withdrawn from account.
    */
    function withdraw(uint _amount) external payable accountExists(msg.sender) onlyAccountOwner isAccountActive(msg.sender) hasEnoughBalance(msg.sender, _amount) {
        _amount = _amount * 1 ether;
        bytes32 _id = createTransactionUtil(msg.sender, address(0), _amount);   // create a transaction object
        accounts[msg.sender].balance -= _amount;                                // decrease balance of account
        accounts[msg.sender].debitTransactions.push(_id);                       // add transaction ID to the debit transaction list
        payable(msg.sender).transfer(_amount);                                  // transfering funds from contract to user address
        emit AmountWithdrawal((_amount / 1 ether), _id, block.timestamp);
    }

    /**
        * @dev FUNCTION used by account owner to check if address is added as beneficiary
        * @param _beneficiaryAddress Address of account that is to be added as beneficiary.
        * @return _beneficiaryExistsFlag Returns true if beneficiary exists else false
    */
    function beneficiaryExists(address _beneficiaryAddress) external view accountExists(msg.sender) accountExists(_beneficiaryAddress) onlyAccountOwner isAccountActive(msg.sender) returns(bool _beneficiaryExistsFlag) {
        _beneficiaryExistsFlag = checkBeneficiaryExistsUtil(_beneficiaryAddress);
    }

    /**
        * @dev FUNCTION used by account owner to add new beneficiary to the account
        * @param _beneficiaryAddress Address of account that is to be added as beneficiary.
    */
    function addBeneficiary(address _beneficiaryAddress) external accountExists(msg.sender) accountExists(_beneficiaryAddress) onlyAccountOwner isAccountActive(msg.sender) {
        require(!checkBeneficiaryExistsUtil(_beneficiaryAddress), "Beneficiary already exists");
        accounts[msg.sender].beneficiaries.push(_beneficiaryAddress);
        emit BeneficiaryAdded(_beneficiaryAddress);
    }

    /**
        * @dev FUNCTION used by account owner to transfer funds to other accounts
        * @param _beneficiaryAddress Address of account to which funds are to be transfered.
        * @param _amount Ammount of the funds being transfered.
    */
    function transfer(address _beneficiaryAddress, uint256 _amount) payable external accountExists(msg.sender) accountExists(_beneficiaryAddress) onlyAccountOwner isAccountActive(msg.sender) hasEnoughBalance(msg.sender, _amount) {
        _amount = _amount * 1 ether;
        bytes32 _id = createTransactionUtil(msg.sender, _beneficiaryAddress, _amount);  // create a transaction object
        accounts[msg.sender].balance -= _amount;                                        // decrease balance of account that is sending funds
        accounts[_beneficiaryAddress].balance += _amount;                               // increase balance of account that is receiving funds
        accounts[msg.sender].debitTransactions.push(_id);                               // add transaction ID to the debit transaction list of account that is sending funds
        accounts[_beneficiaryAddress].creditTransactions.push(_id);                     // add transaction ID to the credit transaction list of account that is receiving funds
        emit TransferSuccessfull(msg.sender, _beneficiaryAddress, _id, (_amount / 1 ether), block.timestamp);
    }

    /**
        * @dev FUNCTION used by account owner to get balance of account
        * @return _balance Balance of the account.
    */
    function getBalance() external view accountExists(msg.sender) isAccountActive(msg.sender) returns(uint256 _balance) {
        require(msg.sender == accounts[msg.sender].owner, "Only account owner or bank manager can access this functionality");
        _balance = accounts[msg.sender].balance;
    }

    /**
        * @dev FUNCTION used by bank manager to get total ether available in bank
        * @return _bankBalance Number of eths in contract.
    */
    function getBankBalance() external view onlyManager returns (uint256 _bankBalance) {
        _bankBalance = address(this).balance / 1 ether;
    }
}
