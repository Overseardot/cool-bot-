require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create the default server structure.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available bot commands.'),
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('Slash commands registered.');
}

async function createRoleIfMissing(guild, name, permissions = []) {
  const existing = guild.roles.cache.find(role => role.name === name);
  if (existing) return existing;

  return guild.roles.create({
    name,
    permissions,
    reason: 'Server setup by cool-bot',
  });
}

async function createCategoryIfMissing(guild, name) {
  const existing = guild.channels.cache.find(
    channel => channel.type === ChannelType.GuildCategory && channel.name === name,
  );
  if (existing) return existing;

  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    reason: 'Server setup by cool-bot',
  });
}

async function createChannelIfMissing(guild, name, type, parent = null) {
  const existing = guild.channels.cache.find(
    channel => channel.name === name && channel.type === type && channel.parentId === parent?.id,
  );
  if (existing) return existing;

  return guild.channels.create({
    name,
    type,
    parent: parent?.id,
    reason: 'Server setup by cool-bot',
  });
}

async function setupServer(guild) {
  await createRoleIfMissing(guild, 'Administrator', [
    PermissionFlagsBits.Administrator,
  ]);
  await createRoleIfMissing(guild, 'Moderator', [
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
  ]);
  await createRoleIfMissing(guild, 'Member');
  await createRoleIfMissing(guild, 'Recruit');

  const information = await createCategoryIfMissing(guild, 'INFORMATION');
  const command = await createCategoryIfMissing(guild, 'COMMAND');
  const operations = await createCategoryIfMissing(guild, 'OPERATIONS');
  const voice = await createCategoryIfMissing(guild, 'VOICE');

  await createChannelIfMissing(guild, 'rules', ChannelType.GuildText, information);
  await createChannelIfMissing(guild, 'announcements', ChannelType.GuildText, information);
  await createChannelIfMissing(guild, 'information', ChannelType.GuildText, information);

  await createChannelIfMissing(guild, 'command-chat', ChannelType.GuildText, command);
  await createChannelIfMissing(guild, 'orders', ChannelType.GuildText, command);
  await createChannelIfMissing(guild, 'reports', ChannelType.GuildText, command);

  await createChannelIfMissing(guild, 'command-room', ChannelType.GuildText, operations);
  await createChannelIfMissing(guild, 'applications', ChannelType.GuildText, operations);
  await createChannelIfMissing(guild, 'archives', ChannelType.GuildText, operations);

  await createChannelIfMissing(guild, 'Command Room', ChannelType.GuildVoice, voice);
  await createChannelIfMissing(guild, 'Operations', ChannelType.GuildVoice, voice);
  await createChannelIfMissing(guild, 'General', ChannelType.GuildVoice, voice);
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await registerCommands();
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'help') {
    await interaction.reply({
      content: '**cool-bot commands**\n`/setup` — create the default server structure (Administrator only).\n`/help` — show this help message.',
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === 'setup') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'You need Administrator permission to run setup.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await setupServer(interaction.guild);
      await interaction.editReply('Server setup complete. Existing matching roles and channels were preserved.');
    } catch (error) {
      console.error('Server setup failed:', error);
      await interaction.editReply('Setup failed. Check the bot permissions and console logs.');
    }
  }
});

client.login(token);
