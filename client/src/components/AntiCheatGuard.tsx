import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFinishQuiz } from "@/hooks/use-quiz";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface AntiCheatGuardProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function AntiCheatGuard({ children, isActive }: AntiCheatGuardProps) {
  const { toast } = useToast();
  const { mutate: finishQuiz } = useFinishQuiz();
  const violations = useRef(0);
  const [showWarning, setShowWarning] = useState(false);
  const locked = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    const handleViolation = () => {
      if (locked.current) return;

      violations.current += 1;

      if (violations.current < 3) {
        setShowWarning(true);
        toast({
          title: "Focus Warning ⚠️",
          description: `You left the quiz tab. Warning ${violations.current}/3.`,
          variant: "destructive",
          duration: 4000,
        });
      } else {
        locked.current = true;
        toast({
          title: "Quiz Terminated",
          description: "Multiple violations detected. Submitting your quiz.",
          variant: "destructive",
          duration: 8000,
        });
        finishQuiz();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const handleBlur = () => handleViolation();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isActive, toast, finishQuiz]);

  return (
    <>
      {children}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Focus Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Leaving the quiz tab is not allowed.
              <br />
              <strong className="block mt-2">
                Warning {violations.current} of 3
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => setShowWarning(false)}
            className="w-full"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
