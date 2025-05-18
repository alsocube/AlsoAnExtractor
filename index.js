const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { default: axios } = require('axios');
const { url } = require('node:inspector');

const commands = [];
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
    	const gelbooru = "http://gelbooru.com/";
    	const tagsList = "index.php?page=dapi&s=tag&q=index";
    	try {
            const focusedValue = interaction.options.getFocused(true).value;
            const lastTag = focusedValue.split(" ").pop();
            const apiUrl = `${gelbooru}${tagsList}&name_pattern=%${lastTag}%&orderby=count`;
    	    const response = await axios.get(apiUrl);
    	    const write = fs.writeFileSync('tags.txt', response.data, { encoding: 'utf-8' });
            const contents = fs.readFileSync('tags.txt', { encoding: 'utf-8' });
    	    const pattern = /<name>(.*?)<\/name>/g;
    	    const matches = [...contents.matchAll(pattern)].map(match => match[1]);
    	    const choices = matches.slice(0, 25);
            
    	    await interaction.respond(choices.map(choice => ({ name: choice, value: choice })));
    	} catch (error) {
    	    // ...
    	}
    }


    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await interaction.deferReply();
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error executing this command.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error executing this command.', ephemeral: true });
            }
        }
    }
});

client.login(token);