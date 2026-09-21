import {redirect} from 'next/navigation'

export default function ReleasesIndex() {
  redirect('/releases/this-week')
}
