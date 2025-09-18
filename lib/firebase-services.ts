// lib/firebase-services.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  UserCredential,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  DocumentData
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { CreateUser, User } from '@/types'
import type { AuthUser } from '@/types/auth'
import { TokenManager } from './auth/token-manager'

export class FirebaseAuthService {
  private static googleProvider = new GoogleAuthProvider()

  // Helper function to convert Firebase user to AuthUser
  private static async convertToAuthUser(user: FirebaseUser | null): Promise<AuthUser | null> {
    if (!user) return null

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const customData = userDoc.exists() ? (userDoc.data() as User) : null

      return {
        ...user,
        customData
      } as AuthUser
    } catch (error) {
      console.error('Error converting to AuthUser:', error)
      return {
        ...user,
        customData: null
      } as AuthUser
    }
  }

  // Email/Password Sign In
  static async signInWithEmailPassword(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Get ID token for API authentication
      const idToken = await userCredential.user.getIdToken()
      
      // Store token
      TokenManager.setToken(idToken)
      
      // Update last login time
      const userDocRef = doc(db, 'users', userCredential.user.uid)
      await updateDoc(userDocRef, {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch(() => {
        // Ignore error if user document doesn't exist yet
      })
      
      return userCredential
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(this.getAuthErrorMessage(error.code))
    }
  }

  // Email/Password Sign Up
  static async signUpWithEmailPassword(
    email: string, 
    password: string, 
    name: string
  ): Promise<UserCredential> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with name
      await updateProfile(user, { displayName: name })

      // Send email verification
      await sendEmailVerification(user)

      // Create user document in Firestore
      const userData: CreateUser = {
        email: user.email!,
        name: name,
        phone: '',
        avatar: '',
        addresses: [],
        preferences: {
          notifications: true,
          theme: 'light',
          language: 'en',
          currency: 'INR'
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        emailVerified: false,
        profileCompleted: false,
        authProvider: 'email'
      })

      // Get ID token
      const idToken = await user.getIdToken()
      TokenManager.setToken(idToken)

      return userCredential
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(this.getAuthErrorMessage(error.code))
    }
  }

  // Google Sign In
  static async signInWithGoogle(): Promise<UserCredential> {
    try {
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      })

      const userCredential = await signInWithPopup(auth, this.googleProvider)
      const user = userCredential.user

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      const currentTime = new Date().toISOString()

      if (!userDoc.exists()) {
        // Create new user document for Google user
        const userData: CreateUser = {
          email: user.email!,
          name: user.displayName || '',
          phone: '',
          avatar: user.photoURL || '',
          addresses: [],
          preferences: {
            notifications: true,
            theme: 'light',
            language: 'en',
            currency: 'INR'
          }
        }

        await setDoc(userDocRef, {
          ...userData,
          createdAt: currentTime,
          updatedAt: currentTime,
          lastLoginAt: currentTime,
          emailVerified: user.emailVerified,
          profileCompleted: false,
          authProvider: 'google'
        })
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          updatedAt: currentTime,
          lastLoginAt: currentTime,
          // Update avatar if Google photo has changed
          avatar: user.photoURL || userDoc.data()?.avatar || '',
          // Update name if Google display name has changed
          name: user.displayName || userDoc.data()?.name || '',
          // Update email verification status
          emailVerified: user.emailVerified
        })
      }

      // Get ID token
      const idToken = await user.getIdToken()
      TokenManager.setToken(idToken)

      return userCredential
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw new Error(this.getAuthErrorMessage(error.code))
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      // Update last logout time before signing out
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userDocRef, {
          lastLogoutAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch(() => {
          // Ignore error if user document doesn't exist
        })
      }

      await signOut(auth)
      TokenManager.clearAuthData()
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error('Failed to sign out. Please try again.')
    }
  }

  // Get current user with custom data
  static async getCurrentUserWithData(): Promise<AuthUser | null> {
    const user = auth.currentUser
    if (!user) return null

    return await this.convertToAuthUser(user)
  }

  // Auth state listener
  static onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Refresh token if needed
          if (TokenManager.needsRefresh()) {
            const newToken = await user.getIdToken(true)
            TokenManager.setToken(newToken)
          }

          // Update last activity
          TokenManager.updateLastActivity()

          // Get user with custom data and convert to AuthUser
          const authUser = await this.convertToAuthUser(user)
          callback(authUser)
        } catch (error) {
          console.error('Error in auth state change:', error)
          // Fallback: create AuthUser with null customData
          const authUser: AuthUser = {
            ...user,
            customData: null
          }
          callback(authUser)
        }
      } else {
        callback(null)
      }
    })
  }

  // Update user profile
  static async updateUserProfile(updates: {
    name?: string
    phone?: string
    avatar?: string
    preferences?: any
  }): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')

    try {
      const userDocRef = doc(db, 'users', user.uid)
      
      // Update Firebase Auth profile if name changed
      if (updates.name && updates.name !== user.displayName) {
        await updateProfile(user, { displayName: updates.name })
      }

      // Update Firestore document
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        profileCompleted: true
      })

    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error('Failed to update profile. Please try again.')
    }
  }

  // Get auth error messages
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.'
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups and try again.'
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.'
      case 'auth/invalid-credential':
        return 'The provided credentials are invalid or have expired.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }
}
