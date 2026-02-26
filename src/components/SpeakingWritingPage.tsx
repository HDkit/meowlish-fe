import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Mic, PenTool } from 'lucide-react';
import { SpeakingTest } from './SpeakingTest';
import { WritingTest } from './WritingTest';

export function SpeakingWritingPage() {
	const [activeTab, setActiveTab] = useState<'speaking' | 'writing'>('speaking');

	return (
		<div className="min-h-screen bg-background">
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'speaking' | 'writing')} className="flex flex-col">
				{/* Tab Bar */}
				<div className="sticky top-0 z-40 bg-background/95 backdrop-blur">
					<div className="container mx-auto px-4">
						<TabsList className="w-full max-w-md mx-auto my-4">
							<TabsTrigger value="speaking" className="flex-1">
								<Mic className="h-4 w-4 mr-2" />
								Speaking
							</TabsTrigger>
							<TabsTrigger value="writing" className="flex-1">
								<PenTool className="h-4 w-4 mr-2" />
								Writing
							</TabsTrigger>
						</TabsList>
					</div>
				</div>

				{/* Content */}
				<TabsContent value="speaking" className="mt-0">
					<SpeakingTest />
				</TabsContent>
				<TabsContent value="writing" className="mt-0">
					<WritingTest />
				</TabsContent>
			</Tabs>
		</div>
	);
}

