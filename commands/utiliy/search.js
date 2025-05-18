const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search for tags on Gelbooru')
        .addStringOption(option =>
            option.setName('tags')
                .setDescription('just put in words, it probably figure it out')
                .setRequired(true)
        ),
	async execute(interaction) {
		const tags = interaction.options.getString('tags');
		const gelbooru = "http://gelbooru.com/";
		const tagsList = "index.php?page=dapi&s=tag&q=index";
		const fetchContent = async (url) => {
            try {
                const response = await axios.get(url);
                fs.writeFileSync('tags.txt', response.data, { encoding: 'utf-8' });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
		}
        const extractTags = () => {
            const contents = fs.readFileSync('tags.txt', { encoding: 'utf-8' });
            const pattern = /<name>(.*?)<\/name>/g;
            const tagCount = /<count>(.*?)<\/count>/g;
            const matches = [...contents.matchAll(pattern)].map(match => match[1]);
            const countNumber = [...contents.matchAll(tagCount)].map(match => parseInt(match[1]));
            if (matches.length !== countNumber.length) {
                console.error("Error", error);
                return [];
            }
            const arrayForEmbed = matches.map((name, index) => `${name} (${countNumber[index]} Post)`);
            const jsonA = JSON.stringify(matches)
            fs.writeFileSync('extractedTags.json', jsonA)
            return arrayForEmbed;
        };
        const main = async () => {
            if (!interaction.deferred && !interaction.replied) {
        		await interaction.deferReply();
    		}
            if (tags) {
                const url = `${gelbooru}${tagsList}&name_pattern=%${tags}%&limit=25&oderby=count`
                await fetchContent(url);
            } else if (tags.length === 0) {
              	const url = `${gelbooru}${tagsList}%&limit=25`
                await fetchContent(url);
            } else {
                await interaction.editReply("Something wrong with your input")
            }
            const extractedTags = extractTags();
            const fields = extractedTags.map(tag => ({
    			name: '',
    			value: tag.replace(/_/g, '\\_'),
                inline: false
			}));
                if (!extractedTags || extractedTags.length === 0) {
                    const url = `${gelbooru}${tagsList}&names=${tags}&limit=25&oderby=count`
                    await interaction.editReply("Tag not found\nRetrying...")
                    await fetchContent(url)
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Found tags with ${tags} in them`)
                        .setTimestamp()
                        .setFooter({ text: 'Due to code constrain, only 25 showed'})
                    	.addFields(...fields);
                    await interaction.editReply({ embeds : [embed]})
                    console.log(extractedTags);
                }
            const secondExtract = extractTags();
            const fields2 = secondExtract.map(tag => ({
                name: '',
                value: tag.replace(/_/g, '\\_'),
                inline: false
            }));
            	if (!secondExtract || secondExtract.length === 0) {
                    await interaction.editReply("Tag not found")
                } else if (extractedTags.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Found tags with ${tags} in them`)
                        .setTimestamp()
                        .setFooter({ text: 'Due to code constrain, only 25 showed'})
                    	.addFields(...fields2);
                    await interaction.editReply({ embeds : [embed]})
                    console.log(secondExtract);
                }
        };
    
        main();

	},
};