const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

const API_KEY = 'bbd51129-1725-46c6-8253-c0770648e996';

const createBedwarsEmbed = async (player) => {
    let getUUID = `https://api.mojang.com/users/profiles/minecraft/${player}`
    let UUID;
    let head;
    let name;
    try {
        const response = await axios.get(getUUID);
        UUID = response.data.id;
        name = response.data.name;
        console.log(`UUID for ${name} is ${UUID}`);
        let url = `https://api.hypixel.net/player?key=${API_KEY}&uuid=${UUID}`;
        const response2 = await axios.get(url);
        head = `https://mc-heads.net/head/${UUID}`;
        const playerData = response2.data.player;
        const bedwarsData = playerData.stats.Bedwars;
        const commaFormatOptions = { useGrouping: true };
        const bedwarsStatsEmbed = new EmbedBuilder()
            .setColor('#ffbf00')
            .setTitle(`${name}'s Bedwars Stats`)
            .setThumbnail(head)
            .addFields(
                { name: 'Star', value: playerData.achievements.bedwars_level.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'Winstreak', value: bedwarsData.winstreak?.toLocaleString(undefined, commaFormatOptions) ?? '???', inline: true },
                { name: 'Coins', value: bedwarsData.coins.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'Wins', value: bedwarsData.wins_bedwars.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'Losses', value: bedwarsData.losses_bedwars.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'WLR', value: (bedwarsData.wins_bedwars/bedwarsData.losses_bedwars).toFixed(2), inline: true },
                { name: 'Final Kills', value: bedwarsData.final_kills_bedwars.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'Final Deaths', value: bedwarsData.final_deaths_bedwars.toLocaleString(undefined, commaFormatOptions), inline: true },
                { name: 'FKDR', value: (bedwarsData.final_kills_bedwars/bedwarsData.final_deaths_bedwars).toFixed(2), inline: true },
            );
        return bedwarsStatsEmbed;
    } catch (error) {
        console.log(error);
        throw new Error('An error occurred while getting Bedwars stats.');
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bedwars')
        .setDescription(`View a player's Bedwars stats!`)
        .addStringOption(option =>
            option.setName('player')
                .setDescription(`The player to look up`)
                .setRequired(true)),
    async execute(interaction) {
        let player = interaction.options.getString('player');
        console.log(`Command executed for ${player}`);
        const bedwarsStatsEmbed1 = await createBedwarsEmbed(player);
        await interaction.reply({ embeds: [bedwarsStatsEmbed1] });
    },
};
