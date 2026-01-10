import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Key, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@shared/routes";
import { getHeaders } from "@/hooks/use-quiz";
import { useToast } from "@/hooks/use-toast";

interface ReattemptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReattemptDialog({
  open,
  onOpenChange,
  onSuccess,
}: ReattemptDialogProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reattemptMutation = useMutation({
    mutationFn: async (data: { password: string; reason?: string }) => {
      const headers = await getHeaders();

      if (!headers.Authorization) {
        throw new Error("User not authenticated");
      }

      const res = await fetch(api.quiz.reattempt.path, {
        method: api.quiz.reattempt.method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid password");
      }

      return api.quiz.reattempt.responses[200].parse(await res.json());
    },

    onSuccess: (data) => {
      toast({
        title: "Reattempt unlocked",
        description: data.message,
      });

      setPassword("");
      setReason("");
      onOpenChange(false);

      // CRITICAL: Clear all stale state
      queryClient.removeQueries({ queryKey: ["active-quiz"] });
      queryClient.invalidateQueries({ queryKey: [api.quiz.status.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.list.path] });

      onSuccess?.();
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock reattempt",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast({
        title: "Missing password",
        description: "Enter the admin password",
        variant: "destructive",
      });
      return;
    }

    reattemptMutation.mutate({
      password: password.trim(),
      reason: reason.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Unlock Reattempt
          </DialogTitle>
          <DialogDescription>
            Enter admin password to reset the quiz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Admin Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              placeholder="Why do you need a reattempt?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action is logged and audited.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={reattemptMutation.isPending}>
              {reattemptMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Unlock
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
