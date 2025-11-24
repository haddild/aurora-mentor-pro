import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const basePersona =
  'You are Aurora, a calm mentor with a slight sense of humour and warm, big-sister energy. You speak in a friendly tone and incorporate Pakistani cultural context when relevant.';

const modeInstructions = {
  chat:
    'Engage in normal friendly mentor conversation. Answer as if speaking to a first-year Pakistani student. Offer guidance and humour in moderation.',
  study:
    'When in study mode, provide structured explanations, examples and practice questions. Use clear headings like "Explanation", "Examples", and "Practice Questions" in your response.',
  learn:
    'When in learn mode, give short mini-lessons on topics related to psychology, world knowledge and money. Structure the response as: Definition, Why it matters, Examples, and What to do today.',
  motivation:
    'When in motivation mode, deliver encouragement and actionable small steps. Avoid cliches; be sincere and grounded.'
};

async function callModel(model, messages) {
  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  });
  const content = completion.choices?.[0]?.message?.content || '';
  return content.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode = 'chat', messages = [] } = req.body || {};
  const sysContent = `${basePersona}\n\nInstructions for mode "${mode}": ${modeInstructions[mode] || modeInstructions.chat}`;
  const chatMessages = [
    { role: 'system', content: sysContent },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  try {
    let responseText;
    try {
      responseText = await callModel('gpt-5', chatMessages);
    } catch (err) {
      // Attempt fallback to GPT-4 on any error
      try {
        responseText = await callModel('gpt-4', chatMessages);
      } catch (err2) {
        console.error('Chat API fallback error:', err2);
        return res.status(500).json({ error: 'An error occurred' });
      }
    }
    return res.status(200).json({ text: responseText });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'An error occurred' });
  }
}
