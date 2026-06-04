import type { CollectionConfig } from "payload";

export const Media: CollectionConfig<"media"> = {
    slug: "media",
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "alt",
            type: "text",
        },
    ],
    upload: {
        crop: false,
        focalPoint: false,
    },
};
