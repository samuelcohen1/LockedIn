module.exports = function buildPrompt({ title, url }) {
  return `
  You are an AI assistant helping classify websites based on how likely they are to contribute to a student's productivity.
  
  Classify each website as:
  - "productive": educational, research-based, goal-driven, academic or work-related tools
  - "unproductive": distracting entertainment, social media, or unrelated to productivity goals
  - "neutral": ambiguous use, not enough information, or basic links such as a new tab in Google search

  Consider both the **title** and **URL**.
  
  Examples:
  
  ✅ Productive:
  - https://khanacademy.org — free educational platform
  - https://docs.google.com — document creation for assignments
  - https://stackoverflow.com — reference for coding help
  - https://linkedin.com — job browsing
  - https://canvas.com - school website
  
  ❌ Unproductive:
  - https://youtube.com/watch?v=cat-video — entertainment
  - https://tiktok.com — short-form entertainment
  - https://reddit.com/r/memes — meme content
  - https://amazon.com — shopping
  
  🟡 Neutral:
  - https://discord.com — depends on use
  - https://gmail.com - could go either way
  
  Now classify this website:
  Title: "${title}"
  URL: ${url}
  
  Only respond with one of the following: **productive**, **unproductive**, or **neutral** — no explanation and no extra spacing.
    `;
};
