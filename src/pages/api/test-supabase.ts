import { NextApiRequest, NextApiResponse } from 'next'
import { testSupabaseConnection } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isConnected = await testSupabaseConnection()
  if (isConnected) {
    res.status(200).json({ message: 'Supabase connection successful' })
  } else {
    res.status(500).json({ message: 'Supabase connection failed' })
  }
}
