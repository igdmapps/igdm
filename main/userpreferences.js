const Store = require('./storage');

const userPreferences = new Store({
  configName: 'user-preferences',
  defaults: {
    AUTO_UPDATE : true,
  },
});

const autoUpdatePreference = {
  autoUpdateStatus: userPreferences.get('AUTO_UPDATE'),
  toggleAutoUpdate: function () {
    const status = userPreferences.get('AUTO_UPDATE');
    userPreferences.set('AUTO_UPDATE', !status);
  }
};

module.exports = {
  autoUpdatePreference,
};
