const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getPlugin('interface.object');
const td = require('testdouble');

const electronMock = {
  app: {
    getPath: () => 'C:\\SomeFakeFolder',
  },
};

registerSuite('utils', () => {
  let fs; let app; let utils;
  return {
    beforeEach() {
      app = td.replace('electron', electronMock).app;
      fs = td.replace('fs');
      utils = require('../main/utils');
    },

    afterEach() {
      td.reset();
    },

    tests: {
      canUseFileStorage: {
        whenPathExistsReturnsTrue: () => {
          td.when(fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK)).thenReturn(true);

          const canUseFileStorage = utils.canUseFileStorage();

          assert.equal(canUseFileStorage, true);
        },
        whenPathRestrictedReturnsFalse: () => {
          td.when(fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK)).thenThrow(new Error('Something went awry'));

          const canUseFileStorage = utils.canUseFileStorage();

          assert.equal(canUseFileStorage, false);
        },
      },
    },
  };
});
