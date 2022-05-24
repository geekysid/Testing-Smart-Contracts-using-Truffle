const HelloWorldContract = artifacts.require("HelloWorld");

contract("HelloWorldContract", () => {
    it("Checking is message was set correctly by contructor", async () => {
        const instance = await HelloWorldContract.deployed();
        const message = await instance.message();
        assert(message == "Message set by constructor");
    });

    it("Checking if messages is set by function call", async () => {
        const instance = await HelloWorldContract.deployed();
        await instance.setMessage("Hello World set by function call");
        const message = await instance.message();
        assert(message == "Hello World set by function call");
    });
});