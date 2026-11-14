export default function Loading() {
	return (
		<div role="status" aria-busy="true" className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center space-y-4">
				<div className="relative w-16 h-16 mx-auto" aria-hidden="true">
					<div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
					<div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin motion-reduce:animate-none"></div>
				</div>
				<p className="text-lg font-medium text-muted-foreground">Đang tải…</p>
			</div>
		</div>
	);
}
