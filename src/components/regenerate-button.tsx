"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RegenerateDialog } from "@/components/regenerate-dialog";
import { regenerateScheduleAction } from "@/app/plans/[id]/actions";

type RegenerateButtonProps = {
  planId: string;
};

export function RegenerateButton({ planId }: RegenerateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleRegenerate() {
    const result = await regenerateScheduleAction(planId);
    if (!result.success) throw new Error(result.message);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Regenerate from today
      </Button>
      <RegenerateDialog
        planId={planId}
        open={open}
        onOpenChange={setOpen}
        onRegenerate={handleRegenerate}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
