import { navigateTo } from '../utils/router.js'

const AUTH_TOKEN_KEY = 'dicoding_story_token'
const USER_KEY = 'dicoding_story_user'

export async function register(name, email, password) {
  try {
    const response = await fetch('https://story-api.dicoding.dev/v1/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Registration failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export async function login(email, password) {
  try {
    const response = await fetch('https://story-api.dicoding.dev/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }
    
    const data = await response.json()
    localStorage.setItem(AUTH_TOKEN_KEY, data.loginResult.token)
    localStorage.setItem(USER_KEY, JSON.stringify({
      userId: data.loginResult.userId,
      name: data.loginResult.name
    }))
    
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getCurrentUser() {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export async function checkAuth() {
  const token = getAuthToken()
  if (!token) return false
  return true
}