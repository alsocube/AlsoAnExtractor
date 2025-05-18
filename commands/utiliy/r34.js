const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('r34')
        .setDescription('Extract images from Rule34')
        .addStringOption(option =>
            option.setName('tags')
                .setDescription('ex: white_hair 1girl')
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('amounts')
                .setDescription('no input == 1')
        ),
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply();
            }
            
            if (!interaction.channel.nsfw) {
                await interaction.editReply('This command can only be used in NSFW channels.');
                return;
            }
            const tags = interaction.options.getString('tags') ?? 'sort:updated';
            const userinput2 = interaction.options.getString('amounts') ?? 1;
            const r34 = "http://api.rule34.xxx/";
            const posts = "index.php?page=dapi&s=post&q=index";
            const key = "&api_key=7ac18acff5d04b6e54b4712a21a11aa7795522fd7e5032e4db782fe6e8136193&id=1345747";
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
                const pattern = /https:\/\/api-cdn.rule34.xxx\/images\/[0-9]+\/[a-zA-Z0-9]+\.(?:jpeg|png|jpg|gif|mp4)/g;
                const matches = contents.match(pattern);
                return matches;
            };
            
            const main = async () => {
                if (parseInt(userinput2) > 1 && !String(tags).startsWith("id")) {
                    for (let y = 0; y < parseInt(userinput2); y++) {
                        const url = `${r34}${posts}&limit=${y + 1}&tags=${tags}${key}`;
                        await fetchContent(url);
                    }
                } else if (parseInt(userinput2) == 1) {
                    const url = `${r34}${posts}&limit=1&tags=${tags}${key}`;
                    await fetchContent(url);
                }
                const urls = extractUrls();
                if (!urls || urls.length === 0) {
                    await interaction.editReply("No images found.");
                    console.log(urls, tags);
                } else {
                    await interaction.editReply({ files: urls });
                }
            };
        main();
    }
}