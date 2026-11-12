/** The postal sorting area (a pincode's first three digits): enough to debug, not a location. */
export const postalArea = (pincode: string): string => pincode.slice(0, 3);
