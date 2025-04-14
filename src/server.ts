import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
import OpenAI from 'openai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Stream Client
const chatClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!,
);

// Initialize Open AI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Register user with Stream Chat
app.post(
  '/register-user',
  async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    try {
      const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Check if user exists
      const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });

      if (!userResponse.users.length) {
        // Add new user to stream
        await chatClient.upsertUser({
          id: userId,
          name: name,
          email: email,
          role: 'user',
        });
      }

      res.status(200).json({ userId, name, email });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

// Send message to AI
app.post('/chat', async (req: Request, res: Response): Promise<any> => {
  const { message, userId } = req.body || {};

  if (!message || !userId) {
    return res.status(400).json({ error: 'Message and user are required' });
  }

  try {
    // Verify user exists
    const userResponse = await chatClient.queryUsers({ id: userId });

    if (!userResponse.users.length) {
      return res
        .status(404)
        .json({ error: 'user not found. Please register first' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: message,
    });

    const aiMessage: string =
      response.choices[0].message?.content ?? 'No response from AI';

    console.log(aiMessage);
    res.status(200).json({ reply: aiMessage });
  } catch (error) {
    console.log('Error generating AI response', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
