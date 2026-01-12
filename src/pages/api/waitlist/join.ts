import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, name, sport } = req.body;

    if (!email || !name || !sport) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Send to backend to store in database
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/waitlist/join`,
      { email, name, sport }
    );

    return res.status(200).json({ message: 'Successfully joined waitlist' });
  } catch (error: any) {
    console.error('Waitlist error:', error);
    
    if (error.response?.status === 400) {
      return res.status(400).json({ message: error.response.data.detail || 'Failed to join waitlist' });
    }
    
    return res.status(500).json({ message: 'Failed to join waitlist' });
  }
}

