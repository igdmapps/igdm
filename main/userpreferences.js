const Store = require('./storage');

const userPreferences = new Store({
  configName: 'user-preferences',
  defaults: {
    AUTO_UPDATE : true,
    TIME_FORMAT_24H: true
  },
});

const autoUpdatePreference = {
  autoUpdateStatus: userPreferences.get('AUTO_UPDATE'),
  toggleAutoUpdate: function () {
    const status = userPreferences.get('AUTO_UPDATE');
    userPreferences.set('AUTO_UPDATE', !status);
  }
};

const timeFormatPreference = {
  timeFormat24h: userPreferences.get('TIME_FORMAT_24H'),
  toggleTimeFormat: function () {
    const status = userPreferences.get('TIME_FORMAT_24H');
    userPreferences.set('TIME_FORMAT_24H', !status);
  }
};

module.exports = {
  autoUpdatePreference,
  timeFormatPreference
};
