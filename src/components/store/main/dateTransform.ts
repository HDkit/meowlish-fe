import { createTransform } from 'redux-persist';

/**
 * Recursively converts ISO date strings in an object back to Date objects
 */
function reviveDates(obj: any): any {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(obj)) {
		return new Date(obj);
	}
	if (Array.isArray(obj)) return obj.map(reviveDates);
	if (typeof obj === 'object') {
		return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, reviveDates(v)]));
	}
	return obj;
}

/**
 * Create a date transform for redux-persist
 * @param sliceName Slice to apply the transform to
 */
export const createDateTransform = (sliceName: string) =>
	createTransform(
		// inbound: before saving to storage, just pass through
		(inboundState) => inboundState,
		// outbound: after loading from storage, convert strings to Date
		(outboundState) => reviveDates(outboundState),
		{ whitelist: [sliceName] }
	);
