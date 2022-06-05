import * as HID from 'node-hid'
import * as WebSocket from 'ws'
const { WebSocketServer } = WebSocket

const stadia_serial = '9C030YCAC6LK66'
const frsky_serial = '5D8443913534'

const wss = new WebSocketServer({ port: 5000 })

wss.on('listening', () => {
  console.log('websocket server listening')
})

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

const createGamepad = () => {
  try {
    const Gamepad = createInitializer(stadia_serial)
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
      console.log(error)
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

const loop = setInterval(() => !connection && createGamepad(), 3000)

// startup
createGamepad()

process.on('SIGINT', () => {
  clearInterval(loop)
  wss.close()
  process.exit(0)
})
