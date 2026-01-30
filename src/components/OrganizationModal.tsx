"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Trash2 } from "lucide-react";
import { Organization } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { organizationFormSchema, OrganizationFormValues } from "@/lib/validations/organization";

interface OrganizationModalProps {
  organization?: Organization | null;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (orgData: { id?: string; name: string; description?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function OrganizationModal({
  organization,
  isOpen,
  isCreating = false,
  onClose,
  onSave,
  onDelete,
}: OrganizationModalProps) {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      description: null,
    },
  });

  // Reset form when organization changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description || null,
      });
    } else if (isCreating) {
      form.reset({
        name: "",
        description: null,
      });
    }
  }, [organization, isCreating, form]);

  const onSubmit = async (values: OrganizationFormValues) => {
    try {
      await onSave({
        id: organization?.id,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save organization:", error);
      alert("Failed to save organization. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!organization?.id || !onDelete) return;
    if (!confirm("Delete this organization? This action cannot be undone.")) return;
    
    try {
      await onDelete(organization.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete organization:", error);
      alert("Failed to delete organization. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            <DialogTitle>
              {isCreating ? "New Organization" : "Edit Organization"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Organization Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter organization name..." 
                      autoFocus
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {organization && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
