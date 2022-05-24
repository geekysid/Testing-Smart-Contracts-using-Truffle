// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract ArraySmartContract{
    uint[] ids;

    function addID(uint _id) public {
        ids.push(_id);
    }

    function getID(uint _index) public view returns (uint){
        return ids[_index];
    }

    function getLength() public view returns (uint) {
        return ids.length;
    }

    function getAll() public view returns(uint[] memory) {
        return ids;
    }
}