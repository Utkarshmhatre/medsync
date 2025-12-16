type RFIDData = {
  label: string
  date: string
  time: string
  cardUid: string
  rfidUid: string
}

type UserData = {
  [key: string]: string // cardUid: name
}

export class RFIDService {
  private static ws: WebSocket | null = null
  private static userData: UserData = {}

  static init() {
    this.loadUserData()
    this.connectWebSocket()
  }

  private static loadUserData() {
    const stored = localStorage.getItem('userData')
    if (stored) {
      this.userData = JSON.parse(stored)
    }
  }

  private static saveUserData() {
    localStorage.setItem('userData', JSON.stringify(this.userData))
  }

  private static connectWebSocket() {
    // In a real app, this would connect to your Python backend
    this.ws = new WebSocket('ws://localhost:8000')
    
    this.ws.onmessage = (event) => {
      const data: RFIDData = JSON.parse(event.data)
      this.handleRFIDData(data)
    }
  }

  private static handleRFIDData(data: RFIDData) {
    // Update user data if needed
    if (!(data.rfidUid in this.userData)) {
      this.userData[data.rfidUid] = data.label
      this.saveUserData()
    }

    // Dispatch event for real-time updates
    const event = new CustomEvent('rfidData', { detail: data })
    window.dispatchEvent(event)
  }

  static addUser(rfidUid: string, name: string) {
    this.userData[rfidUid] = name
    this.saveUserData()
  }

  static removeUser(rfidUid: string) {
    delete this.userData[rfidUid]
    this.saveUserData()
  }

  static renameUser(rfidUid: string, newName: string) {
    this.userData[rfidUid] = newName
    this.saveUserData()
  }

  static getUserName(rfidUid: string) {
    return this.userData[rfidUid] || 'Unknown'
  }
}

