const TestingStruct = artifacts.require("TestingStruct");

contract("TestingStruct", (accounts) => {
    let instance = null

    before( async () => {
        instance = await TestingStruct.deployed();
    });

    it("checking if deployer is set as teacher", async () => {
        const teacher = await instance.teacher();
        assert.equal(teacher, accounts[0], `Teacher = ${teacher}  || accounts[0] = ${accounts[0]}`);
    });

    it("Should have 0 students", async () => {
        const studentCount = await instance.getStudentCount();
        assert.equal(studentCount.toNumber(), 0, `There are ${studentCount.toNumber()} students`);
    });

    it("Should have added student with name Siddhant and roll 1", async () => {
        await instance.addStudent("Siddhant", 1);
        const name = await instance.getStudentName(1);
        assert.equal(name, "Siddhant", `Student name is ${name} and not Siddhant`);
    });

    it("Should have 2 students after adding one more", async () => {
        await instance.addStudent("Shilpa", 2);
        const studentCount = await instance.getStudentCount();
        assert.equal(studentCount.toNumber(), 2, `Student count is ${studentCount.toNumber()} and not 1`);
    });

    it("Should return error if a student is searched with roll not existing", async () => {
        try{
            await instance.getIndex(3);
            assert(false);
        } catch (e){
            assert(e.message.includes("Student does not exists!!"));
        }
    });

    it("Should return Shilpa if a student is searched with roll # 2", async () => {
        const name = await instance.getStudentName(2);
        assert("Shilpa", name, `Student @ roll # 2 is ${name} and not Shilpa`);
    });

    it("Should update name to SIDDHANT SHAH for roll # 1", async () => {
        await instance.updateStudent("SIDDHANT SHAH", 1);
        const name = instance.getStudentName(1);
        assert("SIDDHANT SHAH", name, `Student @ roll # 1 is ${name} and not SIDDHANT SHAH`);
    });

    it("Should remove roll # 1", async () => {
        await instance.removeStudent(1);
        try{
            await instance.getStudentName(1);
            assert(false);
        } catch(e) {
            assert(e.message.includes("Student does not exists!!"));
        }
    });

});