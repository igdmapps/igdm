const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getPlugin('interface.object');
const Client = require('instagram-private-api').V1;
const td = require('testdouble');

registerSuite('utils', () => {
  let fs; let app; let utils; let Helpers;
  const fakePath = 'C:\\SomeFakeFolder';
  const electronMock = {
    app: {
      getPath: () => fakePath,
    },
  };

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

      guessUsername: {
        whenFsAccessReturnsName: () => {
          // we don't want to create the directory so assume it's there
          td.when(fs.existsSync(`${fakePath}/session-cookie`)).thenReturn(true);
          td.when(fs.readdirSync(`${fakePath}/session-cookie`)).thenReturn(['testUser.json']);

          const userName = utils.guessUsername();

          assert.equal(userName, 'testUser');
        },
        whenNoPrevUserNameReturnsEmpty: () => {
          td.when(fs.existsSync(`${fakePath}/session-cookie`)).thenReturn(true);
          td.when(fs.readdirSync(`${fakePath}/session-cookie`)).thenReturn([]);

          const userName = utils.guessUsername();

          assert.equal(userName, undefined);
        },
        whenNoFsAccessReturnsEmpty: () => {
          td.when(fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK)).thenThrow(new Error('Something went awry'));

          const userName = utils.guessUsername();

          assert.equal(userName, undefined);
        },
      },

      getCookieStorage: {
        whenFsAccessAndFileNameReturnsNewFileStorage: () => {
          // TODO: I have no idea how to properly handle this as we'd have to mock touch. Maybe provide fake data?
        },
        whenNoFilePathAndNoUserNameReturnsEmpty: () => {
          td.when(fs.existsSync(`${fakePath}/session-cookie`)).thenReturn(true);
          td.when(fs.accessSync(`${fakePath}/session-cookie`)).thenReturn(true);
          td.when(fs.readdirSync(`${fakePath}/session-cookie`)).thenReturn([]);

          const storage = utils.guessUsername();
          
          // TODO: Is this expected behaviour? This should be handled just in case right?
          assert.equal(storage, undefined);
        },
        whenNoFsAccessReturnsNewMemoryStorage: () => {
          td.when(fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK)).thenThrow(new Error('Something went awry'));

          const storage = utils.getCookieStorage();

          assert.equal(storage instanceof Client.CookieMemoryStorage, true);
        },
      },

      getDevice: {
        whenNoUserNameReturnsEmpty: () => {
          td.when(fs.existsSync(`${fakePath}/session-cookie`)).thenReturn(true);
          td.when(fs.readdirSync(`${fakePath}/session-cookie`)).thenReturn([]);

          const device = utils.getDevice();
          
          assert.equal(device, undefined);
        },
        whenUserNameReturnsNewDevice: () => {
          td.when(fs.existsSync(`${fakePath}/session-cookie`)).thenReturn(true);

          const device = utils.getDevice('testDevice');
          
          assert.equal(device instanceof Client.Device, true);
        },
      },
    },
  };
});
