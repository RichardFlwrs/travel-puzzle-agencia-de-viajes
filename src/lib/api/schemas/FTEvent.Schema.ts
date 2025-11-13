import z from "zod";

// Helper to transform numeric booleans (0/1) to JavaScript booleans
const numericBoolean = z.union([z.literal(0), z.literal(1)]).transform((val) => val === 1);

export const zFTEventDetail = z.object({
    id: z.number(),
    isAvailable: numericBoolean,
    minAdultsPerBooking: z.number(),
    availableAdultPlaces: z.number(),
    availableChildrenPlaces: z.number(),
    isPhoneRequired: numericBoolean,
    fullPricePerGroup: z.record(z.string(), z.number()),
    payableNowPricePerGroup: z.record(z.string(), z.number()),
    isPartiallyPaid: numericBoolean,
});

export type IzFTEventDetail = z.infer<typeof zFTEventDetail>;