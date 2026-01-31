import { z } from "zod";

export const organizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").nullable(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
