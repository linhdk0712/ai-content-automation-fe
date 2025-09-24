// Browser-compatible EventEmitter implementation
export type BrowserEventListener = (arg?: unknown) => void;

export class BrowserEventEmitter {
	private events: Record<string, BrowserEventListener[]> = {};

	// Overloads for better generic inference at call sites
	on<T = unknown>(event: string, listener: (arg: T) => void): this;
	on(event: string, listener: BrowserEventListener): this;
	on(event: string, listener: BrowserEventListener): this {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener as BrowserEventListener);
		return this;
	}

    emit(event: string, ...args: unknown[]): boolean {
		if (!this.events[event]) {
			return false;
		}
        this.events[event].forEach((listener) => {
			try {
                listener(args[0]);
			} catch (error) {
				console.error(`Error in event listener for ${event}:`, error);
			}
		});
		return true;
	}

	off(event: string, listener?: BrowserEventListener): this {
		if (!this.events[event]) {
			return this;
		}
		if (listener) {
			this.events[event] = this.events[event].filter((registered) => registered !== listener);
		} else {
			delete this.events[event];
		}
		return this;
	}

	removeAllListeners(event?: string): this {
		if (event) {
			delete this.events[event];
		} else {
			this.events = {};
		}
		return this;
	}

	once(event: string, listener: BrowserEventListener): this {
		const onceWrapper: BrowserEventListener = (...args: unknown[]) => {
			this.off(event, onceWrapper);
			listener(...args);
		};
		return this.on(event, onceWrapper);
	}

	listenerCount(event: string): number {
		return this.events[event]?.length || 0;
	}

	eventNames(): string[] {
		return Object.keys(this.events);
	}
}
