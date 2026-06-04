import type { CollectionConfig } from "payload";

export const Users: CollectionConfig<"users"> = {
    slug: "users",
    admin: {
        useAsTitle: "email",
    },
    auth: true,
    fields: [
        {
            type: "row",
            fields: [
                {
                    name: "firstName",
                    type: "text",
                },
                {
                    name: "lastName",
                    type: "text",
                },
            ],
        },
    ],
};
