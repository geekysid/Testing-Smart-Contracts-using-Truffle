const ArraySmartContract = artifacts.require('ArraySmartContract');

contract("ArraySmartContract", () => {
    let instance;

    before(async () => {
        instance = await ArraySmartContract.deployed();
    });

    it("Array should be empty on deployment", async () => {
        const arrayLength = await instance.getLength();
        assert(arrayLength.toNumber() === 0);
    });

    it("should successfully add element to array", async () => {
        assert.ok(instance);
        await instance.addID(1);
        const value = await instance.getID(0);
        assert(value.toNumber() === 1);
    });

    it("Should get entire array", async () => {
        let arr = await instance.getAll();
        arr = arr.map(id => id.toNumber());
        // assert(arr[0] === 1);
        assert.deepEqual(arr, [1]);
    });
});