/* eslint-disable camelcase */
import firebase from 'firebase-admin'
import dotenv from 'dotenv'
dotenv.config()

// Firebase certificate data
const firebaseCert = {
  type: process.env.FIRESTORE_TYPE,
  project_id: process.env.FIRESTORE_PROJECT_ID,
  private_key_id: process.env.FIRESTORE_PRIVATE_KEY_ID,
  private_key: process.env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIRESTORE_CLIENT_EMAIL,
  client_id: process.env.FIRESTORE_CLIENT_ID,
  auth_uri: process.env.FIRESTORE_AUTH_URI,
  token_uri: process.env.FIRESTORE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIRESTORE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIRESTORE_CLIENT_X509_CERT_URL
}

// Initialize Firebase
firebase.initializeApp({
  credential: firebase.credential.cert(firebaseCert)
})

// Get database
const db = firebase.firestore()

// Increment/Decrement Field value
const increment = n => firebase.firestore.FieldValue.increment(n || 1)
const decrement = n => firebase.firestore.FieldValue.decrement(n || 1)

/**
 * Get firebase field
 * @param {String} feature BOT Feature/Section
 * @param {String} table Feature Table
 * @param {String} field Feature field
 * @returns Firebase field
 */
const getField = (feature, table, field) => {
  const section = db.collection('discordBOT').doc(feature)
  if (!table && !field) return section
  else if (table && !field) return section.collection(table)
  else if (table && field) return section.collection(table).doc(field)
}

/**
 * Firebase DB - Get Data
 * @param {String} feature BOT Feature/Section
 * @param {String} table Feature Table
 * @param {String} field Feature field
 * @param {String} filter options Filter options
 * @return {*} field data
 */
const get = async (feature, table, field, options) => {
  let value = getField(feature, table, field)
  if (options?.where) value = value.where(options?.where?.field, options?.where?.compare ?? '==', options?.where?.value)
  if (options?.orderBy) value = value.orderBy(options?.orderBy?.field, options?.orderBy?.order ?? 'desc')
  if (options?.limit) value = value.limit(options?.limit)
  value = await value.get()
  return value.data ? value.data() : value
}

/**
 * Firebase DB - Set data
 * @param {String} feature BOT Feature/Section
 * @param {String} table Feature Table
 * @param {String} field Feature field
 * @param {*} data Field data
 */
const set = (feature, table, field, data) => {
  const value = getField(feature, table, field)
  return new Promise(resolve => value.set(data, { merge: true }).then(() => resolve()))
}

/**
 * Firebase DB - Delete document
 * @param {String} feature BOT Feature/Section
 * @param {String} table Feature Table
 * @param {String} field Feature field
 */
const del = (feature, table, field) => {
  const value = getField(feature, table, field)
  return new Promise((resolve, reject) =>
    value
      .delete()
      .then(() => resolve())
      .catch(error => reject(error))
  )
}

// Export DataBase
export default {
  increment,
  decrement,
  set,
  get,
  del
}
