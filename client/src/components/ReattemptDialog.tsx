import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { api } from "@shared/routes";
import { getHeaders } from "@/hooks/use-quiz";
import { useToast } from "@/hooks/use-toast";

interface ReattemptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReattemptDialog({ open, onOpenChange, onSuccess }: ReattemptDialogProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const reattemptMutation = useMutation({
    mutationFn: async (data: { password: string; reason?: string }) => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.reattempt.path, {
        method: api.quiz.reattempt.method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to request reattempt");
      }
      
      return api.quiz.reattempt.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      setPassword("");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request reattempt",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the admin password",
        variant: "destructive",
      });
      return;
    }
    reattemptMutation.mutate({ password, reason: reason.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Request Quiz Reattempt
          </DialogTitle>
          <DialogDescription>
            Enter the admin password to unlock the quiz for another attempt.
            This action will be logged for security purposes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Admin Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason (Optional)
            </label>
            <Textarea
              id="reason"
              placeholder="Why do you need to retake the quiz?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All reattempt requests are logged with user details, IP address, and timestamp.
              Unauthorized access will be recorded.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={reattemptMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={reattemptMutation.isPending}
              className="min-w-[100px]"
            >
              {reattemptMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Request Reattempt
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
