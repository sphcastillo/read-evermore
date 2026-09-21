import 'server-only'
import {createBookSearch} from './open-library'

export const searchBooks = createBookSearch({contactEmail: process.env.OPEN_LIBRARY_CONTACT_EMAIL})
