import select from './select'
import * as HID from 'node-hid'
import * as WebSocket from 'ws'
const { WebSocketServer } = WebSocket

let device_serial = ''

const wss = new WebSocketServer({ port: 5000 })

let connection = true

const createInitializer = (serial) => {
  const devices = HID.devices()
  // UNCOMMENT TO SEE DEVICE NAMES AND SERIALNUMBERS
  // const device_list = devices.map(({ serialNumber, product }) => ({ serialNumber, product }))
  // console.log(device_list)
  const device_by_serial = serial =>
    devices.find(({ serialNumber }) => serialNumber === serial)

  const init_controller = serial => {
    const { vendorId, productId } = device_by_serial(serial)
    return new HID.HID(vendorId, productId)
  }
  return init_controller(serial)
}

const createGamepad = (device_serial) => {
  try {
    const Gamepad = createInitializer(device_serial)
    console.log('gamepad connected')
    connection = true

    Gamepad.on('data', (buffer: Buffer) => {
      const arr = Array.from(buffer)
      // console.log(arr.join(','))
      wss.clients.forEach(client => {
        client.readyState === WebSocket.OPEN && client.send(arr.join(','))
      })
    })

    Gamepad.on('error', (error) => {
      // console.log(error)
      console.log('gamepad lost connection, closing...')
      connection = false
      Gamepad.close()
    })
  } catch (error) {
    if (connection) {
      console.log('no gamepad detected')
      connection = false
    }
  }
}

const loop = setInterval(() => !connection && createGamepad(device_serial), 3000)

select({
  question: 'select your device',
  options: HID.devices().reduce((ac, {product}) => product === undefined || ac.includes(product) ? ac : [...ac, product],[]),
}).then(productName => {
  const devices = HID.devices()
  device_serial = devices.find(({product}) => product===productName).serialNumber
  createGamepad(device_serial)
})

process.on('SIGINT', () => {
  clearInterval(loop)
  wss.close()
  process.exit(0)
})