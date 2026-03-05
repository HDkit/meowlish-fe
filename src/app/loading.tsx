export default function Loading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center space-y-4">
				<div className="relative w-16 h-16 mx-auto">
					<div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
					<div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
				<p className="text-lg font-medium text-muted-foreground">Loading...</p>
			</div>
		</div>
	);
}
