'use client';

import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useState } from 'react';

interface AdminSetupClientProps {
  userInfo: {
    userId: string;
    email: string;
  };
}

export function AdminSetupClient({ userInfo }: AdminSetupClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMakeAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok) {
        alert('Successfully added as admin! You can now access the admin dashboard.');
        window.location.href = '/admin';
      } else {
        alert(`Error: ${result.error || 'Failed to add admin'}`);
      }
    } catch (error) {
      alert('Error: Failed to make admin request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleMakeAdmin} 
      className="w-full" 
      disabled={isLoading}
    >
      <Shield className="w-4 h-4 mr-2" />
      {isLoading ? 'Adding...' : 'Make Me Admin'}
    </Button>
  );
}
