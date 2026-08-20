async function llamarClaude({ system, messages, tools, maxTokens = 1500 }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      ...(tools ? { tools } : {}),
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic: ${await res.text()}`);
  return res.json();
}

module.exports = { llamarClaude };
