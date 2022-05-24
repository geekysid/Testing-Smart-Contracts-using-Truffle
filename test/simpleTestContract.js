const SimpleTestContract = artifacts.require("SimpleTestContract");

contract('SimpleTestContract',() => {
    it('Should deploy smart contact', async () => {
        const instance = await SimpleTestContract.deployed();
        const addr = instance.address;
        console.log(`Contract Address: ${addr}`)
        assert(addr != '');

    })
});