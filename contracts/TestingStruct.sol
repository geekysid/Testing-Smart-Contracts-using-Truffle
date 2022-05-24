// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract TestingStruct {
    struct Student {
        string name;
        uint8 roll;
    }

    Student[] public students;
    address public teacher;

    constructor () {
        teacher = msg.sender;
    }

    // allowing only teacher to access certain functionality
    modifier isTeacher() {
        require(teacher == msg.sender, "Only teacher can access this functionality");
        _;
    }

    // to add student
    function addStudent(string memory _name, uint8 _roll) public isTeacher {
        students.push(Student ({
            name: _name,
            roll: _roll
        }));
    }

    // to update student name
    function updateStudent(string memory _name, uint8 _roll) public isTeacher {
        uint256 _index = getIndex(_roll);
        students[_index].name = _name;
    }

    // to remove student
    function removeStudent(uint8 _roll) public isTeacher {
        uint256 _index = getIndex(_roll);
        delete students[_index];
    }

    // to get student name
    function getStudentName(uint8 _roll) public view returns (string memory) {
        uint256 _index = getIndex(_roll);
        return students[_index].name;
    }

    // to get index of student in array
    function getIndex(uint8 _roll) public view returns (uint) {
        for (uint256 i=0; i<students.length; i++) {
            if (students[i].roll == _roll) {
                return i;
            }
        }
        revert("Student does not exists!!");
    }

    // to get total number of student
    function getStudentCount() public view returns (uint) {
        return students.length;
    }

}