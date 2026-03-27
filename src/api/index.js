'use strict';

const { createApp } = require('./server');

const PORT = process.env.PORT || 3001;

const app = createApp();
app.listen(PORT, () => {
  console.log(`PromptCraft API server running on http://localhost:${PORT}`);
});

module.exports = { createApp };
