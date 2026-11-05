/**
 * Universal Multi-Device Thermal Printer Connectivity Helper
 * Supports: Mobile (Android/iOS), Tablet, iPad, Laptop & Desktop PC
 */

export function getDeviceInfo() {
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isMobile = /Mobi|Android/i.test(ua) || isIOS
  const isTablet = isIPad || (isAndroid && !/Mobile/.test(ua))

  let deviceType = 'Desktop / Laptop PC'
  if (isIPad) deviceType = 'Apple iPad'
  else if (isIOS) deviceType = 'iPhone'
  else if (isTablet) deviceType = 'Android Tablet'
  else if (isMobile) deviceType = 'Android Mobile'

  return {
    isIOS,
    isIPad,
    isAndroid,
    isMobile,
    isTablet,
    deviceType,
    supportsBluetooth: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    supportsSerial: typeof navigator !== 'undefined' && 'serial' in navigator
  }
}

/**
 * Universal System Print (100% device compatibility)
 * Triggers standard browser/system print dialog with zero-margin thermal roll styling.
 */
export function printReceipt() {
  return new Promise((resolve) => {
    setTimeout(() => {
      window.print()
      resolve(true)
    }, 120)
  })
}

/**
 * Direct Web Bluetooth Pairing (Android Chrome, Windows, Mac)
 * Pairs directly with portable 58mm / 80mm wireless Bluetooth thermal printers.
 */
export async function connectBluetoothPrinter() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported on this browser. Use system print instead.')
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service UUID
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    })

    if (device.gatt) {
      await device.gatt.connect()
    }

    return {
      success: true,
      deviceName: device.name || 'Bluetooth Thermal Printer',
      deviceId: device.id
    }
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('Bluetooth device selection was cancelled.')
    }
    throw err
  }
}

/**
 * Direct Web Serial Pairing (Desktop Chrome / Edge on Windows, Mac, Linux)
 * Connects directly to USB-Serial thermal POS printers.
 */
export async function connectUsbSerialPrinter(baudRate = 9600) {
  if (!navigator.serial) {
    throw new Error('Web Serial is only supported on Desktop Chrome/Edge.')
  }

  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate })
    return {
      success: true,
      port
    }
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('USB device selection was cancelled.')
    }
    throw err
  }
}
