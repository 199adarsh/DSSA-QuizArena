import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PasswordDialog({ isOpen, onClose, onConfirm }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleConfirm = () => {
    // TODO: Replace with a more secure password validation method
    if (password === 'restart') {
      onConfirm();
    } else {
      toast({
        title: 'Incorrect Password',
        description: 'Please enter the correct password to restart the quiz.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Password to Restart Quiz</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
