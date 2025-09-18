import { 
  initializeApp, 
  getApps, 
  cert, 
  ServiceAccount,
  App 
} from 'firebase-admin/app'

// Service account interface
interface FirebaseAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

// Get configuration from environment variables
function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL  
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin configuration. Please check your environment variables:\n' +
      '- FIREBASE_ADMIN_PROJECT_ID\n' +
      '- FIREBASE_ADMIN_CLIENT_EMAIL\n' + 
      '- FIREBASE_ADMIN_PRIVATE_KEY'
    )
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'), 
  }
}

// Initialize Firebase Admin App (Singleton Pattern)
function initializeFirebaseAdminApp(): App {
  const existingApps = getApps()
  
  // Return existing app if already initialized
  if (existingApps.length > 0) {
    return existingApps[0]
  }

  try {
    const config = getFirebaseAdminConfig()
    
    const serviceAccount: ServiceAccount = {
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: config.projectId,
      storageBucket: `${config.projectId}.appspot.com`,
    })

    console.log(' Firebase Admin initialized successfully')
    return app

  } catch (error) {
    console.error(' Firebase Admin initialization failed:', error)
    throw new Error(`Firebase Admin initialization failed: ${error}`)
  }
}

// Export the initialized app
export const firebaseAdminApp = initializeFirebaseAdminApp()
