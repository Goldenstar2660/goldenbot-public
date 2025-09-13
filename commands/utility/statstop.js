const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const statsDirectory = 'C:/Users/Derek Chen/Desktop/Derek/SMP Folders/Golden SMP 6/world/stats/';
const aliases = {
	general: 'minecraft:custom',
	killed: 'minecraft:killed',
	used: 'minecraft:used',
	mined: 'minecraft:mined',
	pickedup: 'minecraft:picked_up',
	broken: 'minecraft:broken',
	dropped: 'minecraft:dropped',
	crafted: 'minecraft:crafted',
};

async function getTopStats(player, userSubcategory) {
	const subcategory = aliases[userSubcategory.toLowerCase()];
	try {
		const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${player}`);
		const uuid = response.data.id;
		const formattedUuid = `${uuid.substr(0, 8)}-${uuid.substr(8, 4)}-${uuid.substr(12, 4)}-${uuid.substr(16, 4)}-${uuid.substr(20)}`;
		const statsFilePath = `${statsDirectory}${formattedUuid}.json`;
		const fileContent = await fs.promises.readFile(statsFilePath, 'utf8');
		const playerStats = JSON.parse(fileContent);
		const formattedCategoryName = userSubcategory.charAt(0).toUpperCase() + userSubcategory.slice(1).toLowerCase();
		const sortedStats = Object.entries(playerStats.stats[subcategory]).sort((a, b) => b[1] - a[1]);
		const topStats = sortedStats.slice(0, 10);
		const leaderboardEmbed = new EmbedBuilder()
			.setColor('#ffbf00')
			.setTitle(`Top 10 ${formattedCategoryName} Statistics for ${player}`)
			.addFields(
				{ name: 'Statistic', value: topStats.map((stat) => stat[0].replace('minecraft:', '')).join('\n'), inline: true },
				{ name: 'Value', value: topStats.map((stat) => stat[1].toLocaleString()).join('\n'), inline: true }
			);
		return leaderboardEmbed;
	} catch (error) {
		console.error('Error:', error);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('statstop')
		.setDescription(`View a player's top stats in different categories!`)
		.addStringOption((option) => option.setName('player').setDescription(`The player to look up`).setRequired(true)),
	async execute(interaction) {
		let player = interaction.options.getString('player');
		console.log(`Command executed for ${player}`);
		const topStatsEmbed = await getTopStats(player, 'general');
		await interaction.reply({ embeds: [topStatsEmbed] });
	},
};
