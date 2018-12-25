const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getPlugin('interface.object');

registerSuite('sample', {
    'tests': {
        'create new'() {
            assert.equal(1, 1, "Numbers don't equal");
        }
    }
});