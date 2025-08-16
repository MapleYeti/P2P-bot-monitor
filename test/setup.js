const path = require('path')
const { Application } = require('spectron')

const appPath = () => {
  switch (process.platform) {
    case 'darwin':
      return path.join(__dirname, '..', '.tmp', 'mac', 'DreamBotBotMonitor.app', 'Contents', 'MacOS', 'DreamBotBotMonitor')
    case 'linux':
      return path.join(__dirname, '..', '.tmp', 'linux', 'DreamBotBotMonitor')
    case 'win32':
      return path.join(__dirname, '..', '.tmp', 'win-unpacked', 'DreamBotBotMonitor.exe')
    default:
      throw Error(`Unsupported platform ${process.platform}`)
  }
}
global.app = new Application({ path: appPath() })
