const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('safebooru')
		.setDescription('Extract SAFE-ish images from Gelbooru')
        .addStringOption(option =>
            option.setName('tags')
                .setDescription('ex: white_hair 1girl')
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('amounts')
                .setDescription('No input means 1')
        ),
	async execute(interaction) {
		const tags = interaction.options.getString('tags') ?? 'sort:updated rating:general';
		const userinput2 = interaction.options.getString('amounts') ?? 1;
		const gelbooru = "http://gelbooru.com/";
		const key = "&api_key=7ac18acff5d04b6e54b4712a21a11aa7795522fd7e5032e4db782fe6e8136193&user_id=822096";
		const posts = "/index.php?page=dapi&s=post&q=index";
		const fetchContent = async (url) => {
            try {
                const response = await axios.get(url);
                fs.writeFileSync('extractedMedia.txt', response.data, { encoding: 'utf-8' });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
		}
        const extractUrls = () => {
            const contents = fs.readFileSync('extractedMedia.txt', { encoding: 'utf-8' });
            const pattern = /https:\/\/img4\.gelbooru\.com\/images\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\.(?:jpeg|png|jpg|gif)|https:\/\/video\-cdn1\.gelbooru\.com\/images\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\.(?:mp4|webm)/g;
            const matches = contents.match(pattern);
            return matches;
        };
        const main = async () => {
            const formattedTags = tags.replace(/ /g, "+");
            if (!interaction.deferred && !interaction.replied) {
        		await interaction.deferReply();
    		}
            if (parseInt(userinput2) > 1) {
                for (let y = 0; y < parseInt(userinput2); y++) {
                    const url = `${gelbooru}${posts}&limit=${y + 1}&pid=${rng_pid}&tags=${formattedTags}+sort%3arandom+rating%3ageneral${key}`;
                    await fetchContent(url);
                }
            } else if (parseInt(userinput2) === 1) {
                const url = `${gelbooru}${posts}&limit=1&tags=${formattedTags}+sort%3arandom+rating%3ageneral${key}`;
                await fetchContent(url);
            }
            const urls = extractUrls();
            if (!urls) {
                await interaction.editReply("No images found.\nOr your tag got NSFW filtered.");
            } else {
                for (const url of urls) {
                    await interaction.followUp(url);
                }
                console.log(urls, tags)
            }
        };
        main();
	},
};