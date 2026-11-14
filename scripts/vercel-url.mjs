// Reads `vercel deploy` stdout on stdin and prints one URL: the deployment's own URL, or with
// --production the project's stable production URL. CLI 65+ prints JSON when stdout isn't a TTY;
// older versions print the bare URL, which is passed through.
let raw = '';
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
	const text = raw.trim();
	let url = text.split('\n').pop() ?? '';
	if (text.startsWith('{')) {
		const { deployment } = JSON.parse(text);
		url = process.argv.includes('--production') ? deployment.productionUrl : deployment.url;
	}
	if (!/^https:\/\//.test(url)) {
		console.error(`Could not read a deployment URL from the Vercel CLI output:\n${text}`);
		process.exit(1);
	}
	console.log(url);
});
