const AutoLaunch = require('auto-launch');

const igdmAutoLauncher = new AutoLaunch({
  name: 'IGdm'
});

const enableAutoLaunch = () => {
  igdmAutoLauncher.enable();
};

const disableAutoLaunch = () => {
  igdmAutoLauncher.disable();
};

const autoLaunchStatus = () => {
  return new Promise((resolve, reject) => {
    igdmAutoLauncher.isEnabled()
      .then(resolve)
      .catch(reject);
  });
};

exports.autoLaunchStatus = autoLaunchStatus;

exports.toggleAutoLaunch = () => {
  autoLaunchStatus().then((status) => {
    if (status) {
      disableAutoLaunch();
    } else {
      enableAutoLaunch();
    }
  });
};
