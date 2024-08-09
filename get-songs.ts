import { z } from "zod";
import { readFile, writeFile, mkdir } from "node:fs/promises";

type Track = {
	title: string;
	artist: string;
	descriptionParagraphs: string[];
	artworkUrl: string;
	trackViewUrl: string;
	audioPreviewUrl: string;
};

async function main() {
	const text = await readFile("songs.txt", "utf-8");

	const trackTextBlocks = text.split("\n---\n");
	const tracks: Track[] = [];

	for (const block of trackTextBlocks) {
		const [title, artist, ...descriptionParagraphs] = block.trim().split(/\n+/);
		if (!title || !artist) {
			console.warn("Invalid track:", block.trim());
			continue;
		}

		const url = new URL("https://itunes.apple.com/search");
		url.searchParams.set("term", `${title} by ${artist}`);
		url.searchParams.set("media", "music");
		url.searchParams.set("entity", "musicTrack");
		url.searchParams.set("limit", "1");

		const res = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await res.json();
		const topResult = sampleValidator.parse(data).results[0];

		tracks.push({
			title: topResult.trackCensoredName,
			artist: topResult.artistName,
			descriptionParagraphs,
			trackViewUrl: topResult.trackViewUrl,
			artworkUrl: topResult.artworkUrl100.replace(
				/100x100bb\.jpg$/,
				"1080x1080bb.jpg",
			),
			audioPreviewUrl: topResult.previewUrl,
		});
	}

	const dotAstroDir = new URL(".astro/", import.meta.url);
	await mkdir(dotAstroDir, { recursive: true });

	const outputFile = new URL("songs.generated.json", dotAstroDir);
	await writeFile(outputFile, JSON.stringify(tracks, null, 2));
}

main();

const sample = {
	resultCount: 1,
	results: [
		{
			wrapperType: "track",
			kind: "song",
			artistName: "KÁRYYN",
			trackName: "Anthem For Those Who Know",
			trackCensoredName: "Anthem For Those Who Know",
			artistViewUrl:
				"https://music.apple.com/us/artist/k%C3%A1ryyn/1440475659?uo=4",
			trackViewUrl:
				"https://music.apple.com/us/album/anthem-for-those-who-know/1721614181?i=1721614182&uo=4",
			previewUrl:
				"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/ba/54/a2/ba54a28e-bc04-c28a-7064-ab28264ef0ae/mzaf_3670417671198364661.plus.aac.p.m4a",
			artworkUrl30:
				"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/4b/03/2b4b03ed-bf16-d366-96c0-4247c080326c/5400863154967.jpg/30x30bb.jpg",
			artworkUrl60:
				"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/4b/03/2b4b03ed-bf16-d366-96c0-4247c080326c/5400863154967.jpg/60x60bb.jpg",
			artworkUrl100:
				"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/4b/03/2b4b03ed-bf16-d366-96c0-4247c080326c/5400863154967.jpg/100x100bb.jpg",
			releaseDate: "2024-01-09T12:00:00Z",
			primaryGenreName: "Electronic",
		},
	],
};

const sampleValidator = z.object({
	resultCount: z.literal(1),
	results: z.array(
		z.object({
			wrapperType: z.literal("track"),
			kind: z.literal("song"),
			artistName: z.string(),
			trackName: z.string(),
			trackCensoredName: z.string(),
			artistViewUrl: z.string().url(),
			trackViewUrl: z.string().url(),
			previewUrl: z.string().url(),
			artworkUrl100: z
				.string()
				.url()
				.refine(
					(url) => url.endsWith("/100x100bb.jpg"),
					'Url must end with "/100x100bb.jpg"',
				),
			releaseDate: z.coerce.date(),
			primaryGenreName: z.string(),
		}),
	),
});
