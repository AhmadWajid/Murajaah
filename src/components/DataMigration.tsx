'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { migrateToDatabase } from '@/lib/storageService';
import { getAllMemorizationItems as getLocalItems } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Upload, AlertCircle, Loader2 } from 'lucide-react';

export function DataMigration() {
  const { user } = useAuth();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [error, setError] = useState('');
  const [localItemCount, setLocalItemCount] = useState(0);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Check if there's local data to migrate
      try {
        const localItems = getLocalItems();
        setLocalItemCount(localItems.length);
        setHasLocalData(localItems.length > 0);
        
        // Check if migration was already done
        const migrationDone = localStorage.getItem('mquran_migration_done');
        setMigrated(migrationDone === 'true');
      } catch (error) {
        console.error('Error checking local data:', error);
      }
    }
  }, [user]);

  const handleMigration = async () => {
    setMigrating(true);
    setError('');
    
    try {
      await migrateToDatabase();
      
      // Mark migration as completed
      localStorage.setItem('mquran_migration_done', 'true');
      setMigrated(true);
      
      // Optionally clear localStorage after successful migration
      // localStorage.clear(); // Uncomment if you want to clear all localStorage
      
    } catch (error: any) {
      setError(error.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const skipMigration = () => {
    localStorage.setItem('mquran_migration_done', 'true');
    setMigrated(true);
  };

  if (!user || !hasLocalData || migrated) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Migrate Your Data
          </CardTitle>
          <CardDescription>
            We found {localItemCount} memorization items in your local storage. 
            Would you like to migrate them to your cloud account?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleMigration} 
              disabled={migrating}
              className="w-full"
            >
              {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {migrating ? 'Migrating...' : 'Yes, Migrate My Data'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={skipMigration}
              disabled={migrating}
              className="w-full"
            >
              Skip Migration
            </Button>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Your local data will remain safe during migration. 
              This process syncs your progress to the cloud so you can access it from any device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}