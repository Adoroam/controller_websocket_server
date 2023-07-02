import select, { Options } from '@utility_belt/cli_select'
import * as HID from 'node-hid'
import * as WebSocket from 'ws'

const { WebSocketServer } = WebSocket
const wss = new WebSocketServer({ port: 5000 })

let device_serial = ''
let connection = true

const createInitializer = (serial: string) => {
  const devices = HID.devices()
  const device_by_serial = serial =>
    devices.find(({ serialNumber }) => serialNumber === serial) as HID.Device
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
      wss.clients.forEach(client => {
        client.readyState === WebSocket.OPEN && client.send(arr.join(','))
      })
    })

    Gamepad.on('error', (error) => {
      console.log('gamepad lost connection, attempting to reconnect...')
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

const select_callback = (prod:string) => {
  const devices = HID.devices()
  device_serial = devices.find(({ product }) => product === prod)?.serialNumber
  createGamepad(device_serial)
}
// @ts-ignore
const option_list = () => HID.devices().reduce((ac, { product }) =>
// @ts-ignore
  product === undefined || ac.includes(product) ? ac : [...ac, product], []) as string[]

const opts: Options = {
  question: 'select your device',
  options: option_list()
}

select(opts, select_callback)

process.on('SIGINT', () => {
  clearInterval(loop)
  wss.close()
  process.exit(0)
})