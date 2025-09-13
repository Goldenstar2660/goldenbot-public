const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

const { Client, Collection, Events, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}
});

client.on('ready', () => {
	console.log(`Bot started as ${client.user.tag}!`);
	client.user.setPresence({
		activities: [{ name: `the Bedwor Brigade`, type: ActivityType.Watching }],
	});
});

const prefix = '!';
const API_KEY = 'bbd51129-1725-46c6-8253-c0770648e996';

let trackerPlayerName;
let trackerPlayerUUID;
let trackerChannelID;
let trackerTotalBWGamesPlayed = 0;
let trackerFoursBWGamesPlayed = 0;
let trackerThreesBWGamesPlayed = 0;
let trackerTwosBWGamesPlayed = 0;
let trackerOnesBWGamesPlayed = 0;
let trackerTotalBWWins = 0;
let trackerTotalBWLosses = 0;
let trackerRunning = false;
let trackerGamemode = '???';
let trackerStatus = '???';

const loadTrackingData = JSON.parse(fs.readFileSync('trackingData.json'));
trackerChannelID = loadTrackingData.trackerChannelID;
trackerPlayerName = loadTrackingData.trackerPlayerName;
trackerPlayerUUID = loadTrackingData.trackerPlayerUUID;

const saveTrackingData = () => {
	const trackingData = {
		trackerChannelID,
		trackerPlayerName,
		trackerPlayerUUID,
	};
	fs.writeFileSync('trackingData.json', JSON.stringify(trackingData));
};

const startTracker = () => {
	if (!trackerPlayerUUID) {
		return;
	}
	let url = `https://api.hypixel.net/player?key=${API_KEY}&uuid=${trackerPlayerUUID}`;
	axios
		.get(url)
		.then((response) => {
			const playerData = response.data.player;
			const bedwarsData = playerData.stats.Bedwars;
			trackerTotalBWGamesPlayed = bedwarsData.games_played_bedwars_1;
			trackerFoursBWGamesPlayed = bedwarsData.four_four_games_played_bedwars;
			trackerThreesBWGamesPlayed = bedwarsData.four_three_games_played_bedwars;
			trackerTwosBWGamesPlayed = bedwarsData.eight_two_games_played_bedwars;
			trackerOnesBWGamesPlayed = bedwarsData.eight_one_games_played_bedwars;
			trackerTotalBWWins = bedwarsData.wins_bedwars;
			trackerTotalBWLosses = bedwarsData.losses_bedwars;
		})
		.catch((error) => {
			console.log(error);
		});
	trackerInterval = setInterval(updateTrackerData, 5000);
	trackerRunning = true;
};

const stopTracker = () => {
	clearInterval(trackerInterval);
	trackerRunning = false;
};

const toggleTracker = () => {
	if (trackerRunning) {
		stopTracker();
	} else {
		startTracker();
	}
};

const HDLScores = [
	150.0, 149.06, 148.121, 147.181, 146.242, 145.302, 144.362, 143.423, 142.483, 141.544, 140.604, 139.664, 138.725, 137.785, 136.846, 135.906, 134.966, 134.027,
	133.087, 132.148, 131.208, 130.268, 129.329, 128.389, 127.45, 126.51, 125.57, 124.631, 123.691, 122.752, 121.812, 120.872, 119.933, 118.993, 118.054, 117.114,
	116.174, 115.235, 114.295, 113.356, 112.416, 111.477, 110.537, 109.597, 108.658, 107.718, 106.779, 105.839, 104.899, 103.96, 103.02, 102.081, 101.141, 100.201,
	99.262, 98.322, 97.383, 96.443, 95.503, 94.564, 93.624, 92.685, 91.745, 90.805, 89.866, 88.926, 87.987, 87.047, 86.107, 85.168, 84.228, 83.289, 82.349, 81.409, 80.47,
	79.53, 78.591, 77.651, 76.711, 75.772, 74.832, 73.893, 72.953, 72.013, 71.074, 70.134, 69.195, 68.255, 67.315, 66.376, 65.436, 64.497, 63.557, 62.617, 61.678, 60.738,
	59.799, 58.859, 57.919, 56.98, 56.04, 55.101, 54.161, 53.221, 52.282, 51.342, 50.403, 49.463, 48.523, 47.584, 46.644, 45.705, 44.765, 43.826, 42.886, 41.946, 41.007,
	40.067, 39.128, 38.188, 37.248, 36.309, 35.369, 34.43, 33.49, 32.55, 31.611, 30.671, 29.732, 28.792, 27.852, 26.913, 25.973, 25.034, 24.094, 23.154, 22.215, 21.275,
	20.336, 19.396, 18.456, 17.517, 16.577, 15.638, 14.698, 13.758, 12.819, 11.879, 10.94, 10.0,
];
var hardList = [];
var brinList = [];

const loadHDLData = JSON.parse(fs.readFileSync('hdlData.json'));
brinList = loadHDLData.brinList;

const saveHDLData = () => {
	const HDLData = {
		brinList,
	};
	fs.writeFileSync('hdlData.json', JSON.stringify(HDLData));
};

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

client.on('messageCreate', (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	if (command === 'bedwars') {
		const player = args.join(' ');
		let getUUID = `https://api.mojang.com/users/profiles/minecraft/${player}`;
		let UUID;
		let head;
		let name;
		axios
			.get(getUUID)
			.then((response) => {
				UUID = response.data.id;
				name = response.data.name;
				let url = `https://api.hypixel.net/player?key=${API_KEY}&uuid=${UUID}`;
				return axios.get(url);
			})
			.then((response) => {
				head = `https://mc-heads.net/head/${UUID}`;
				const playerData = response.data.player;
				const bedwarsData = playerData.stats.Bedwars;
				console.log(bedwarsData)
				const commaFormatOptions = { useGrouping: true };
				const bedwarsStatsEmbed = new EmbedBuilder()
					.setColor('#ffbf00')
					.setTitle(`${name}'s Bedwars Stats`)
					.setThumbnail(head)
					.addFields(
						{
							name: 'Star',
							value: playerData.achievements.bedwars_level.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'Winstreak',
							value: bedwarsData.winstreak?.toLocaleString(undefined, commaFormatOptions) ?? '???',
							inline: true,
						},
						{
							name: 'Coins',
							value: bedwarsData.coins.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'Wins',
							value: bedwarsData.wins_bedwars.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'Losses',
							value: bedwarsData.losses_bedwars.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'WLR',
							value: (bedwarsData.wins_bedwars / bedwarsData.losses_bedwars).toFixed(2),
							inline: true,
						},
						{
							name: 'Final Kills',
							value: bedwarsData.final_kills_bedwars.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'Final Deaths',
							value: bedwarsData.final_deaths_bedwars.toLocaleString(undefined, commaFormatOptions),
							inline: true,
						},
						{
							name: 'FKDR',
							value: (bedwarsData.final_kills_bedwars / bedwarsData.final_deaths_bedwars).toFixed(2),
							inline: true,
						}
					);
				message.channel.send({ embeds: [bedwarsStatsEmbed] });
			})
			.catch((error) => {
				console.log(error);
				message.channel.send('some error happened or something');
			});
	}
	if (command === 'trackingchannel' || command === 'tc') {
		message.delete();
		if (args[0] === 'current') {
			trackerChannelID = message.channel.id;
			message.channel.send(`<#${trackerChannelID}> has been set as the tracking channel!`);
			saveTrackingData();
		} else {
			trackerChannelID = args.join(' ');
			message.channel.send(`<#${trackerChannelID}> has been set as the tracking channel!`);
			saveTrackingData().catch((error) => {
				console.log(error);
				message.channel.send(`Invalid Channel Input`);
			});
		}
	}
	/*if (command === 'trackingplayer' || command === 'tp') {
		message.delete();
		trackerPlayerName = args.join(' ');
		let getUUID = `https://api.mojang.com/users/profiles/minecraft/${trackerPlayerName}`;
		axios
			.get(getUUID)
			.then((response) => {
				trackerPlayerUUID = response.data.id;
				trackerPlayerName = response.data.name;
				message.channel.send(`\`${trackerPlayerName}\` has been set as the player to track!`);
				saveTrackingData();
			})
			.catch((error) => {
				console.log(error);
				message.channel.send(`Invalid Player Input`);
			});
	}
	if (command === 'toggletracker' || command === 'tt') {
		message.delete();
		toggleTracker();
		if (trackerRunning == true) {
			const trackerEnableEmbed = new EmbedBuilder()
				.setColor('03fc28')
				.setTitle(`Tracker Enabled`)
				.addFields(
					{
						name: 'Tracking',
						value: trackerPlayerName,
						inline: true,
					},
					{
						name: 'Channel',
						value: `<#${trackerChannelID}>`,
						inline: false,
					}
				)
				.setFooter({ text: `Enabled by: ${message.author.tag}` });
			message.channel.send({ embeds: [trackerEnableEmbed] });
		} else if (trackerRunning == false) {
			const trackerDisableEmbed = new EmbedBuilder()
				.setColor('fc0303')
				.setTitle(`Tracker Disabled`)
				.setFooter({ text: `Disabled by: ${message.author.tag}` });
			message.channel.send({ embeds: [trackerDisableEmbed] });
		}
	}
	if (command === 'trackerinfo' || command === 'ti') {
		message.delete();
		if (trackerRunning == true) {
			const trackerInfoEmbed1 = new EmbedBuilder()
				.setColor('03fc28')
				.setTitle(`Tracker Info`)
				.addFields(
					{
						name: 'Currently Tracking',
						value: trackerPlayerName,
						inline: true,
					},
					{
						name: 'Current Channel',
						value: `<#${trackerChannelID}>`,
						inline: false,
					},
					{ name: 'Status', value: trackerStatus, inline: false }
				)
				.setFooter({ text: 'Tracker is On' });
			message.channel.send({ embeds: [trackerInfoEmbed1] });
		} else if (trackerRunning == false) {
			const trackerInfoEmbed1 = new EmbedBuilder()
				.setColor('fc0303')
				.setTitle(`Tracker Info`)
				.addFields(
					{
						name: 'Currently Set to Track',
						value: trackerPlayerName,
						inline: true,
					},
					{
						name: 'Current Channel',
						value: `<#${trackerChannelID}>`,
						inline: false,
					}
				)
				.setFooter({ text: 'Tracker is Off' });
			message.channel.send({ embeds: [trackerInfoEmbed1] });
		}
	}*/
	if (command === 'stop' && message.author.id === '384833618083577856') {
		console.log('Bot stopped via command');
		message.channel.send(':octagonal_sign: **Bot has catted**').then(() => {
			client.destroy();
		});
	}
	if (command === 'hdl') {
		(async () => {
			try {
				const browser = await puppeteer.launch({ headless: 'new' });
				const page = await browser.newPage();

				await page.goto('https://harddemonlist.pages.dev/#/', {
					waitUntil: 'networkidle2',
				});
				await page.waitForTimeout(1000);

				const html = await page.content();
				const $ = cheerio.load(html);

				hardList = [];
				$('.list tr').each((index, element) => {
					const level = $(element).find('.level button span').text();
					hardList.push(level.toLowerCase());
				});
				hardList.splice(150);
				var out = 0;
				for (var i = 0; i < brinList.length; i++) {
					if (!hardList.includes(brinList[i])) {
						brinList.splice(i, 1);
					}
					out += HDLScores[hardList.indexOf(brinList[i])];
				}
				const hdlInfoEmbed = new EmbedBuilder()
					.setColor('ffbf00')
					.setTitle(`HDL Info`)
					.addFields(
						{ name: 'Points', value: out.toFixed(3), inline: true },
						{
							name: 'Levels Complete',
							value: `${brinList.length.toString()}/150`,
							inline: false,
						}
					);
				message.channel.send({ embeds: [hdlInfoEmbed] });
				await browser.close();
			} catch (error) {
				console.log(error);
			}
		})();
	}
	if (command === 'hdlremove') {
		(async () => {
			try {
				const browser = await puppeteer.launch({ headless: 'new' });
				const page = await browser.newPage();

				await page.goto('https://harddemonlist.pages.dev/#/', {
					waitUntil: 'networkidle2',
				});
				await page.waitForTimeout(1000);

				const html = await page.content();
				const $ = cheerio.load(html);

				hardList = [];
				$('.list tr').each((index, element) => {
					const level = $(element).find('.level button span').text();
					hardList.push(level.toLowerCase());
				});
				hardList.splice(150);
				const removeLevels = message.content
					.slice(prefix.length)
					.trim()
					.replace(/^\S+\s*/, '')
					.toLowerCase()
					.split(', ');
				let removeLevelsList = '';
				for (var i = 0; i < removeLevels.length; i++) {
					if (hardList.includes(removeLevels[i]) && brinList.includes(removeLevels[i])) {
						brinList.splice(brinList.indexOf(removeLevels[i]), 1);
						removeLevelsList += `${removeLevels[i].toString()}\n`;
					}
				}
				var out = 0;
				for (var i = 0; i < brinList.length; i++) {
					if (!hardList.includes(brinList[i])) {
						brinList.splice(i, 1);
					}
					out += HDLScores[hardList.indexOf(brinList[i])];
				}
				const HDLAddEmbed = new EmbedBuilder()
					.setColor('EE4B2B')
					.setTitle(`Successfully Removed`)
					.setFooter({ text: `Total Points: ${out.toFixed(3)}` });
				if (removeLevelsList.length > 0) {
					HDLAddEmbed.setDescription(removeLevelsList);
				} else {
					HDLAddEmbed.setDescription('No levels were removed.');
				}
				message.channel.send({ embeds: [HDLAddEmbed] });
				saveHDLData();
				await browser.close();
			} catch (error) {
				console.log(error);
			}
		})();
	}
	if (command === 'hdladd') {
		(async () => {
			try {
				const browser = await puppeteer.launch({ headless: 'new' });
				const page = await browser.newPage();

				await page.goto('https://harddemonlist.pages.dev/#/', {
					waitUntil: 'networkidle2',
				});
				await page.waitForTimeout(1000);

				const html = await page.content();
				const $ = cheerio.load(html);

				hardList = [];
				$('.list tr').each((index, element) => {
					const level = $(element).find('.level button span').text();
					hardList.push(level.toLowerCase());
				});
				hardList.splice(150);
				const newLevels = message.content
					.slice(prefix.length)
					.trim()
					.replace(/^\S+\s*/, '')
					.toLowerCase()
					.split(', ');
				let newLevelsList = '';
				for (var i = 0; i < newLevels.length; i++) {
					if (hardList.includes(newLevels[i]) && !brinList.includes(newLevels[i])) {
						brinList.push(newLevels[i]);
						newLevelsList += `${newLevels[i].toString()}\n`;
					}
				}
				var out = 0;
				for (var i = 0; i < brinList.length; i++) {
					if (!hardList.includes(brinList[i])) {
						brinList.splice(i, 1);
					}
					out += HDLScores[hardList.indexOf(brinList[i])];
				}
				const HDLAddEmbed = new EmbedBuilder()
					.setColor('03fc28')
					.setTitle(`Successfully Added`)
					.setFooter({ text: `Total Points: ${out.toFixed(3)}` });
				if (newLevelsList.length > 0) {
					HDLAddEmbed.setDescription(newLevelsList);
				} else {
					HDLAddEmbed.setDescription('No new levels were added.');
				}
				message.channel.send({ embeds: [HDLAddEmbed] });
				saveHDLData();
				await browser.close();
			} catch (error) {
				console.log(error);
			}
		})();
	}
	if (command === 'statshelp') {
		const availableStats = Object.keys(aliases).join('\n');
		//message.channel.send(`Available categories: ${availableStats}`);
		const statsHelpEmbed = new EmbedBuilder()
			.setColor('#0080fe')
			.setTitle('Help')
			.addFields(
				{ name: 'Available Commands', value: `\`!statshelp\`\nThe help command.\n\`!stats <player> <category>.<statistic>\` \nReturns the value of a specific statistic for a given player.\n\`!stats <player> <category>.top\`\nReturns a top 10 leaderboard of the top statistics in a category for a given player.\n\`!stats global <category>.<statistic>\` \nReturns a server-wide leaderboard of the highest values for a given statistic.` },
				{ name: 'Example Commands', value: `\`!stats buoj mined.diamond_ore\`\n\`!stats buoj dropped.top\`\n\`!stats global killed.enderman\``},
				{ name: 'Available Categories', value: `${availableStats}` },
				{ name: 'Available General Stats', value: `[Full list here](https://minecraft.fandom.com/wiki/Statistics#List_of_custom_statistic_names)\nanimals_bred\nopen_chest\ndamage_dealt\nleave_game\nenchant_item\ndeaths\nplayer_kills\nraid_trigger\ntalked_to_villager\nplay_time\ntime_since_death\ntraded_with_villager` }
			);
		message.channel.send({ embeds: [statsHelpEmbed] });
	}
	if (command === 'stats') {
		(async () => {
			const player = args[0];
			const userStatistic = args.slice(1).join('.'); // Join arguments with period

			if (!player || !userStatistic) {
				message.channel.send('Usage: !stats <player> <statistic>');
				return;
			}

			try {
				const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${player}`);
				const uuid = response.data.id;
				const formattedUuid = `${uuid.substr(0, 8)}-${uuid.substr(8, 4)}-${uuid.substr(12, 4)}-${uuid.substr(16, 4)}-${uuid.substr(20)}`;

				const [userSubcategory, userStatisticParts] = userStatistic.split('.');
				if (!userSubcategory || !userStatisticParts) {
					message.channel.send('Invalid format. Usage: `!stats <player> <subcategory>.<statistic>`');
					return;
				}

				const subcategory = aliases[userSubcategory.toLowerCase()];
				if (!subcategory) {
					message.channel.send(`Category "${userSubcategory}" not found.`);
					return;
				}
				if (player === 'global') {
					let allPlayerStats = [];
					const fullStatistic = `minecraft:${userStatisticParts}`;
					const fetchPlayerStats = async (playerName) => {
						try {
						  const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
						  const uuid = response.data.id;
						  const formattedUuid = `${uuid.substr(0, 8)}-${uuid.substr(8, 4)}-${uuid.substr(12, 4)}-${uuid.substr(16, 4)}-${uuid.substr(20)}`;
					  
						  const statsFilePath = `${statsDirectory}${formattedUuid}.json`;
						  const fileContent = await fs.promises.readFile(statsFilePath, 'utf8');
						  const playerStats = JSON.parse(fileContent);
					  
						  allPlayerStats[playerName] = playerStats;
						} catch (error) {
						  console.error('Error fetching or reading player stats:', error);
						}
					};
					for (var i = 0; i < SMPplayers.length; i++) {
						fetchPlayerStats(SMPplayers[i]);
					}
					const fetchPromises = SMPplayers.map((playerName) => fetchPlayerStats(playerName));
					await Promise.all(fetchPromises);
					const globalTopStats = [];
					for (const [playerName, playerData] of Object.entries(allPlayerStats)) {
						if (playerData.stats && playerData.stats[subcategory] && playerData.stats[subcategory][fullStatistic]) {
							let value = playerData.stats[subcategory][fullStatistic];
							if (
								userStatisticParts == 'sneak_time' ||
								userStatisticParts == 'play_time' ||
								userStatisticParts == 'time_since_death' ||
								userStatisticParts == 'time_since_rest' ||
								userStatisticParts == 'total_world_time'
							) {
								value = ticksToTime(value);
							} else {
								value = value;
							}
							globalTopStats.push({
								player: playerName,
								value: value,
							});
						}
					}
					if (
						userStatisticParts == 'sneak_time' ||
						userStatisticParts == 'play_time' ||
						userStatisticParts == 'time_since_death' ||
						userStatisticParts == 'time_since_rest' ||
						userStatisticParts == 'total_world_time'
					) {
						globalTopStats.sort((a, b) => {
							const totalSecondsA = timeToTicks(a.value);
							const totalSecondsB = timeToTicks(b.value);
						  
							if (totalSecondsA < totalSecondsB) return 1;
							if (totalSecondsA > totalSecondsB) return -1;
							return 0;
						});
					} else {
						globalTopStats.sort((a, b) => b.value - a.value);
					}
					const topPlayers = globalTopStats.slice(0, 9);
					const statisticWithoutMinecraft = userStatisticParts.replace('minecraft:', '');
					const formattedStatisticName = statisticWithoutMinecraft.charAt(0).toUpperCase() + statisticWithoutMinecraft.slice(1);
					const formattedCategoryName = userSubcategory.charAt(0).toUpperCase() + userSubcategory.slice(1);
					let embedTitle;
					if (userSubcategory == 'general') {
						embedTitle = `Global Top ${formattedStatisticName} Statistics`;
					} else {
						embedTitle = `Global Top ${formattedStatisticName} ${formattedCategoryName} Statistics`;
					}
					const leaderboardEmbed = new EmbedBuilder()
						.setColor('#ffbf00')
						.setTitle(embedTitle)
						.addFields(
							{ name: 'Player', value: topPlayers.map((player) => player.player).join('\n'), inline: true },
							{ name: 'Value', value: topPlayers.map((player) => player.value.toLocaleString()).join('\n'), inline: true }
						);
					message.channel.send({ embeds: [leaderboardEmbed] });
				} else {
					const statsFilePath = `${statsDirectory}${formattedUuid}.json`;
					const fileContent = await fs.promises.readFile(statsFilePath, 'utf8');
					const playerStats = JSON.parse(fileContent);

					const fullStatistic = `minecraft:${userStatisticParts}`;

					const formattedCategoryName = userSubcategory.charAt(0).toUpperCase() + userSubcategory.slice(1);
					if (userStatisticParts === 'top' && userSubcategory != 'general') {
						const sortedStats = Object.entries(playerStats.stats[subcategory]).sort((a, b) => b[1] - a[1]);
						const topStats = sortedStats.slice(0, 10);

						const leaderboardEmbed = new EmbedBuilder()
							.setColor('#ffbf00')
							.setTitle(`Top 10 ${formattedCategoryName} Statistics for ${player}`)
							.addFields(
								{ name: 'Statistic', value: topStats.map((stat) => stat[0].replace('minecraft:', '')).join('\n'), inline: true },
								{ name: 'Value', value: topStats.map((stat) => stat[1].toLocaleString()).join('\n'), inline: true }
							);
						message.channel.send({ embeds: [leaderboardEmbed] });
					} else {
						if (!playerStats.stats || !playerStats.stats[subcategory] || !playerStats.stats[subcategory][fullStatistic]) {
							const notFoundEmbed = new EmbedBuilder()
								.setColor('#ff0000')
								.setTitle('Not Found')
								.addFields(
									{ name: 'Player', value: `${player}` },
									{ name: 'Category', value: `${userSubcategory}` },
									{ name: 'Statistic', value: `${userStatisticParts}` }
								);
							message.channel.send({ embeds: [notFoundEmbed] });
						} else {
							let value = playerStats.stats[subcategory][fullStatistic];
							if (
								userStatisticParts == 'sneak_time' ||
								userStatisticParts == 'play_time' ||
								userStatisticParts == 'time_since_death' ||
								userStatisticParts == 'time_since_rest' ||
								userStatisticParts == 'total_world_time'
							) {
								value = ticksToTime(value);
							} else {
								value = value.toLocaleString();
							}
							const successEmbed = new EmbedBuilder()
								.setColor('#00ff00')
								.setTitle(`${player}'s Statistics`)
								.addFields(
									{ name: 'Category', value: `${userSubcategory}` },
									{ name: 'Statistic', value: `${userStatisticParts}` },
									{ name: 'Value', value: `${value}` }
								);
							if (userSubcategory == 'general') {
								message.channel.send(`${player} has **${value}** of ${userStatisticParts}`);
							} else {
								message.channel.send(`${player} has ${userSubcategory} **${value}** ${userStatisticParts}`);
							}
						}
					}
				}
			} catch (error) {
				console.error('Error:', error);
				message.channel.send('An error occurred while fetching player stats.');
			}
		})();
	}
});

const SMPplayers = ['Goldenstar2660','Brinbobia','Jay_da_J','buoj','zSkfat','cappySlappy','irelya','_GLORYTOCHINA_','Melty333'];

function timeToTicks(timeString) {
	const timeComponents = timeString.split(', ').map(component => {
	  const [value, unit] = component.split(' ');
	  switch (unit) {
		case 'days': return Number(value) * 86400;
		case 'hours': return Number(value) * 3600;
		case 'minutes': return Number(value) * 60;
		case 'seconds': return Number(value);
		default: return 0;
	  }
	});
	return timeComponents.reduce((total, component) => total + component, 0);
  }

function ticksToTime(ticks) {
	const seconds = ticks / 20;
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	let timeString = '';
	if (days > 0) {
		timeString += `${days} days, `;
	}
	if (hours > 0 || timeString !== '') {
		timeString += `${hours} hours, `;
	}
	if (minutes > 0 || timeString !== '') {
		timeString += `${minutes} minutes, `;
	}
	timeString += `${remainingSeconds} seconds`;

	return timeString;
}

const updateTrackerData = () => {
	if (!trackerPlayerUUID) {
		return;
	}
	let url = `https://api.hypixel.net/player?key=${API_KEY}&uuid=${trackerPlayerUUID}`;
	const channel = client.channels.cache.get(trackerChannelID);
	axios
		.get(url)
		.then((response) => {
			const playerData = response.data.player;
			const bedwarsData = playerData.stats.Bedwars;
			if (bedwarsData.games_played_bedwars_1 > trackerTotalBWGamesPlayed) {
				trackerTotalBWGamesPlayed = bedwarsData.games_played_bedwars_1;
				channel.send(`<:game:1106323815266521150>\`${trackerPlayerName}\` started a new game of Bedwars! <t:${Math.round(Date.now() / 1000)}:R>`);
				trackerStatus = 'Playing';
			}
			if (bedwarsData.four_four_games_played_bedwars > trackerFoursBWGamesPlayed) {
				trackerFoursBWGamesPlayed = bedwarsData.four_four_games_played_bedwars;
				trackerGamemode = 'Fours';
			} else if (bedwarsData.four_three_games_played_bedwars > trackerThreesBWGamesPlayed) {
				trackerThreesBWGamesPlayed = bedwarsData.four_three_games_played_bedwars;
				trackerGamemode = 'Threes';
			} else if (bedwarsData.eight_two_games_played_bedwars > trackerTwosBWGamesPlayed) {
				trackerTwosBWGamesPlayed = bedwarsData.eight_two_games_played_bedwars;
				trackerGamemode = 'Doubles';
			} else if (bedwarsData.eight_one_games_played_bedwars > trackerOnesBWGamesPlayed) {
				trackerOnesBWGamesPlayed = bedwarsData.eight_one_games_played_bedwars;
				trackerGamemode = 'Solos';
			} else {
				trackerGamemode = '4v4';
			}
			if (bedwarsData.wins_bedwars > trackerTotalBWWins) {
				trackerTotalBWWins = bedwarsData.wins_bedwars;
				channel.send(`<:win:1106323813647519875>\`${trackerPlayerName}\` won a game of Bedwars ${trackerGamemode}! <t:${Math.round(Date.now() / 1000)}:R>`);
				trackerStatus = 'Lobby/Queuing';
			} else if (bedwarsData.losses_bedwars > trackerTotalBWLosses) {
				console.log(trackerFoursBWGamesPlayed);
				trackerTotalBWLosses = bedwarsData.losses_bedwars;
				channel.send(`<:loss:1106323812691222620>\`${trackerPlayerName}\` lost a game of Bedwars ${trackerGamemode}! <t:${Math.round(Date.now() / 1000)}:R>`);
				trackerStatus = 'Lobby/Queuing';
			}
		})
		.catch((error) => {
			console.log(error);
		});
};

client.login(token);
