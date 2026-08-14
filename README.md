# cool-bot

A Discord server setup bot built with Node.js and discord.js.

## Features

- `/setup` creates a ready-to-use server structure.
- `/help` shows available commands.
- Existing matching roles and channels are preserved.
- Secrets are loaded from environment variables and are not stored in Git.

## Setup

1. Install Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
```

4. Invite the bot to your Discord server with the `bot` and `applications.commands` scopes. The bot needs permission to manage roles and channels. Administrator permission is the simplest setup for this project.
5. Start the bot:

```bash
npm start
```

6. Run `/setup` in the server as an Administrator.

