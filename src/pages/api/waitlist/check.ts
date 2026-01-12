import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/v1/waitlist/check/${encodeURIComponent(email)}`
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Waitlist check error:', error);
    return res.status(500).json({ approved: false, on_waitlist: false });
  }
}

